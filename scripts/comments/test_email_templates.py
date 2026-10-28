"""验证模板部署不会改动登录、SMTP、用户权限等非模板配置。"""
import copy
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch
from email_templates import install_templates


class EmailTemplateTests(unittest.TestCase):
    def test_install_preserves_existing_auth_and_delivery_settings(self):
        settings = {
            "email": {"enabled": False, "smtp": {"password": "fixture-only"}},
            "admin_notify": {"email": {"enabled": False}},
            "auth": {"enabled": True, "anonymous": False, "email": {"enabled": True},
                     "github": {"enabled": True, "client_secret": "fixture-only"}},
            "admin_users": [{"name": "fixture"}],
        }
        before = copy.deepcopy(settings)
        with tempfile.TemporaryDirectory() as directory:
            install_templates(settings, Path(directory))
            for name in ("reply", "admin", "verify"):
                self.assertTrue((Path(directory) / "mail-templates" / f"{name}.html").is_file())
            install_templates(settings, Path(directory))
        self.assertEqual(settings["auth"]["github"], before["auth"]["github"])
        self.assertEqual(settings["admin_users"], before["admin_users"])
        self.assertEqual(settings["email"]["smtp"], before["email"]["smtp"])
        self.assertFalse(settings["auth"]["anonymous"])
        self.assertFalse(settings["email"]["enabled"])
        self.assertFalse(settings["admin_notify"]["email"]["enabled"])
        self.assertTrue(settings["auth"]["email"]["enabled"])
        self.assertNotIn("{{code}}", settings["auth"]["email"]["verify_subject"])

    def test_incomplete_package_does_not_write_or_mutate_config(self):
        settings = {"email": {"enabled": False}}
        with tempfile.TemporaryDirectory() as directory:
            data = Path(directory) / "data"
            with patch.object(Path, "read_bytes", side_effect=FileNotFoundError):
                with self.assertRaises(FileNotFoundError):
                    install_templates(settings, data)
            self.assertFalse(data.exists())
        self.assertEqual(settings, {"email": {"enabled": False}})

    def test_only_native_template_variables_are_used(self):
        allowed = {"nick", "reply_nick", "page_title", "reply_content", "content", "link_to_reply"}
        for name in ("reply", "admin", "verify"):
            source = (Path(__file__).with_name("mail-templates") / f"{name}.html").read_text(encoding="utf-8")
            keys = set(re.findall(r"{{(.*?)}}", source))
            self.assertLessEqual(keys, {"code"} if name == "verify" else allowed)
            self.assertNotIn("<script", source)
            self.assertNotIn("{{{", source)
            self.assertNotIn("content_raw", source)


if __name__ == "__main__":
    unittest.main()
