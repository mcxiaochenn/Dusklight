"""为实际挂载的 Artalk 数据目录创建一致性快照和私有备份，不停止服务。"""
import datetime
import hashlib
import json
import os
import pathlib
import shutil
import sqlite3
import subprocess
import tarfile
from zoneinfo import ZoneInfo

os.umask(0o077)
root = pathlib.Path("/opt/artalk")
mounts = json.loads(subprocess.check_output(["docker", "inspect", "dusklight-artalk", "--format", "{{json .Mounts}}"], text=True))
active_data = pathlib.Path(next(mount["Source"] for mount in mounts if mount["Destination"] == "/data")).resolve()
assert root in active_data.parents, "活动数据挂载不在已审查的 /opt/artalk 内"
production = active_data != root / "data"
release = active_data.parent if production else root / "rehearsal"
stamp = datetime.datetime.now(ZoneInfo("Asia/Shanghai")).strftime("%Y%m%d-%H%M%S")
backup = pathlib.Path("/opt/backups/dusklight-comments") / (stamp + ("-artalk-production" if production else "-artalk-candidate"))
backup.mkdir(mode=0o700)
source = sqlite3.connect(f"file:{active_data}/artalk.db?mode=ro", uri=True)
destination = sqlite3.connect(backup / "artalk.db")
source.backup(destination)
assert destination.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
destination.close()
source.close()
for source_name, target in [
    ("production.private.yml", "production.private.yml"),
    ("admin.private.json", "admin.private.json"), ("compose.yml", "compose.yml"),
    ("rehearsal/image-digest.txt", "image-digest.txt"),
    ("rehearsal/api-verification.json", "api-verification.json"),
    ("rehearsal/smtp-verification.json", "smtp-verification.json"), ("rehearsal/service-verification.json", "service-verification.json"),
    ("rehearsal/browser-verification.json", "browser-verification.json"),
]:
    shutil.copy2(root / source_name, backup / target)
shutil.copy2(active_data / "artalk.yml", backup / "runtime.private.yml")
runtime = json.loads((active_data / "artalk.yml").read_text())
for template in (
    runtime.get("email", {}).get("mail_tpl", ""),
    runtime.get("admin_notify", {}).get("email", {}).get("mail_tpl", ""),
    runtime.get("auth", {}).get("email", {}).get("verify_tpl", ""),
):
    if template.startswith("/data/mail-templates/"):
        assert (active_data / template.removeprefix("/data/")).is_file(), "邮件模板缺失，停止备份"
if (active_data / "mail-templates").is_dir():
    shutil.copytree(active_data / "mail-templates", backup / "mail-templates")
for source, target in [
    (release / ("legacy-map.json" if production else "legacy-map-final-verified.json"), "legacy-map.json"),
    (release / "data-verification.json", "data-verification.json"),
]:
    shutil.copy2(source, backup / target)
for source_name, target in [
    (root / "oauth.private.json", "oauth.private.json"),
    (root / "origin-auth.private.json", "origin-auth.private.json"),
    (release / "historical-avatars.json", "historical-avatars.json"),
    (root / "cutover-state.private.json", "cutover-state.private.json"),
    (root / "login-change.private.json", "login-change.private.json"),
    (root / "rehearsal/github-notification-verification.json", "github-notification-verification.json"),
    (release / "post-cutover-verification.json", "post-cutover-verification.json"),
    (pathlib.Path("/opt/1panel/www/sites/artalk.mcxiaochen.top/index/json/owo.json"), "owo.json"),
    (pathlib.Path("/opt/1panel/www/conf.d/artalk.mcxiaochen.top.conf"), "artalk-openresty.private.conf"),
    (pathlib.Path("/opt/1panel/www/conf.d/twikoo.mcxiaochen.top.conf"), "twikoo-openresty.private.conf"),
]:
    if source_name.exists():
        shutil.copy2(source_name, backup / target)
for record in (root / "identity-bindings").glob("*.json"):
    shutil.copy2(record, backup / ("identity-binding-" + record.name))
for extension in ("service", "timer"):
    for unit in pathlib.Path("/etc/systemd/system").glob("dusklight-artalk-login-observe-*." + extension):
        shutil.copy2(unit, backup / unit.name)
for label in ("24h", "7d"):
    for extension in ("service", "timer"):
        unit = pathlib.Path(f"/etc/systemd/system/dusklight-artalk-observe-20261025-{label}.{extension}")
        if unit.exists():
            shutil.copy2(unit, backup / unit.name)
observations = sorted((root / "observations").glob("*-immediate.json"))
if observations:
    shutil.copy2(observations[-1], backup / "immediate-observation.json")
with (backup / "SHA256SUMS").open("x") as manifest:
    for file in sorted(backup.rglob("*")):
        if file.is_file() and file.name != "SHA256SUMS":
            manifest.write(hashlib.sha256(file.read_bytes()).hexdigest() + "  ./" + file.relative_to(backup).as_posix() + "\n")
archive = backup.with_suffix(".tar.gz")
with tarfile.open(archive, "x:gz") as tar:
    tar.add(backup, arcname=backup.name)
print("ARTALK_BACKUP=" + str(backup))
print("ARCHIVE_SHA256=" + hashlib.sha256(archive.read_bytes()).hexdigest())
