"""在全新内网、目录及容器恢复 Twikoo 备份；不覆盖生产目录，不访问外网。"""
import argparse
import datetime
import hashlib
import json
import os
import pathlib
import subprocess
import time
import urllib.parse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("backup", type=pathlib.Path)
args = parser.parse_args()
os.umask(0o077)
backup = args.backup.resolve()
assert backup.parent == pathlib.Path("/opt/backups/dusklight-comments")
suffix = backup.name + "-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
root = pathlib.Path("/opt/artalk/rehearsal") / ("restore-" + suffix)
root.mkdir(mode=0o700)


def run(label, command, *, stdin=None, allowed_failure=False):
    result = subprocess.run(command, stdin=stdin, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    (root / (label + ".private.log")).write_bytes(result.stderr)
    if result.returncode and not allowed_failure:
        # 不能在异常中回显含数据库凭据的完整 argv。
        raise RuntimeError(label + " 失败，详见本次演练私有日志")
    return result


# 清单中的相对路径以备份目录为准，不改变调用进程的工作目录。
for line in (backup / "SHA256SUMS").read_text().splitlines():
    digest, name = line.split("  ", 1)
    with (backup / name).open("rb") as file:
        assert hashlib.file_digest(file, "sha256").hexdigest() == digest, "备份校验失败"

inspected = json.loads((backup / "twikoo-inspect.private.json").read_text())
old_app = next(item for item in inspected if item["Name"] == "/twikoo")
old_mongo = next(item for item in inspected if item["Name"] == "/twikoo-mongo")
network = "dusklight-restore-" + suffix
mongo = "dusklight-mongo-restore-" + suffix
app = "dusklight-twikoo-restore-" + suffix
run("network", ["docker", "network", "create", "--internal", network])
containers = []
report = {"backup": backup.name, "network_internal": True, "run_dir": str(root)}
try:
    mongo_env = dict(value.split("=", 1) for value in old_mongo["Config"]["Env"])
    mongo_args = ["docker", "run", "-d", "--name", mongo, "--network", network]
    app_env = dict(value.split("=", 1) for value in old_app["Config"]["Env"])
    # Compose 中实际使用 mongodb 别名，不能假设 URI 主机等于容器名。
    mongo_host = urllib.parse.urlsplit(app_env["MONGODB_URI"]).hostname
    assert mongo_host and mongo_host not in ("localhost", "127.0.0.1"), "需检查旧 MongoDB 连接布局"
    mongo_args += ["--network-alias", mongo_host]
    for name in ("MONGO_INITDB_ROOT_USERNAME", "MONGO_INITDB_ROOT_PASSWORD"):
        mongo_args += ["-e", name + "=" + mongo_env[name]]
    for target in ("db", "configdb"):
        path = root / target
        path.mkdir(mode=0o700)
        mongo_args += ["-v", str(path) + ":/data/" + target]
    run("mongo-start", mongo_args + [old_mongo["Image"]])
    containers.append(mongo)
    auth = "db.getSiblingDB('admin').auth(process.env.MONGO_INITDB_ROOT_USERNAME,process.env.MONGO_INITDB_ROOT_PASSWORD);"
    for attempt in range(90):
        ready = run("mongo-ready", ["docker", "exec", mongo, "mongosh", "--quiet", "--norc", "--eval", auth + "quit(db.adminCommand({ping:1}).ok===1?0:1)"], allowed_failure=True)
        if ready.returncode == 0:
            break
        time.sleep(1)
    else:
        raise RuntimeError("隔离 MongoDB 未就绪")
    with (backup / "mongo.archive.gz").open("rb") as source:
        run("mongorestore", ["docker", "exec", "-i", mongo, "sh", "-c", 'exec mongorestore --drop --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip'], stdin=source)
    counts = {}
    for collection in ("comment", "config", "counter", "cap_kv"):
        query = auth + f"print(EJSON.stringify(db.getSiblingDB('twikoo').getCollection('{collection}').find({{}}).sort({{_id:1}}).toArray(),{{relaxed:true}}));"
        data = run("read-" + collection, ["docker", "exec", mongo, "mongosh", "--quiet", "--norc", "--eval", query]).stdout
        restored = json.loads(data)
        expected = json.loads((backup / (collection + ".private.json")).read_text())
        assert restored == expected, collection + " 恢复后逐条对账失败"
        counts[collection] = len(restored)
    report["collections_equal"] = counts
    app_args = ["docker", "run", "-d", "--name", app, "--network", network]
    for value in old_app["Config"]["Env"]:
        app_args += ["-e", value.replace("twikoo-mongo", mongo)]
    run("twikoo-start", app_args + [old_app["Image"]])
    containers.append(app)
    script = "fetch('http://127.0.0.1:8080/',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'GET_RECENT_COMMENTS',includeReply:true,pageSize:5})}).then(async r=>console.log(JSON.stringify({status:r.status,data:await r.json()}))).catch(()=>process.exit(1))"

    def list_size(value):
        if isinstance(value, list):
            return len(value)
        if isinstance(value, dict):
            return max((list_size(item) for item in value.values()), default=0)
        return 0

    for attempt in range(60):
        response = run("twikoo-read", ["docker", "exec", app, "node", "-e", script], allowed_failure=True)
        if response.returncode == 0:
            body = json.loads(response.stdout)
            if body.get("status") == 200 and list_size(body.get("data")) == min(5, counts["comment"]):
                break
        time.sleep(1)
    else:
        raise RuntimeError("恢复后的 Twikoo 读取失败")

    assert list_size(body["data"]) == min(5, counts["comment"]), "旧服务最新评论数量异常"
    report["old_twikoo_read"] = {"status": 200, "comments": list_size(body["data"])}
    (root / "RESTORE.txt").write_text("本批在全新目录和 internal 网络恢复，未覆盖生产目录。\n各集合完整内容相等，旧 Twikoo API 读取通过。\n演练容器仅停止，数据和日志保留；正式恢复仍需另行确认目标目录。\n")
    (root / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False))
finally:
    for container in reversed(containers):
        run("stop-" + container, ["docker", "stop", container], allowed_failure=True)
