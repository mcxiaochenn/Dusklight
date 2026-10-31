"""默认只读预览；停写并备份后用 --apply 为唯一 GitHub 身份回填头像。"""
from contextlib import closing
import argparse
import json
import pathlib
import re
import sqlite3


def quote(name):
    return '"' + name.replace('"', '""') + '"'


def tables(db, prefix=None):
    names = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    prefixes = [name[:-5] for name in names if name.endswith("users") and name[:-5] + "auth_identities" in names]
    if prefix is not None:
        prefixes = [item for item in prefixes if item == prefix]
    if len(prefixes) != 1:
        raise ValueError("无法唯一确定用户和身份表，请指定 --table-prefix")
    users, identities = prefixes[0] + "users", prefixes[0] + "auth_identities"
    for table, required in [(users, {"id", "avatar_url", "deleted_at"}), (identities, {"user_id", "provider", "remote_uid", "deleted_at", "confirmed_at"})]:
        columns = {row[1] for row in db.execute(f"PRAGMA table_info({quote(table)})")}
        if not required <= columns:
            raise ValueError(f"{table} 缺少所需列，先用新版本完成迁移")
    return users, identities


def candidates(db, users, identities):
    rows = db.execute(f"""
        SELECT u.id, a.remote_uid, a.confirmed_at FROM {quote(users)} u
        JOIN {quote(identities)} a ON a.user_id=u.id
        WHERE u.deleted_at IS NULL AND a.deleted_at IS NULL
          AND COALESCE(u.avatar_url, '')='' AND a.provider='github'
        ORDER BY u.id, a.id
    """)
    grouped = {}
    for user_id, uid, confirmed in rows:
        grouped.setdefault(user_id, []).append((uid, confirmed))
    updates, skipped = [], []
    for user_id, records in grouped.items():
        if len(records) != 1:
            skipped.append({"user_id": user_id, "reason": "multiple_identities"})
            continue
        uid, confirmed = records[0]
        if not isinstance(uid, str) or not re.fullmatch(r"[1-9][0-9]*", uid) or not confirmed:
            skipped.append({"user_id": user_id, "reason": "invalid_or_unconfirmed_identity"})
            continue
        updates.append((f"https://avatars.githubusercontent.com/u/{uid}?v=4", user_id))
    return updates, skipped


def run(database, apply=False, prefix=None):
    path = pathlib.Path(database).resolve(strict=True)
    with closing(sqlite3.connect(path.as_uri() + ("?mode=rw" if apply else "?mode=ro"), uri=True)) as db, db:
        db.execute("BEGIN IMMEDIATE" if apply else "BEGIN")
        users, identities = tables(db, prefix)
        updates, skipped = candidates(db, users, identities)
        changed = 0
        if apply:
            for url, user_id in updates:
                changed += db.execute(f"UPDATE {quote(users)} SET avatar_url=? WHERE id=? AND deleted_at IS NULL AND COALESCE(avatar_url, '')=''", (url, user_id)).rowcount
            if changed != len(updates) or candidates(db, users, identities)[0]:
                raise RuntimeError("回填数量核验失败，事务回滚")
        return {"mode": "apply" if apply else "preview", "users_table": users, "eligible": len(updates), "updated": changed, "skipped": skipped}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database")
    parser.add_argument("--table-prefix")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(args.database, args.apply, args.table_prefix), ensure_ascii=False, indent=2))
