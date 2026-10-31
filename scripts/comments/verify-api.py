"""仅对独立 QA 服务执行写入与受控邮件测试，不连接生产评论库。"""
import json
import pathlib
import secrets
import urllib.error
import urllib.parse
import urllib.request

base = "http://127.0.0.1:23367/api/v2"
admin = json.loads(pathlib.Path("/opt/artalk/admin.private.json").read_text())
token = None
test_ip = f"192.0.2.{20 + secrets.randbelow(200)}"


def request(method, path, payload=None, authenticated=False):
    headers = {"Content-Type": "application/json", "X-Real-IP": "198.51.100." + test_ip.rsplit(".", 1)[1] if authenticated or path == "/user/access_token" else test_ip}
    if authenticated:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(payload).encode() if payload is not None else None
    try:
        with urllib.request.urlopen(urllib.request.Request(base + path, data=data, headers=headers, method=method), timeout=30) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, json.load(e)


report = {}
status, login = request("POST", "/user/access_token", {"name": admin["name"], "email": admin["email"], "password": admin["password"]})
assert status == 200, "管理员登录失败"
token = login.get("token") or login.get("data", {}).get("token")
assert token, "未获得管理员令牌"
report["admin_login"] = status
data = {"name": "迁移功能验收", "email": "migration-qa@example.invalid", "content": "迁移验收：**Markdown** 与 <em>HTML</em>，表情 OωO。", "page_key": "/migration-qa/", "page_title": "隔离迁移验收", "site_name": "Dusklight", "ua": "Dusklight migration QA"}
ids = []
for rid in [0, "parent", "child"]:
    payload = {**data, "rid": 0 if not ids else ids[-1]}
    if len(ids) == 2:
        payload.update(name=admin["name"], email=admin["email"])
    status, comment = request("POST", "/comments", payload, authenticated=len(ids) == 2)
    assert status == 200, f"发表/回复阶段 {len(ids)} 失败，状态 {status}: {comment.get('msg', '')}"
    comment = comment.get("data", comment)
    assert comment["rid"] == payload["rid"], "回复目标不一致"
    assert "<strong>" in comment["content_marked"] and "<em>HTML</em>" in comment["content_marked"], "正文格式退化"
    ids.append(comment["id"])
report["create_and_nested_reply"] = len(ids)
for _ in range(4):
    status, blocked = request("POST", "/comments", data)
    if status in (403, 429):
        break
    assert status == 200, "限流前的正常发表失败"
assert status in (403, 429), f"频率验证未触发: {status}"
report["rate_limit"] = status
status, captcha = request("GET", "/captcha")
assert status == 200 and (captcha.get("img_data") or captcha.get("data", {}).get("img_data")), "图片验证码未生成"
status, _ = request("POST", "/captcha/verify", {"value": "definitely-wrong"})
assert status == 403, "错误验证码未拦截"
report["captcha_invalid"] = status
update = {**data, "content": "迁移验收：已审核并置顶", "rid": 0, "is_pending": True, "is_pinned": True, "is_collapsed": False}
status, _ = request("PUT", f"/comments/{ids[0]}", update, True)
assert status == 200, "管理员审核/置顶失败"
status, edited = request("GET", f"/comments/{ids[0]}", authenticated=True)
edited = edited.get("data", edited)
edited = edited.get("comment", edited)
assert status == 200 and edited["is_pending"] and edited["is_pinned"], "审核/置顶状态未持久化"
status, hidden = request("GET", "/comments?" + urllib.parse.urlencode({"page_key": "/migration-qa/", "site_name": "Dusklight", "flat_mode": "true"}))
assert status == 200, "公开列表读取失败"
assert all(c["id"] != ids[0] for c in hidden["comments"]), "待审评论泄漏到公开列表"
report["moderation_pin"] = "ok"
# 此服务始终关闭真实通知；SMTP 使用单独脚本仅发往已确认的博主地址。
report["real_notifications"] = "disabled"
pathlib.Path("/opt/artalk/rehearsal/api-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
