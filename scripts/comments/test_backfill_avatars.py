"""验证真实 SQLite 上的预览、选择范围、事务和重复执行。"""
from contextlib import closing
import importlib.util
import pathlib
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("backfill", pathlib.Path(__file__).with_name("backfill-avatars.py"))
backfill = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backfill)


class BackfillTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = pathlib.Path(self.temp.name) / "artalk.db"
        with closing(sqlite3.connect(self.path)) as db, db:
            db.executescript("""
                CREATE TABLE atk_users(id INTEGER PRIMARY KEY, avatar_url TEXT, deleted_at TEXT, name TEXT);
                CREATE TABLE atk_auth_identities(id INTEGER PRIMARY KEY, user_id INTEGER, provider TEXT, remote_uid TEXT, deleted_at TEXT, confirmed_at TEXT);
            """)
            for i in range(1, 9):
                db.execute("INSERT INTO atk_users VALUES(?, ?, ?, '保持不变')", (i, 'https://example.com/old' if i == 2 else '', 'deleted' if i == 7 else None))
            for i, uid, provider, deleted, confirmed in [(1, '12345', 'github', None, 'yes'), (2, '2', 'github', None, 'yes'), (3, '3', 'google', None, 'yes'), (4, '4', 'github', None, 'yes'), (4, '5', 'github', None, 'yes'), (5, 'abc', 'github', None, 'yes'), (6, '6', 'github', 'deleted', 'yes'), (7, '7', 'github', None, 'yes'), (8, '8', 'github', None, None)]:
                db.execute("INSERT INTO atk_auth_identities(user_id,remote_uid,provider,deleted_at,confirmed_at) VALUES(?,?,?,?,?)", (i, uid, provider, deleted, confirmed))

    def test_preview_apply_idempotency(self):
        before = self.path.read_bytes()
        preview = backfill.run(self.path)
        self.assertEqual(preview['eligible'], 1)
        self.assertEqual(len(preview['skipped']), 3)
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(backfill.run(self.path, True)['updated'], 1)
        self.assertEqual(backfill.run(self.path, True)['updated'], 0)
        with closing(sqlite3.connect(self.path)) as db, db:
            self.assertEqual(db.execute('SELECT avatar_url FROM atk_users WHERE id=1').fetchone()[0], 'https://avatars.githubusercontent.com/u/12345?v=4')
            self.assertEqual(db.execute('SELECT COUNT(*) FROM atk_users WHERE name=?', ('保持不变',)).fetchone()[0], 8)
            self.assertEqual(db.execute('SELECT avatar_url FROM atk_users WHERE id=2').fetchone()[0], 'https://example.com/old')

    def test_rollback(self):
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute("CREATE TRIGGER deny_avatar BEFORE UPDATE ON atk_users BEGIN SELECT RAISE(ABORT, '拒绝写入'); END")
        with self.assertRaises(sqlite3.IntegrityError):
            backfill.run(self.path, True)
        self.assertEqual(backfill.run(self.path)['eligible'], 1)

    def test_missing_schema_or_wrong_prefix(self):
        with self.assertRaises(ValueError):
            backfill.run(self.path, prefix='wrong_')
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute('ALTER TABLE atk_users RENAME COLUMN avatar_url TO old_avatar')
        with self.assertRaises(ValueError):
            backfill.run(self.path)


if __name__ == '__main__':
    unittest.main()
