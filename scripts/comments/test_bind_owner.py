"""验证定向绑定、会话失效、异常拒绝及有新增评论后的无损回退。"""
import importlib.util
import pathlib
import sqlite3
import unittest

spec = importlib.util.spec_from_file_location("bind_owner", pathlib.Path(__file__).with_name("bind-owner.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BindingTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.executescript("""
          CREATE TABLE users(id INTEGER PRIMARY KEY,is_admin INTEGER,deleted_at TEXT,token_valid_from TEXT);
          CREATE TABLE auth_identities(id INTEGER PRIMARY KEY,provider TEXT,remote_uid TEXT,user_id INTEGER,confirmed_at TEXT,deleted_at TEXT,token TEXT);
          CREATE TABLE comments(id INTEGER PRIMARY KEY,user_id INTEGER,content TEXT);
          INSERT INTO users VALUES(1,1,NULL,NULL),(24,0,NULL,NULL),(154,0,NULL,NULL);
          INSERT INTO auth_identities VALUES(1,'github','123',154,'2026-10-26',NULL,'private-token');
          INSERT INTO comments VALUES(1,1,'历史博主'),(2,24,'另一个昵称');
        """)
        self.request = dict(identity_id=1, remote_uid="123", source_user_id=154, target_user_id=1, expected_owner_comments=1)

    def test_binding_changes_only_identity_and_two_session_cutoffs(self):
        before = self.db.execute("SELECT * FROM comments").fetchall()
        module.bind(self.db, self.request)
        self.assertEqual(self.db.execute("SELECT user_id,token FROM auth_identities").fetchone(), (1, "private-token"))
        self.assertEqual(self.db.execute("SELECT * FROM comments").fetchall(), before)
        self.assertEqual(self.db.execute("SELECT is_admin,token_valid_from FROM users WHERE id=24").fetchone(), (0, None))
        self.assertEqual(self.db.execute("SELECT count(*) FROM users WHERE token_valid_from IS NOT NULL").fetchone()[0], 2)

    def test_wrong_identity_rolls_back(self):
        self.request["remote_uid"] = "wrong"
        with self.assertRaises(AssertionError):
            module.bind(self.db, self.request)
        self.assertEqual(self.db.execute("SELECT user_id FROM auth_identities").fetchone()[0], 154)

    def test_changed_comment_count_rejected(self):
        self.request["expected_owner_comments"] = 245
        with self.assertRaises(AssertionError):
            module.bind(self.db, self.request)
        self.assertEqual(self.db.execute("SELECT token_valid_from FROM users WHERE id=1").fetchone()[0], None)

    def test_rollback_preserves_new_comments(self):
        module.bind(self.db, self.request)
        self.db.execute("INSERT INTO comments VALUES(3,1,'上线后新增')")
        self.db.commit()
        module.bind(self.db, self.request, rollback=True)
        self.assertEqual(self.db.execute("SELECT user_id FROM auth_identities").fetchone()[0], 154)
        self.assertEqual(self.db.execute("SELECT content FROM comments WHERE id=3").fetchone()[0], "上线后新增")


if __name__ == "__main__":
    unittest.main()
