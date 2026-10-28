# Artalk 邮件模板

脚本与三个独立 HTML 位于 scripts/comments/。无需添加 Python 依赖。

生成静态预览（不连接 SMTP；验证码 000000 只是占位）：

```powershell
python scripts/comments/preview-email-templates.py <仓库外的本地预览目录>
python -m unittest discover -s scripts/comments -p test_email_templates.py -v
```

三类模板分别对应 email.mail_tpl、admin_notify.email.mail_tpl、auth.email.verify_tpl。
验证码主题不包含 code；正文按固定版本写明 5 分钟有效。
内容使用原生模板变量，不新增 content_raw、不额外绕过原生转义。
布局以表格与内联样式为主，嵌入样式限制评论图片、代码和长链接。无需远程字体、脚本或品牌图片。
信任边界：`{{reply_content}}`、`{{content}}` 按原生语义原样插入邮件 HTML，净化完全依赖 Artalk 服务端对评论内容的处理；若关闭或绕过服务端净化，邮件面即成为注入面。`{{link_to_reply}}` 同理按原生变量输出。

后续部署必须先保存实际活动数据目录、配置、现有模板和前端版本，并校验本机备份：

1. 使用更新后的 backup-artalk.py 创建一致性备份，SHA256SUMS 覆盖 mail-templates 子目录。
2. 将 email_templates.py 及其同级 mail-templates 文件夹上传至私有运维目录。
3. 对持久配置和活动 runtime 配置分别执行下列命令，data_dir 必须来自 Docker 的实际 /data 挂载，不能猜测为 /opt/artalk/data。
4. 仅重载 Artalk，验证路径与模板，再用受控邮箱验收。SMTP 接受不等于收件通过。

```sh
python3 email_templates.py <现有配置文件> <实际活动数据目录>
```

安装器只改模板路径和验证码主题，保留 SMTP 凭据、发送开关及身份设置。
prepare-artalk.py 在新候选初始化时安装模板；configure-auth.py 保留 auth.email 的模板配置。

## 验收与发布门槛

2026-10-27：三个安装测试通过，覆盖配置保留、不完整模板包停止写入以及原生变量白名单。
三类虚构内容静态预览在桌面和移动端可读，长代码及宽图片无横向溢出。预览不连接 SMTP，也不读取真实用户资料。

本次仅提交草稿 PR，不修改生产配置、不发邮件。真实收件、邮件客户端兼容性均未验收；不能以静态浏览器预览或 SMTP 接受代替实际收件。后续须在受控 QA 完成回复、博主通知和验证码邮件收件及链接验证，再部署生产。

回退时恢复旧模板及配置；不使用旧数据库覆盖在线数据。备份中的 mail-templates 子目录必须随配置一起恢复。


## 2026-10-28 隔离验收准备

新建空 QA 数据库，仅包含合成账号和评论，绑定服务器 localhost，经本机 SSH 隧道访问。三个模板已安装；生产配置、OAuth App、账号关联及评论数据未修改。

真实 SMTP 与 GitHub 尚未开放。独立 QA OAuth App 和受控 QQ/Gmail 收件地址等待用户通过服务器私有文件填写；文件权限 0600，凭据不进入仓库。后续须核对 QQ/Gmail 网页端及移动端实际收到三类邮件、链接定位和注册/重置闭环。Outlook 未覆盖。

草稿 PR 保持草稿；不能以已通过的静态预览、安装测试或合成账号登录替代真实收件与授权。

QA 额外隔离：SMTP 主机设为容器本机不可投递端口，真实投递配置仅存在 0600 私有文件。使用 example.invalid 合成地址验证验证码申请返回 200、同邮箱重复申请返回 400、数据库有效期为 300 秒；未实际投递邮件，不能替代收件验收。


## 2026-10-28 生产模板部署

用户追加授权后，三类模板已部署生产；本节为最新状态，前述“未修改生产”描述仅对应此前阶段。没有合并前端 PR，也没有写入测试评论。

- 备份：`/opt/backups/dusklight-comments/20261028-124555-artalk-production/`；一致性 SQLite 校验通过，34 个文件的 SHA-256 与本机受限副本全部一致。
- 本机副本：`D:\Backups\Dusklight\comment-migration\20261028-124555-artalk-production\`。备份至少保留 30 天，不自动删除。
- 活动目录由容器挂载确认：`/opt/artalk/releases/20261025-222818-final/data`。模板为该目录下 `mail-templates/reply.html`、`admin.html`、`verify.html`。
- 持久配置与活动 runtime 配置均更新模板路径及验证码主题；部署脚本比对确认非模板设置不变，包括 SMTP、登录方式和管理员配置。
- 仅重启 `dusklight-artalk`；另外 19 个容器的 ID、启动时间均不变。重启后数据库 quick_check 为 ok，评论 553、用户 155、登录身份 1，计数与部署前一致。
- 本机与公开配置接口、公开管理页返回 200，模板 SHA-256 一致。观察日志有两次旧 assets 路径 404（共 4 行），未发现模板加载错误。
- 本轮没有实际发送或接收验收邮件；QQ/Gmail 网页端及移动端收件、链接定位仍待确认，不能将配置上线视为收件通过。PR 保持草稿。

回退仅将上述备份的 `runtime.private.yml` 恢复为活动目录的 `artalk.yml`，将 `production.private.yml` 恢复到 `/opt/artalk/production.private.yml`，如备份存在旧模板则恢复旧模板；随后仅重启 Artalk 并复核接口。不得用备份数据库覆盖线上新增账号或评论。新模板文件可以保留为未引用文件，无需删除。
