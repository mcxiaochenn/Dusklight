"""从服务器私有文件启用邮箱与 GitHub 登录，禁止匿名评论；不输出凭据。"""
import argparse
import json
import os
import pathlib

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("config", type=pathlib.Path)
parser.add_argument("credentials", type=pathlib.Path)
args = parser.parse_args()
os.umask(0o077)
if args.credentials.stat().st_mode & 0o077:
    raise ValueError("OAuth 凭据必须仅 root 可读（0600）")
credentials = json.loads(args.credentials.read_text())
if not all(isinstance(credentials.get(key), str) and credentials[key].strip() for key in ("client_id", "client_secret")):
    raise ValueError("OAuth 凭据尚未填写；不修改配置")
settings = json.loads(args.config.read_text())
settings["auth"] = {
    "enabled": True,
    "anonymous": False,
    "callback": "https://artalk.mcxiaochen.top",
    "email": {**settings.get("auth", {}).get("email", {}), "enabled": True},
    "github": {"enabled": True, "client_id": credentials["client_id"], "client_secret": credentials["client_secret"]},
}
temporary = args.config.with_suffix(".oauth-tmp")
with temporary.open("x") as f:
    json.dump(settings, f, ensure_ascii=False, indent=2)
os.chmod(temporary, 0o600)
temporary.replace(args.config)
print("邮箱与 GitHub 登录配置完成，匿名评论已禁用；需重载对应 Artalk 服务。")
