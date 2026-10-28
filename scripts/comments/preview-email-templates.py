"""用虚构内容生成本地邮件预览，不连接 SMTP，也不读取真实用户资料。"""
import argparse
import html
from pathlib import Path
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("output", type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
values = {
    "nick": "来访的朋友",
    "reply_nick": "辰渊尘",
    "page_title": "把日常写进博客，留住值得记下的瞬间",
    "reply_content": "<p>谢谢你的分享！文字和照片都很有温度。</p><p>也欢迎继续聊聊你的想法。</p>",
    "content": "<p>最近也在整理自己的博客，很喜欢这里的阅读体验。</p>",
    "link_to_reply": "https://blog.mcxiaochen.top/envelope/#comments",
    "code": "000000",
}
for name in ("reply", "admin", "verify"):
    template = (Path(__file__).with_name("mail-templates") / f"{name}.html").read_text(encoding="utf-8")
    def replace(match):
        key = match[1]
        value = values[key]
        # 与原生模板的双花括号语义一致；此处只是静态预览，不代替收件验收。
        return value if key in ("reply_content", "content", "link_to_reply") else html.escape(value)
    rendered = re.sub(r"{{([a-z_]+)}}", replace, template)
    (args.output / f"{name}.html").write_text(rendered, encoding="utf-8")
print("已生成三个虚构内容预览；000000 是展示占位，不是有效验证码。")
