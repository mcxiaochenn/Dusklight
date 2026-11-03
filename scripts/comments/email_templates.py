"""安装三类邮件模板；只更新模板路径与验证码主题，不触碰发送和登录开关。"""
import argparse
import json
import os
from pathlib import Path


def install_templates(settings, data_dir):
    source = Path(__file__).with_name("mail-templates")
    # 在任何写入之前确认安装包完整。
    templates = {name: (source / f"{name}.html").read_bytes() for name in ("reply", "admin", "verify")}
    target = data_dir / "mail-templates"
    target.mkdir(parents=True, exist_ok=True)
    for name, content in templates.items():
        temporary = target / f"{name}.html.tmp"
        with temporary.open("xb") as stream:
            stream.write(content)
        temporary.replace(target / f"{name}.html")
    settings.setdefault("email", {})["mail_tpl"] = "/data/mail-templates/reply.html"
    settings.setdefault("admin_notify", {}).setdefault("email", {})["mail_tpl"] = "/data/mail-templates/admin.html"
    email = settings.setdefault("auth", {}).setdefault("email", {})
    email["verify_tpl"] = "/data/mail-templates/verify.html"
    email["verify_subject"] = "[辰渊尘の博客] 邮箱验证码"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path, help="已有的 JSON 格式 Artalk 配置")
    parser.add_argument("data_dir", type=Path, help="实际挂载到容器 /data 的主机目录")
    args = parser.parse_args()
    os.umask(0o077)
    settings = json.loads(args.config.read_text(encoding="utf-8"))
    install_templates(settings, args.data_dir)
    temporary = args.config.with_suffix(".mail-tmp")
    with temporary.open("x", encoding="utf-8") as stream:
        json.dump(settings, stream, ensure_ascii=False, indent=2)
    os.chmod(temporary, 0o600)
    temporary.replace(args.config)
    print("邮件模板已安装；未发送邮件，未重启服务。")


if __name__ == "__main__":
    main()
