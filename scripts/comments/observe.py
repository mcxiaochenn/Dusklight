"""迁移上线只读复查：不发表、编辑评论，不发邮件，不重启或回退服务。"""
import argparse
import collections
import datetime
import json
import os
import pathlib
import re
import sqlite3
import subprocess
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--label", choices=("immediate", "24h", "7d"), default="immediate")
args = parser.parse_args()
os.umask(0o077)
root = pathlib.Path("/opt/artalk")
now = datetime.datetime.now(ZoneInfo("Asia/Shanghai"))
state = json.loads((root / "cutover-state.private.json").read_text())
login_state_path = root / "login-change.private.json"
login_state = json.loads(login_state_path.read_text()) if login_state_path.exists() else None
report = {"at": now.isoformat(), "label": args.label, "phase": state["phase"], "issues": [], "http": {}}


def docker_json(name, template):
    return json.loads(subprocess.check_output(["docker", "inspect", name, "--format", template], text=True))


for name, running in (("dusklight-artalk", True), ("twikoo", False), ("twikoo-mongo", True)):
    actual = docker_json(name, "{{json .State.Running}}")
    report[name + "_running"] = actual
    if actual != running:
        report["issues"].append(name + " 服务状态不符")
mounts = docker_json("dusklight-artalk", "{{json .Mounts}}")
data = pathlib.Path(next(item["Source"] for item in mounts if item["Destination"] == "/data"))
assert root in data.resolve().parents
settings = json.loads((data / "artalk.yml").read_text())
report["github_enabled"] = bool(settings.get("auth", {}).get("github", {}).get("enabled"))
report["email_login_enabled"] = bool(settings.get("auth", {}).get("email", {}).get("enabled"))
report["anonymous_enabled"] = bool(settings.get("auth", {}).get("anonymous"))
report["notifications_enabled"] = bool(settings.get("email", {}).get("enabled"))
if state["phase"] != "live" or not report["github_enabled"] or not report["notifications_enabled"] or not report["email_login_enabled"] or report["anonymous_enabled"]:
    report["issues"].append("正式配置或开放状态不符")
with sqlite3.connect(f"file:{data}/artalk.db?mode=ro", uri=True) as db:
    report["integrity"] = db.execute("PRAGMA integrity_check").fetchone()[0]
    report["comments_including_soft_deleted"] = db.execute("SELECT count(*) FROM comments").fetchone()[0]
    report["public_comments"] = db.execute("SELECT count(*) FROM comments WHERE deleted_at IS NULL AND is_pending=0").fetchone()[0]
    report["orphan_replies"] = db.execute("SELECT count(*) FROM comments c WHERE c.rid!=0 AND NOT EXISTS(SELECT 1 FROM comments p WHERE p.id=c.rid)").fetchone()[0]
    report["emailed_notifications"] = db.execute("SELECT count(*) FROM notifies WHERE is_emailed=1").fetchone()[0]
    if login_state and login_state.get("phase") == "live":
        request = json.loads(pathlib.Path(login_state["binding_request"]).read_text())
        identity = db.execute("SELECT user_id FROM auth_identities WHERE id=? AND provider='github' AND remote_uid=? AND deleted_at IS NULL", (request["identity_id"], request["remote_uid"])).fetchone()
        owner = db.execute("SELECT is_admin FROM users WHERE id=? AND deleted_at IS NULL", (request["target_user_id"],)).fetchone()
        report["owner_github_binding_valid"] = bool(identity and identity[0] == request["target_user_id"] and owner and owner[0])
        if not report["owner_github_binding_valid"]:
            report["issues"].append("博主 GitHub 关联或权限异常")
if report["integrity"] != "ok" or report["orphan_replies"] or report["comments_including_soft_deleted"] < 552:
    report["issues"].append("评论完整性或历史数量异常")
for path in ("/api/v2/version", "/api/v2/conf/auth/providers", "/json/owo.json"):
    try:
        with urllib.request.urlopen("https://artalk.mcxiaochen.top" + path, timeout=20) as response:
            json.load(response)
            report["http"][path] = response.status
    except Exception:
        report["http"][path] = "failed"
        report["issues"].append(path + " 无法读取")

# 仅统计日志中的状态码，不把邮箱、IP、正文或 Token 写入复查结果。
result = subprocess.run(["docker", "exec", "1Panel-openresty-zGzc", "tail", "-n", "20000", "/var/log/nginx/artalk-access.log"], capture_output=True, text=True)
counts = collections.Counter()
login_counts = collections.defaultdict(collections.Counter)
opened = datetime.datetime.fromisoformat(login_state["opened_at"] if login_state and login_state.get("phase") == "live" else state["opened_at"])
for line in result.stdout.splitlines():
    login = re.search(r'\[([^\]]+)\] "POST /api/v2/auth/email/(send|register|login)(?:\?[^ ]*)? HTTP/[^\"]+" (\d{3})', line)
    if login and datetime.datetime.strptime(login[1], "%d/%b/%Y:%H:%M:%S %z") >= opened:
        login_counts[login[2]][login[3]] += 1
    match = re.search(r'\[([^\]]+)\] "POST /api/v2/comments(?:\?[^ ]*)? HTTP/[^\"]+" (\d{3})', line)
    if match and datetime.datetime.strptime(match[1], "%d/%b/%Y:%H:%M:%S %z") >= opened:
        counts[match[2]] += 1
report["submission_status_sample"] = dict(counts)
report["email_auth_status_sample"] = {path: dict(statuses) for path, statuses in login_counts.items()}
total = sum(counts.values())
report["submission_success_rate_sample"] = round(sum(n for status, n in counts.items() if status.startswith("2")) / total, 4) if total else None
report["log_sample_limit"] = 20000
if result.returncode or any(status.startswith("5") for status in counts):
    report["issues"].append("提交日志存在 5xx 或日志不可读")
log_start = max(opened, now - datetime.timedelta(hours=168 if args.label == "7d" else 24))
report["backend_log_since"] = log_start.isoformat()
logs = subprocess.run(["docker", "logs", "--since", log_start.isoformat(), "--tail", "2000", "dusklight-artalk"], capture_output=True, text=True)
report["backend_error_lines_sample"] = sum(bool(re.search(r'\b(error|fatal|panic)\b', line, re.I)) for line in (logs.stdout + logs.stderr).splitlines())
out = root / "observations"
out.mkdir(mode=0o700, exist_ok=True)
with (out / (now.strftime("%Y%m%d-%H%M%S") + "-" + args.label + ".json")).open("x") as file:
    json.dump(report, file, ensure_ascii=False, indent=2)
print(json.dumps(report, ensure_ascii=False))
raise SystemExit(1 if report["issues"] else 0)
