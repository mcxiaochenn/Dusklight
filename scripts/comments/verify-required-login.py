"""仅在 login-change.private.json 指定的独立 QA 中验证登录限制；不读取生产 API。"""
import base64
import datetime
import hashlib
import hmac
import json
import pathlib
import secrets
import sqlite3
import time
import urllib.error
import urllib.request

root = pathlib.Path('/opt/artalk')
state = json.loads((root / 'login-change.private.json').read_text())
data = pathlib.Path(state['directory'])
assert data.parent == root / 'rehearsal' and data.name.startswith('qa-required-login-')
assert state['port'] == 23369
config = json.loads((data / 'artalk.yml').read_text())
assert config['auth']['anonymous'] is False and config['auth']['email']['enabled'] is True
assert config['email']['enabled'] is False, '合成测试必须关闭真实邮件'
base = 'http://127.0.0.1:23369/api/v2'
report = {}
counter = 0


def api(method, path, payload=None, token=None):
    global counter
    counter += 1
    headers = {'Content-Type': 'application/json', 'X-Real-IP': '198.51.100.' + str(counter)}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, json.load(e)


def seed_code(email, *, expired=False):
    # 仅用于 QA 错误码/到期/重放测试，真实收件闭环须另行人工验证。
    now = datetime.datetime.now(datetime.timezone.utc)
    with sqlite3.connect(data / 'artalk.db') as db:
        db.execute('DELETE FROM user_email_verifies WHERE email=?', (email,))
        db.execute('INSERT INTO user_email_verifies(created_at,updated_at,email,code,expires_at,ip,ua) VALUES(?,?,?,?,?,?,?)', (now.isoformat(), now.isoformat(), email, '529461', (now + datetime.timedelta(minutes=-1 if expired else 5)).isoformat(), '198.51.100.240', 'isolated QA'))


with sqlite3.connect(data / 'artalk.db') as db:
    before = db.execute('SELECT count(*) FROM comments').fetchone()[0]
payload = {'name': '登录限制测试', 'email': 'login-qa@example.invalid', 'content': '仅 QA 登录验收', 'page_key': '/envelope/', 'page_title': 'QA', 'site_name': 'Dusklight'}
for label, token in [('anonymous', None), ('forged_token', 'invalid-token')]:
    status, _ = api('POST', '/comments', payload, token)
    assert status >= 400
    report[label + '_rejected'] = status
with sqlite3.connect(data / 'artalk.db') as db:
    assert db.execute('SELECT count(*) FROM comments').fetchone()[0] == before
email = payload['email']
password = secrets.token_urlsafe(24)
seed_code(email)
status, _ = api('POST', '/auth/email/register', {'name': payload['name'], 'email': email, 'password': password, 'code': 'wrong'})
assert status >= 400
seed_code(email, expired=True)
status, _ = api('POST', '/auth/email/register', {'name': payload['name'], 'email': email, 'password': password, 'code': '529461'})
assert status >= 400
seed_code(email)
status, user = api('POST', '/auth/email/register', {'name': payload['name'], 'email': email, 'password': password, 'code': '529461'})
assert status == 200 and not user['user']['is_admin']
token = user['token']
assert api('POST', '/auth/email/login', {'email': email, 'password': password})[0] == 200
assert api('POST', '/auth/email/login', {'email': email, 'code': '529461'})[0] >= 400
assert api('POST', '/auth/email/login', {'email': email, 'password': 'wrong'})[0] >= 400
report['email_registration_password_login_wrong_expired_replay'] = 'passed'
ids = []
for level in range(3):
    current = dict(payload, rid=ids[-1] if ids else 0)
    status, comment = api('POST', '/comments', current, token)
    assert status == 200, (status, comment.get('msg'))
    ids.append(comment['id'])
    assert comment['is_verified']
report['authenticated_reply_levels'] = len(ids)
with sqlite3.connect(data / 'artalk.db') as db:
    uid = db.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()[0]
encode = lambda x: base64.urlsafe_b64encode(json.dumps(x, separators=(',', ':')).encode()).rstrip(b'=')
unsigned = encode({'alg': 'HS256', 'typ': 'JWT'}) + b'.' + encode({'user_id': uid, 'iat': int(time.time())-100, 'exp': int(time.time())-10})
expired_token = (unsigned + b'.' + base64.urlsafe_b64encode(hmac.new(config['app_key'].encode(), unsigned, hashlib.sha256).digest()).rstrip(b'=')).decode()
assert api('POST', '/comments', payload, expired_token)[0] >= 400
seed_code(email)
new_password = secrets.token_urlsafe(24)
assert api('POST', '/auth/email/register', {'email': email, 'password': new_password, 'code': '529461'})[0] == 200
assert api('POST', '/auth/email/login', {'email': email, 'password': password})[0] >= 400
assert api('POST', '/auth/email/login', {'email': email, 'password': new_password})[0] == 200
report['password_reset_and_expired_token'] = 'passed'
assert api('POST', '/auth/email/send', {'email': email})[0] == 200
assert api('POST', '/auth/email/send', {'email': email})[0] >= 400
report['email_resend_rate_limit'] = 'passed'
report['real_email_receipt'] = 'pending_separate_acceptance'
with sqlite3.connect(data / 'artalk.db') as db:
    assert db.execute('SELECT count(*) FROM comments').fetchone()[0] == before + 3
    assert db.execute('SELECT count(*) FROM comments WHERE user_id=1').fetchone()[0] == 245
    assert db.execute('SELECT count(*) FROM comments WHERE user_id=24').fetchone()[0] == 2
report['owner_and_other_comments_unchanged'] = True
(data / 'required-login-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
