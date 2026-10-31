"""仅向原配置的博主邮箱发送一次受控 SMTP 验收邮件；不接触访客邮箱。"""
import email.message
import json
import pathlib
import smtplib
import ssl

root = pathlib.Path("/opt/artalk")
config = json.loads((root / "production.private.yml").read_text())
admin = json.loads((root / "admin.private.json").read_text())
mail = config["email"]
smtp = mail["smtp"]
message = email.message.EmailMessage()
message["From"] = mail["send_addr"]
message["To"] = admin["email"]
message["Subject"] = "Artalk 迁移 SMTP 验收（无需回复）"
message.set_content("这是一封受控的迁移验收邮件。旧评论系统仍在运行，新服务尚未正式切换。测试仅发给博主，不涉及历史访客。")
context = ssl.create_default_context()
if smtp["port"] == 465:
    connection = smtplib.SMTP_SSL(smtp["host"], smtp["port"], timeout=30, context=context)
else:
    connection = smtplib.SMTP(smtp["host"], smtp["port"], timeout=30)
    connection.starttls(context=context)
with connection:
    connection.login(smtp["username"], smtp["password"])
    refused = connection.send_message(message)
    assert not refused, "邮件服务拒绝收件人"
report = {"smtp_accepted": True, "recipient": "configured_blogger_only", "mailbox_delivery_confirmed": False}
(root / "rehearsal/smtp-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
