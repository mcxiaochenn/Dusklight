"""停写后定向绑定一条已验证 GitHub 身份；不合并用户或改动评论。"""
import argparse
import datetime
import json
import os
import pathlib
import sqlite3


def bind(db, request, *, rollback=False):
    identity_id = request["identity_id"]
    source_id = request["source_user_id"]
    target_id = request["target_user_id"]
    assert source_id != target_id, "源账号与目标账号不能相同"
    db.execute("BEGIN IMMEDIATE")
    try:
        row = db.execute("SELECT provider,remote_uid,user_id,confirmed_at FROM auth_identities WHERE id=? AND deleted_at IS NULL", (identity_id,)).fetchone()
        assert row and row[0] == "github" and row[1] == request["remote_uid"] and row[3], "GitHub 身份未通过预期校验"
        assert row[2] == (target_id if rollback else source_id), "身份归属已变化，停止操作"
        assert db.execute("SELECT count(*) FROM auth_identities WHERE provider='github' AND remote_uid=? AND deleted_at IS NULL", (row[1],)).fetchone()[0] == 1, "GitHub 身份不唯一"
        target = db.execute("SELECT is_admin FROM users WHERE id=? AND deleted_at IS NULL", (target_id,)).fetchone()
        source = db.execute("SELECT is_admin FROM users WHERE id=? AND deleted_at IS NULL", (source_id,)).fetchone()
        assert target and target[0] == 1 and source and source[0] == 0, "账号权限与预期不符"
        if not rollback:
            assert db.execute("SELECT count(*) FROM comments WHERE user_id=?", (target_id,)).fetchone()[0] == request["expected_owner_comments"], "博主评论数量已变化，需重新核对"
            assert db.execute("SELECT count(*) FROM auth_identities WHERE user_id=? AND provider='github' AND deleted_at IS NULL", (target_id,)).fetchone()[0] == 0, "博主已有 GitHub 身份"
        # 使用下一秒边界，使本秒签发的旧 JWT 也失效；重新登录须等待边界过去。
        valid_from = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0) + datetime.timedelta(seconds=1)
        db.execute("UPDATE auth_identities SET user_id=? WHERE id=?", (source_id if rollback else target_id, identity_id))
        db.execute("UPDATE users SET token_valid_from=? WHERE id IN (?,?)", (valid_from.isoformat(), source_id, target_id))
        db.commit()
        return {"identity_id": identity_id, "source_user_id": source_id, "target_user_id": target_id, "action": "rollback" if rollback else "bind", "token_valid_from": valid_from.isoformat()}
    except BaseException:
        db.rollback()
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=pathlib.Path)
    parser.add_argument("request", type=pathlib.Path)
    parser.add_argument("record", type=pathlib.Path)
    parser.add_argument("--rollback", action="store_true")
    args = parser.parse_args()
    os.umask(0o077)
    assert args.database.is_file() and args.request.is_file()
    assert args.request.stat().st_mode & 0o077 == 0, "请求文件必须仅 root 可读"
    request = json.loads(args.request.read_text())
    assert request["github_verified"] and request["admin_verified"] and request["local_backup_verified"], "真实身份或本机备份验收未完成"
    assert pathlib.Path(request["backup_directory"], "SHA256SUMS").is_file(), "缺少备份清单"
    # 先落盘操作意图；中断时仍可用同一请求文件核对归属及定向回退。
    with args.record.open("x") as record:
        json.dump({"status": "prepared", "rollback": args.rollback}, record)
    with sqlite3.connect(args.database) as db:
        result = bind(db, request, rollback=args.rollback)
    args.record.write_text(json.dumps({"status": "completed", **result}, indent=2))
    print(json.dumps(result))


if __name__ == "__main__":
    main()
