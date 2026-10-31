"""从已验证试迁移创建本机监听的候选服务；不修改 DNS、反代或旧服务。"""
import json
import os
import pathlib
import secrets
import sqlite3
import sys

os.umask(0o077)
root = pathlib.Path(sys.argv[1])
backup = pathlib.Path(sys.argv[2])
config = json.loads((backup / "config.private.json").read_text())[0]
image = (root / "rehearsal/image-digest.txt").read_text().strip()
data = root / "data"
data.mkdir(mode=0o700)
source = sqlite3.connect(f"file:{root}/rehearsal/artalk-data/artalk.db?mode=ro", uri=True)
target = sqlite3.connect(data / "artalk.db")
source.backup(target)
target.close()
source.close()
admin_password = secrets.token_urlsafe(32)
admin = {"name": config["BLOGGER_NICK"], "email": config["BLOGGER_EMAIL"], "password": admin_password,
         "badge_name": "博主", "badge_color": "#6197c3"}
smtp_host = config.get("SMTP_HOST") or {"qq": "smtp.qq.com", "163": "smtp.163.com", "gmail": "smtp.gmail.com"}.get(str(config.get("SMTP_SERVICE", "")).lower())
if not smtp_host:
    raise ValueError("无法明确映射原 SMTP 服务，请先核实，不得猜测")
settings = {
    "host": "0.0.0.0", "port": 23366, "app_key": secrets.token_hex(32),
    "locale": "zh-CN", "timezone": "Asia/Shanghai", "site_default": "Dusklight", "login_timeout": 259200,
    "site_url": "https://blog.mcxiaochen.top", "db": {"type": "sqlite", "file": "/data/artalk.db"},
    "http": {"proxy_header": "X-Real-IP"},
    "trusted_domains": ["https://blog.mcxiaochen.top", "https://artalk.mcxiaochen.top"],
    "admin_users": [admin], "captcha": {"enabled": True, "always": False, "captcha_type": "image", "action_limit": 3, "action_reset": 60},
    "img_upload": {"enabled": False}, "log": {"enabled": True, "filename": "/data/artalk.log"},
    "moderator": {"pending_default": False, "akismet_key": config.get("AKISMET_KEY", "")},
    "frontend": {"emoticons": "https://blog.mcxiaochen.top/json/owo.json", "pvAdd": False, "pageVote": False,
                 "imgUpload": False, "versionCheck": False, "vote": True, "voteDown": True},
    "email": {"enabled": True, "send_type": "smtp", "send_name": config.get("SENDER_NAME") or "辰渊尘の博客", "mail_subject": "[{{site_name}}] 您收到了来自 @{{reply_nick}} 的回复",
              "send_addr": config.get("SENDER_EMAIL") or config["SMTP_USER"], "mail_tpl": "default",
              "smtp": {"host": smtp_host, "port": int(config.get("SMTP_PORT") or 465),
                       "username": config["SMTP_USER"], "password": config["SMTP_PASS"]}},
    "admin_notify": {"email": {"enabled": True, "mail_subject": "[{{site_name}}] 您的文章「{{page_title}}」有新回复"}},
}
(root / "production.private.yml").write_text(json.dumps(settings, ensure_ascii=False, indent=2))
(root / "admin.private.json").write_text(json.dumps(admin, ensure_ascii=False, indent=2))
# 候选服务不会发送真实邮件，正式切换时才使用已准备好的生产配置。
settings["email"]["enabled"] = False
settings["admin_notify"]["email"]["enabled"] = False
settings["trusted_domains"] += ["http://127.0.0.1:4321", "http://127.0.0.1:4322", "http://localhost:4321"]
(data / "artalk.yml").write_text(json.dumps(settings, ensure_ascii=False, indent=2))
(root / "compose.yml").write_text(f'''services:
  artalk:
    image: {image}
    container_name: dusklight-artalk
    restart: unless-stopped
    ports:
      - "127.0.0.1:23366:23366"
    volumes:
      - ./data:/data
    environment:
      TZ: Asia/Shanghai
      ATK_TIMEZONE: Asia/Shanghai
''')
print("候选服务配置和一致性快照已生成；真实邮件保持关闭。")
