"""验证迁移中不可静默退化的数据规则；不含真实评论或个人信息。"""
import contextlib
import importlib.util
import io
import json
import pathlib
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("migration", pathlib.Path(__file__).with_name("migrate.py"))
migration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)


class MigrationTest(unittest.TestCase):
    def run_conversion(self, rows):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            backup = root / "backup"
            backup.mkdir()
            (backup / "comment.private.json").write_text(json.dumps(rows))
            (backup / "config.private.json").write_text('[{"BLOGGER_EMAIL":"owner@example.com"}]')
            rules = pathlib.Path(__file__).parents[2] / "src/config/comment-paths.json"
            with contextlib.redirect_stdout(io.StringIO()):
                migration.convert(backup, root / "output", rules)
            return json.loads((root / "output/comments.artrans").read_text(encoding="utf-8")), json.loads((root / "output/conversion-report.json").read_text(encoding="utf-8"))

    def comment(self, **values):
        return {"_id": "a", "nick": "访客", "mail": "visitor@example.com", "comment": "<p>原文 &amp; 表情</p>",
                "url": "/envelope", "created": 1700000000123, "updated": 1700000000456, **values}

    def test_page_merge_preserves_reply_and_vote_precedence(self):
        rows = [self.comment(url="/comments/", like=["old"], ups=["new"], downs=["down"], top=True),
                self.comment(_id="b", url="/envelope/", rid="a", pid="a", isSpam=True)]
        result, report = self.run_conversion(rows)
        self.assertEqual(report["pages"], {"/envelope/": 2})
        self.assertEqual(result[1]["rid"], "a")
        self.assertEqual((report["vote_up"], report["vote_down"], report["pending"], report["pinned"]), (1, 1, 1, 1))
        self.assertEqual(result[0]["content"], rows[0]["comment"])
        self.assertTrue(result[0]["created_at"].endswith(".123000+00:00"))

    def test_deleted_notice_and_archived_essay(self):
        result, _ = self.run_conversion([self.comment(url="/posts/p562369c9"), self.comment(_id="b", url="/essay/")])
        self.assertEqual(result[0]["page_key"], "/envelope/")
        self.assertIn("原文已下线", result[0]["content"])
        self.assertEqual(result[1]["page_key"], "/essay/")

    def test_orphan_and_cross_page_replies_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "孤立"):
            self.run_conversion([self.comment(rid="missing")])
        with self.assertRaisesRegex(ValueError, "跨页面"):
            self.run_conversion([self.comment(), self.comment(_id="b", url="/about/", rid="a")])

    def test_cycles_and_duplicate_ids_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "循环"):
            self.run_conversion([self.comment(rid="b"), self.comment(_id="b", rid="a")])
        with self.assertRaisesRegex(ValueError, "重复"):
            self.run_conversion([self.comment(), self.comment()])

    def test_avatar_mapping_uses_private_qq_email_not_numeric_nickname(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            rows = [self.comment(mail="123456789@QQ.com"), self.comment(_id="b", nick="987654321")]
            (root / "source.private.json").write_text(json.dumps(rows))
            (root / "anchors.json").write_text('{"a":["/envelope/",11],"b":["/envelope/",12]}')
            with contextlib.redirect_stdout(io.StringIO()):
                migration.avatars(root, root / "anchors.json", root / "avatars.json")
            result = json.loads((root / "avatars.json").read_text())
            self.assertEqual(result, {"11": "https://thirdqq.qlogo.cn/g?b=sdk&nk=123456789&s=140"})
            self.assertNotIn("@", json.dumps(result))

    def test_avatar_mapping_rejects_missing_anchor(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            (root / "source.private.json").write_text(json.dumps([self.comment()]))
            (root / "anchors.json").write_text('{}')
            with self.assertRaisesRegex(ValueError, "ID 映射"):
                migration.avatars(root, root / "anchors.json", root / "avatars.json")


if __name__ == "__main__":
    unittest.main()
