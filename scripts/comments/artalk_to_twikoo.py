"""Artalk SQLite 快照增量迁回 Twikoo MongoDB 工具。

保留原 Twikoo MongoDB 中的历史完整文档，仅将 Artalk 运行期间新增的评论、
状态变更以及历史 URL 规范化增量同步回 Twikoo。
"""
import argparse
import collections
import datetime
import hashlib
import html.parser
import json
import pathlib
import re
import sqlite3
import uuid


class _TextExtractor(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def strip_html(value: str) -> str:
    parser = _TextExtractor()
    parser.feed(value or "")
    parser.close()
    return re.sub(r"\s+", " ", "".join(parser.parts)).strip()


def parse_timestamp_ms(value: str) -> int:
    text = str(value).strip()
    # 处理 Go/SQLite 时间格式，如 "2026-10-27 21:52:14.958372254+08:00"
    match = re.match(
        r"^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$",
        text,
    )
    if not match:
        raise ValueError(f"无法解析时间格式: {value}")
    date_part, time_part, frac, tz = match.groups()
    micro = (frac or "")[:6].ljust(6, "0")
    tz = "+00:00" if tz == "Z" else (tz or "+00:00")
    dt = datetime.datetime.fromisoformat(f"{date_part}T{time_part}.{micro}{tz}")
    return int(round(dt.timestamp() * 1000))


def normalize_page_key(path: str, aliases: dict[str, str]) -> str:
    if not isinstance(path, str) or not path.startswith("/"):
        raise ValueError(f"非法页面路径: {path!r}")
    clean = path.split("?", 1)[0].split("#", 1)[0]
    key = "/" if clean == "/" else "/" + clean.strip("/") + "/"
    return aliases.get(key, key)


def make_twikoo_id(artalk_id: int) -> str:
    namespace = uuid.UUID("7f3d5c2e-9b14-4a8e-8c6d-202611270000")
    return uuid.uuid5(namespace, f"artalk-comment-{artalk_id}").hex


def plan_migration(
    artalk_db_path: pathlib.Path,
    legacy_map_path: pathlib.Path,
    rules_path: pathlib.Path,
    twikoo_comments_path: pathlib.Path,
    site_origin: str = "https://blog.mcxiaochen.top",
) -> dict:
    legacy_map = json.loads(legacy_map_path.read_text(encoding="utf-8-sig"))
    aliases = json.loads(rules_path.read_text(encoding="utf-8-sig"))
    twikoo_comments = json.loads(twikoo_comments_path.read_text(encoding="utf-8-sig"))

    # legacy_map: { twikoo_id: [page_key, artalk_id] }
    atk_to_twikoo: dict[int, str] = {}
    for tw_id, pair in legacy_map.items():
        atk_id = int(pair[1])
        atk_to_twikoo[atk_id] = str(tw_id)

    twikoo_by_id = {str(c["_id"]): c for c in twikoo_comments}

    db = sqlite3.connect(f"file:{artalk_db_path.resolve().as_posix()}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute(
            """
            SELECT c.id, c.rid, c.root_id, c.content, c.ua, c.ip, c.page_key,
                   c.is_pending, c.is_pinned, c.created_at, c.updated_at, c.deleted_at,
                   u.name AS nick, u.email AS email, u.link AS link, u.is_admin AS is_admin
            FROM comments c
            JOIN users u ON u.id = c.user_id
            ORDER BY c.id
            """
        ).fetchall()
    finally:
        db.close()

    active_by_id = {int(r["id"]): r for r in rows if r["deleted_at"] is None}

    # 为所有新增评论分配确定性的 Twikoo _id
    new_rows = [r for r in rows if r["deleted_at"] is None and int(r["id"]) not in atk_to_twikoo]
    for r in new_rows:
        atk_id = int(r["id"])
        new_id = make_twikoo_id(atk_id)
        if new_id in twikoo_by_id:
            raise ValueError(f"生成的 Twikoo ID 与现有记录冲突: {new_id}")
        atk_to_twikoo[atk_id] = new_id

    insert_comments: list[dict] = []
    for r in new_rows:
        atk_id = int(r["id"])
        tw_id = atk_to_twikoo[atk_id]
        rid_num = int(r["rid"] or 0)
        pid_str = ""
        rid_str = ""

        if rid_num:
            if rid_num not in atk_to_twikoo or rid_num not in active_by_id:
                raise ValueError(f"新增评论 {atk_id} 的回复目标 {rid_num} 不存在或已删除")
            # Twikoo 约定：pid 为直接父评论 _id，rid 为根楼 _id（与 Artalk 的 rid/root_id 相反）
            pid_str = atk_to_twikoo[rid_num]
            # 沿父链查找根楼
            seen = {atk_id}
            cursor = rid_num
            root_num = cursor
            while cursor:
                if cursor in seen:
                    raise ValueError(f"检测到循环回复: {atk_id}")
                seen.add(cursor)
                parent_row = active_by_id[cursor]
                parent_rid = int(parent_row["rid"] or 0)
                if not parent_rid:
                    root_num = cursor
                    break
                if parent_rid not in active_by_id:
                    raise ValueError(f"回复祖先 {parent_rid} 不存在或已删除")
                cursor = parent_rid
            rid_str = atk_to_twikoo[root_num]

        email = str(r["email"] or "").strip()
        mail_md5 = hashlib.md5(email.lower().encode("utf-8")).hexdigest() if email else ""
        page_key = normalize_page_key(str(r["page_key"]), aliases)
        content = str(r["content"] or "")
        created_ms = parse_timestamp_ms(str(r["created_at"]))
        updated_ms = parse_timestamp_ms(str(r["updated_at"]))

        insert_comments.append(
            {
                "_id": tw_id,
                "uid": "",
                "nick": str(r["nick"] or "").strip(),
                "mail": email,
                "mailMd5": mail_md5,
                "link": str(r["link"] or "").strip(),
                "ua": str(r["ua"] or ""),
                "ip": str(r["ip"] or ""),
                "master": bool(r["is_admin"]),
                "url": page_key,
                "href": f"{site_origin.rstrip('/')}{page_key}",
                "comment": content,
                "commentText": strip_html(content),
                "pid": pid_str,
                "rid": rid_str,
                "isSpam": bool(r["is_pending"]),
                "top": bool(r["is_pinned"]),
                "ups": [],
                "downs": [],
                "created": created_ms,
                "updated": updated_ms,
            }
        )

    # 历史 Twikoo 记录 URL 规范化（含 /comments/ -> /envelope/、/posts/p562369c9 -> /envelope/、无尾斜杠补全）
    url_normalizations: list[dict] = []
    for raw in twikoo_comments:
        cid = str(raw["_id"])
        old_url = str(raw["url"])
        new_url = normalize_page_key(old_url, aliases)
        prepend_note = (
            old_url.rstrip("/") == "/posts/p562369c9"
            and "历史来源：《博客迁移通知》" not in str(raw.get("comment", ""))
        )
        if old_url != new_url or prepend_note:
            url_normalizations.append(
                {
                    "_id": cid,
                    "from_url": old_url,
                    "to_url": new_url,
                    "to_href": f"{site_origin.rstrip('/')}{new_url}",
                    "prepend_origin_note": prepend_note,
                }
            )

    # 检查既有 552 条评论在 Artalk 中是否有状态变更（is_pending / is_pinned）
    status_updates: list[dict] = []
    for tw_id, pair in legacy_map.items():
        atk_id = int(pair[1])
        row = active_by_id.get(atk_id)
        raw = twikoo_by_id.get(str(tw_id))
        if not row or not raw:
            continue
        new_spam = bool(row["is_pending"])
        new_top = bool(row["is_pinned"])
        old_spam = bool(raw.get("isSpam"))
        old_top = bool(raw.get("top"))
        if new_spam != old_spam or new_top != old_top:
            status_updates.append(
                {
                    "_id": str(tw_id),
                    "isSpam": new_spam,
                    "top": new_top,
                }
            )

    report = {
        "existing_twikoo": len(twikoo_comments),
        "new_comments": len(insert_comments),
        "new_replies": sum(1 for c in insert_comments if c["rid"]),
        "url_normalizations": len(url_normalizations),
        "status_updates": len(status_updates),
        "new_pages": dict(collections.Counter(c["url"] for c in insert_comments)),
        "expected_total_after_merge": len(twikoo_comments) + len(insert_comments),
    }

    return {
        "report": report,
        "insert_comments": insert_comments,
        "url_normalizations": url_normalizations,
        "status_updates": status_updates,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="从 Artalk SQLite 快照生成 Twikoo 增量迁回数据")
    parser.add_argument("artalk_db", type=pathlib.Path)
    parser.add_argument("legacy_map", type=pathlib.Path)
    parser.add_argument("rules", type=pathlib.Path)
    parser.add_argument("twikoo_comments", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    args = parser.parse_args()

    result = plan_migration(
        args.artalk_db,
        args.legacy_map,
        args.rules,
        args.twikoo_comments,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(result["report"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
