import json
import pathlib
import sqlite3
import tempfile
import unittest

import artalk_to_twikoo as mod


class TestArtalkToTwikoo(unittest.TestCase):
    def test_incremental_merge_replies_and_url_normalization(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            db_path = root / "artalk.db"
            conn = sqlite3.connect(db_path)
            conn.executescript(
                """
                CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, link TEXT, is_admin INTEGER);
                CREATE TABLE comments (
                    id INTEGER PRIMARY KEY, rid INTEGER, root_id INTEGER, content TEXT,
                    ua TEXT, ip TEXT, page_key TEXT, is_pending INTEGER, is_pinned INTEGER,
                    created_at TEXT, updated_at TEXT, deleted_at TEXT, user_id INTEGER
                );
                INSERT INTO users VALUES (1, '尘.', 'owner@example.com', 'https://blog.mcxiaochen.top', 1);
                INSERT INTO users VALUES (2, '访客甲', 'guest@example.com', '', 0);
                -- 原有两条历史评论
                INSERT INTO comments VALUES (10, 0, 0, '<p>旧评论1</p>', 'UA1', '1.1.1.1', '/link/', 0, 0, '2026-10-01 10:00:00+08:00', '2026-10-01 10:00:00+08:00', NULL, 2);
                INSERT INTO comments VALUES (11, 0, 0, '<p>旧评论2</p>', 'UA1', '1.1.1.1', '/posts/p1/', 0, 0, '2026-10-01 11:00:00+08:00', '2026-10-01 11:00:00+08:00', NULL, 2);
                -- 新增根评论 + 回复旧评论 + 三级回复
                INSERT INTO comments VALUES (12, 10, 10, '回复旧评论', 'UA2', '2.2.2.2', '/link/', 0, 0, '2026-11-01 12:00:00.123456+08:00', '2026-11-01 12:00:00.123456+08:00', NULL, 1);
                INSERT INTO comments VALUES (13, 0, 0, '新根评论', 'UA3', '3.3.3.3', '/posts/p1/', 1, 0, '2026-11-02 08:00:00+08:00', '2026-11-02 08:00:00+08:00', NULL, 2);
                INSERT INTO comments VALUES (14, 13, 13, '二级回复', 'UA4', '4.4.4.4', '/posts/p1/', 0, 0, '2026-11-02 09:00:00+08:00', '2026-11-02 09:00:00+08:00', NULL, 1);
                INSERT INTO comments VALUES (15, 14, 13, '三级回复', 'UA5', '5.5.5.5', '/posts/p1/', 0, 0, '2026-11-02 10:00:00+08:00', '2026-11-02 10:00:00+08:00', NULL, 2);
                """
            )
            conn.commit()
            conn.close()

            legacy_map = root / "legacy-map.json"
            legacy_map.write_text(
                json.dumps({"old_id_10": ["/link/", 10], "old_id_11": ["/posts/p1/", 11]}),
                encoding="utf-8",
            )
            rules = root / "comment-paths.json"
            rules.write_text(
                json.dumps({"/comments/": "/envelope/", "/posts/p562369c9/": "/envelope/"}),
                encoding="utf-8",
            )
            twikoo_comments = root / "comment.private.json"
            twikoo_comments.write_text(
                json.dumps(
                    [
                        {"_id": "old_id_10", "url": "/link/", "comment": "旧评论1", "isSpam": False, "top": False},
                        {"_id": "old_id_11", "url": "/posts/p1", "comment": "旧评论2", "isSpam": False, "top": False},
                    ]
                ),
                encoding="utf-8",
            )

            plan = mod.plan_migration(db_path, legacy_map, rules, twikoo_comments)
            self.assertEqual(plan["report"]["new_comments"], 4)
            self.assertEqual(plan["report"]["new_replies"], 3)
            self.assertEqual(plan["report"]["url_normalizations"], 1)

            by_text = {c["commentText"]: c for c in plan["insert_comments"]}
            self.assertEqual(by_text["回复旧评论"]["rid"], "old_id_10")
            self.assertEqual(by_text["回复旧评论"]["pid"], "old_id_10")
            self.assertTrue(by_text["回复旧评论"]["master"])

            root_id = by_text["新根评论"]["_id"]
            lvl2_id = by_text["二级回复"]["_id"]
            self.assertTrue(by_text["新根评论"]["isSpam"])
            self.assertEqual(by_text["二级回复"]["pid"], root_id)
            self.assertEqual(by_text["二级回复"]["rid"], root_id)
            self.assertEqual(by_text["三级回复"]["pid"], lvl2_id)
            self.assertEqual(by_text["三级回复"]["rid"], root_id)

            norm = plan["url_normalizations"][0]
            self.assertEqual(norm["from_url"], "/posts/p1")
            self.assertEqual(norm["to_url"], "/posts/p1/")


if __name__ == "__main__":
    unittest.main()
