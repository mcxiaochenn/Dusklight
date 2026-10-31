"""私有备份 -> Artrans；导入后逐条核对 SQLite 并生成无个人信息的锚点映射。

所有输出必须放在仓库外。不会连接或修改生产 MongoDB。
"""
import argparse
import collections
import datetime
import hashlib
import json
import pathlib
import re
import sqlite3


def read(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8-sig"))


def write(path, value):
    path = pathlib.Path(path)
    # 备份、转换结果以及映射均不覆盖，避免重复导入时混淆批次。
    with path.open("x", encoding="utf-8") as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.write("\n")


def scalar(value):
    if isinstance(value, dict):
        if "$oid" in value:
            return value["$oid"]
        if "$numberLong" in value:
            return int(value["$numberLong"])
        if "$date" in value:
            return scalar(value["$date"])
    return value


def date(value):
    value = scalar(value)
    if isinstance(value, (float, int)):
        result = datetime.datetime.fromtimestamp(value / 1000, datetime.timezone.utc)
    else:
        result = datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if result.tzinfo is None:
            raise ValueError("源时间缺少时区")
    return result.astimezone(datetime.timezone.utc)


def page_key(path, aliases):
    if not isinstance(path, str) or not path.startswith("/") or "?" in path or "#" in path:
        raise ValueError("源页面键必须是非空站内路径")
    key = "/" if path == "/" else "/" + path.strip("/") + "/"
    return aliases.get(key, key)


def convert(backup, output, rules):
    backup, output = pathlib.Path(backup), pathlib.Path(output)
    if output.exists():
        raise ValueError("输出目录已存在，请使用新批次目录")
    source = read(backup / "comment.private.json")
    config = read(backup / "config.private.json")[0]
    aliases = read(rules)
    ids = [str(scalar(c["_id"])) for c in source]
    if len(ids) != len(set(ids)) or not ids:
        raise ValueError("源 ID 重复或无评论")
    by_id = dict(zip(ids, source))
    result = []
    for cid, c in zip(ids, source):
        key = page_key(c["url"], aliases)
        # Twikoo rid 为直接回复目标，pid 为根楼；Artalk 自行重建 RootID。
        rid = str(scalar(c.get("rid") or c.get("pid") or ""))
        if rid:
            if rid not in by_id or rid == cid:
                raise ValueError("孤立或自引用回复")
            if page_key(by_id[rid]["url"], aliases) != key:
                raise ValueError("回复目标跨页面")
            seen = {cid}
            cursor = rid
            while cursor:
                if cursor in seen:
                    raise ValueError("循环回复关系")
                seen.add(cursor)
                parent = by_id[cursor]
                cursor = str(scalar(parent.get("rid") or parent.get("pid") or ""))
                if cursor and cursor not in by_id:
                    raise ValueError("孤立回复祖先")
        nick, email = str(c.get("nick", "")).strip(), str(c.get("mail", "")).strip()
        if not nick or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            raise ValueError("作者或邮箱不符合导入要求；禁止静默改成匿名")
        content = c["comment"]
        if not isinstance(content, str):
            raise ValueError("评论正文不是字符串")
        if c["url"].rstrip("/") == "/posts/p562369c9":
            content = "<p>历史来源：《博客迁移通知》（原文已下线）</p>\n" + content
        up = c.get("ups", c.get("like", []))
        down = c.get("downs", [])
        if not isinstance(up, list) or not isinstance(down, list):
            raise ValueError("投票字段不是数组")
        # 仅匹配已配置的博主邮箱恢复历史徽标，不授予任何管理员权限。
        blogger = bool(c.get("master")) and email.casefold() == str(config.get("BLOGGER_EMAIL", "")).strip().casefold()
        result.append({
            "id": cid, "rid": rid, "content": content,
            "ua": c.get("ua", ""), "ip": c.get("ip", ""),
            "is_collapsed": "false", "is_pending": str(bool(c.get("isSpam"))).lower(),
            "is_pinned": str(bool(c.get("top"))).lower(),
            "vote_up": str(len(up)), "vote_down": str(len(down)),
            "created_at": date(c["created"]).isoformat(), "updated_at": date(c["updated"]).isoformat(),
            "nick": nick, "email": email, "link": str(c.get("link", "")),
            "badge_name": "博主" if blogger else "", "badge_color": "#6197c3" if blogger else "",
            "page_key": key, "page_title": "留言板" if key == "/envelope/" else "",
            "page_admin_only": "false", "site_name": "Dusklight", "site_urls": "https://blog.mcxiaochen.top",
        })
    output.mkdir(mode=0o700, parents=True)
    write(output / "comments.artrans", result)
    write(output / "source.private.json", source)
    report = {"comments": len(result), "replies": sum(bool(c["rid"]) for c in result),
              "pending": sum(c["is_pending"] == "true" for c in result),
              "pinned": sum(c["is_pinned"] == "true" for c in result),
              "vote_up": sum(int(c["vote_up"]) for c in result), "vote_down": sum(int(c["vote_down"]) for c in result),
              "pages": dict(collections.Counter(c["page_key"] for c in result)),
              "source_sha256": hashlib.sha256((backup / "comment.private.json").read_bytes()).hexdigest(),
              "archived_only": ["avatar", "ipRegion", "uid", "投票者身份", "counter"]}
    write(output / "conversion-report.json", report)
    print(json.dumps(report, ensure_ascii=False))


def verify(converted, database, output):
    expected = read(pathlib.Path(converted) / "comments.artrans")
    source = read(pathlib.Path(converted) / "source.private.json")
    db = sqlite3.connect(f"file:{pathlib.Path(database).resolve().as_posix()}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok", "SQLite 完整性失败"
    rows = db.execute("SELECT c.*, u.name AS nick, u.email AS email, u.link AS link, u.is_admin AS user_admin FROM comments c JOIN users u ON u.id=c.user_id WHERE c.deleted_at IS NULL ORDER BY c.id").fetchall()
    assert len(rows) == len(expected), "目标库必须仅有本批导入评论"
    mapping = {c["id"]: row["id"] for c, row in zip(expected, rows)}
    expected_by_id = {c["id"]: c for c in expected}
    public = {}
    normalized_authors = 0
    account_link_differences = 0
    for c, raw, row in zip(expected, source, rows):
        for field, column in (("content", "content"), ("ua", "ua"), ("ip", "ip"), ("page_key", "page_key"), ("site_name", "site_name"), ("nick", "nick"), ("email", "email")):
            if field in ("nick", "email"):
                # Artalk 原生账户按昵称和邮箱忽略大小写合并；原始大小写留在私有源文件。
                assert c[field].casefold() == row[column].casefold(), f"作者发生实质变化: {field}"
            else:
                assert c[field] == row[column], f"导入顺序或字段不一致: {field}"
        normalized_authors += int(c["nick"] != row["nick"] or c["email"] != row["email"])
        # 已确认采用 Artalk 的账户级网站资料，逐条原网址保存在 source.private.json。
        account_link_differences += int(c["link"] != row["link"])
        for field in ("is_pending", "is_pinned", "is_collapsed"):
            assert (c[field] == "true") == bool(row[field]), f"状态不一致: {field}"
        for field in ("vote_up", "vote_down"):
            assert int(c[field]) == row[field], f"票数不一致: {field}"
        assert row["rid"] == mapping.get(c["rid"], 0), "回复关系不一致"
        root = c["rid"]
        while root and expected_by_id[root]["rid"]:
            root = expected_by_id[root]["rid"]
        assert row["root_id"] == mapping.get(root, 0), "根楼关系不一致"
        for field in ("created_at", "updated_at"):
            assert abs((date(row[field]) - date(c[field])).total_seconds()) < 0.001, "时间不一致"
        for old_id in {c["id"], str(raw.get("id") or c["id"])}:
            value = [c["page_key"], row["id"]]
            assert old_id not in public or public[old_id] == value, "旧锚点存在歧义"
            public[old_id] = value
    assert not db.execute("SELECT COUNT(*) FROM comments c WHERE c.rid != 0 AND NOT EXISTS (SELECT 1 FROM comments p WHERE p.id=c.rid)").fetchone()[0], "孤立回复"
    write(output, public)
    print(json.dumps({"verified_comments": len(rows), "public_anchors": len(public), "normalized_author_case": normalized_authors, "account_link_differences": account_link_differences, "integrity": "ok"}))


def avatars(converted, anchors, output):
    """仅按私有源中的数字 QQ 邮箱匹配；公开直链已获用户明确授权。"""
    source = read(pathlib.Path(converted) / "source.private.json")
    mapping = read(anchors)
    result = {}
    for raw in source:
        old_id = str(scalar(raw["_id"]))
        if old_id not in mapping:
            raise ValueError("头像源缺少已核验的评论 ID 映射")
        match = re.fullmatch(r"([1-9][0-9]{4,10})@qq\.com", str(raw.get("mail", "")).strip(), re.I)
        if match:
            result[str(mapping[old_id][1])] = f"https://thirdqq.qlogo.cn/g?b=sdk&nk={match[1]}&s=140"
    write(output, result)
    print(json.dumps({"historical_qq_avatars": len(result), "source_comments": len(source)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    c = sub.add_parser("convert")
    c.add_argument("backup"); c.add_argument("output"); c.add_argument("rules")
    v = sub.add_parser("verify")
    v.add_argument("converted"); v.add_argument("database"); v.add_argument("output")
    a = sub.add_parser("avatars")
    a.add_argument("converted"); a.add_argument("anchors"); a.add_argument("output")
    args = parser.parse_args()
    if args.command == "convert":
        convert(args.backup, args.output, args.rules)
    elif args.command == "verify":
        verify(args.converted, args.database, args.output)
    else:
        avatars(args.converted, args.anchors, args.output)
