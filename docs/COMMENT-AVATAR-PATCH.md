# Artalk 评论头像补丁

## 已实现的行为

主评论和侧栏最新评论共用解析规则：**后端 `avatar_url` → 419 条历史映射 → 本站 `/images/avatar-fallback.svg`**。有后端头像的历史评论允许更新显示，映射文件本身不变。远程图片失败只回退一次，本地图也失败时隐藏图片、保留容器中的本地图标，不请求 Gravatar。

后端基于 Artalk `v2.10.0`（上游提交 `1bf21404bd618d61bc336d0618f82de4872d6d74`），补丁提交为 `82a7aae698004c0641be5f82fa2b8692bfb4ffde`，版本标识 `v2.10.0-avatar.1`。不修改邮箱哈希、权限、身份关联、评论内容或登录方式。

- 用户实体新增 `avatar_url` 列；评论响应新增同名可选字段，空值不输出。
- 头像解析优先使用持久化头像；否则将邮箱去除首尾空白、转小写，严格匹配 `^[1-9][0-9]{4,10}@qq\.com$`，构造与历史映射相同格式的 QQ URL。
- GitHub OAuth 完成身份关联、找到最终用户之后才同步头像，新用户与已有用户均适用。只接受非空 HTTPS URL，拒绝带 URL 用户信息的地址；相同值不写入，空值不清除旧头像。
- 只更新头像列，成功后使用户缓存失效；失败记录简短日志，继续原登录流程。
- 不添加上传、编辑或管理接口，不向客户端公开邮箱明文。QQ 图片 URL 会公开对应 QQ 号码。

博客直接复用 Artalk 的 `avatarURLBuilder`，没有 npm 包补丁。评论的失败标记使用 `data-comment-avatar-fallback`，避免与站点通用头像监听器的 `data-avatar-fallback` 冲突。保留已有网络异常构建补丁。

## 补丁与构建

`patches/artalk/v2.10.0-avatar.patch` 是可由 `git am` 应用的后端提交，集中修改用户/评论实体、评论装配和 OAuth 回调，并包含实体、DAO、认证测试。新增逻辑位于独立的 `avatar.go` 中。上游回调、用户实体和 `CookComment` 是升级时需要检查的交叉点。

本地上游分支保存在 `Temp/artalk-avatar-upstream` 的 `codex/comment-avatar`；可追溯交付物是纳入本仓库版本控制的补丁，不依赖临时目录，也不要求创建远程 fork。需要独立 fork 时可直接应用同一提交。

```sh
git clone --branch v2.10.0 https://github.com/ArtalkJS/Artalk.git artalk-avatar
cd artalk-avatar
git switch -c codex/comment-avatar
git am /path/to/Dusklight/patches/artalk/v2.10.0-avatar.patch
go test ./internal/entity ./internal/dao ./internal/auth ./server/handler
```

在 Dusklight 根目录构建镜像：

```sh
docker build -f scripts/comments/avatar.Dockerfile -t dusklight-artalk:v2.10.0-avatar.1 .
```

Dockerfile 固定上游提交和 Go 版本；嵌入官方同版本 `artalk_ui.tar.gz`，校验 SHA-256 `6e6b5456a3265e29cecb36b7d935dbafb6639035e2681901123b6b150e307379`，保留完整管理后台与登录插件。最终运行层复用原生产镜像 digest，替换后端二进制。Dockerfile 专属忽略文件只允许头像补丁进入构建上下文，数据库、配置和密钥不进入上下文。

`.github/workflows/artalk-avatar.yml` 先执行前端及回填单测，再构建并发布 GHCR 镜像；标签包含站点提交 SHA，工作流摘要输出不可变 digest。博客前端由原站点流水线独立构建。内置管理界面头像适配不在本次范围内。

## 回填操作

工具默认使用 SQLite 只读连接，不创建数据库、不执行迁移；必须先完成新版本补列。自动发现唯一的用户表/身份表组合，也可用 `--table-prefix` 明确指定。多个匹配表、缺少列时直接失败。

```sh
python3 scripts/comments/backfill-avatars.py /isolated/data/artalk.db
# 停写并确认备份后执行；必须指向已迁移的目标库。
python3 scripts/comments/backfill-avatars.py /isolated/data/artalk.db --apply
python3 scripts/comments/backfill-avatars.py /isolated/data/artalk.db
```

只处理未删除、头像为空、恰好有一条未删除且已确认 GitHub 身份的用户。远程 UID 必须是首位非零的 ASCII 数字；多身份、无效或未确认身份跳过并按用户 ID 报告。使用 `https://avatars.githubusercontent.com/u/{UID}?v=4`，不依据昵称或邮箱推测。

应用时使用 `BEGIN IMMEDIATE` 事务，重新统计、条件更新并核对数量；任一失败会回滚。只改头像列，保持其他资料及时间戳不变。回填后重启候选/服务以清除原有进程缓存，重复执行应为零更新。报告不输出邮箱、OAuth Token 或私有配置。

## 验证记录（2026-10-31）

- 实时确认生产为 `v2.10.0/1bf2140`，镜像 digest 为 `sha256:ed51450f3ed744780efd0d796f1ea033063bb11543973439b9c57ed32ac9b78f`；原服务没有切换。
- 使用现有在线备份工具生成 `20261031-160018-artalk-production`，归档 SHA-256 为 `e8f0500a5cb15c4a19b44f58e787f722e7fe649c830064760ea24999dfd7edf3`。SQLite 一致性检查通过；备份在独立原版容器恢复并能读取评论。
- 未修改上游成功构建并上报原版版本。补丁后的实体、DAO、认证和 HTTP handler 四组 Go 测试通过。
- 隔离生产副本原有全部列逐条一致：556 条评论、155 个用户、145 条投票、34 个页面、4 条通知；只新增用户头像列。55 条留言页接口响应除头像字段外一致。
- 副本回填 1 个 GitHub 用户，重复执行 0 更新；重复启动响应一致。候选与旧镜像回退实例均通过发表、回复、详情读取；旧镜像可安全忽略新增列。
- `pnpm test:comment-avatar` 通过：4 项 JavaScript 测试、3 项 Python 测试，覆盖优先级、映射重试、单次回退、回填选择范围、幂等和事务失败。测试已接入 CI。
- 基于最新 `main` 的隔离工作树：`pnpm check` 为 0 错误、0 警告、0 提示；完整 `pnpm build`、静态产物审计、资源预算检查通过。
- 使用正式静态产物和隔离候选的 Edge 浏览器验收：主评论/侧栏五个合成样本（含后端与历史映射同时命中），正常、远程失败、本地图失败、映射失败四模式通过；无 Gravatar 请求、无未处理异常。1440/390px 明暗主题无溢出，连续换页两轮无重复编辑器/图标，滚动采样无长任务。

本地报告与截图在 `Temp/avatar-browser/`，检查与构建日志在 `Temp/avatar-main-*.log`。服务器隔离证据在 `/opt/artalk/rehearsal/avatar-20261031/verification.json`，测试数据不并入生产。

**验收边界：尚未完成新候选上的真实 GitHub 浏览器授权、授权后发表评论，以及真实邮件收件。** 认证函数测试、既有身份回填和合成浏览器图片不能替代这些验收。候选 SMTP/OAuth 默认禁用，不会发送生产通知。当前不能把此记录描述为生产上线完成。

### 发布产物核验（2026-11-01）

[PR #59](https://github.com/mcxiaochenn/Dusklight/pull/59) 保持草稿；实现提交为 `025f593fa879ed3e34e2b79910d208f4c6a57942`。[镜像 CI](https://github.com/mcxiaochenn/Dusklight/actions/runs/41217114575) 的单测、构建及 GHCR 发布全部成功。不可变镜像：

```text
ghcr.io/mcxiaochenn/dusklight-artalk@sha256:9891aee51da307f0a99322c5ef73e6942d493ca183f92fd65d20b6e00c8d48ec
```

服务器直连下载受网络影响，改为从公开 GHCR 下载 OCI 归档、逐 blob 校验 SHA-256 后传输导入；归档 SHA-256 为 `7ea5060eb55dfabcf912d3a68a204a8614007259db776109f4eab0b6f71a213e`。Docker 导入后的索引 digest 与上述值一致。发布镜像在另一个独立副本正常启动，上报 `v2.10.0-avatar.1/82a7aae`；评论列表与最新评论响应、Artalk 脚本、OAuth 插件、后台页面均与已测候选一致。未将本机重新构建的镜像冒充 CI 产物。

服务器还实际请求了接口给出的 QQ/GitHub 图片样本，均返回 JPEG（分别为 5,092 / 29,826 字节），哈希保存在私有验收报告中；这仅验证图片地址可用，不替代真实 OAuth 授权。验收结束后停止本次原版恢复、回退、候选及发布镜像测试容器，保留数据库副本与证据。原生产镜像、挂载和启动时间未变。

## 上线与回退

1. 先确认镜像 CI 成功、记录并拉取输出 digest。在独立可写生产副本上用该镜像复核，不复用生产数据挂载。
2. 为候选配置隔离且有效的 GitHub 回调，完成真实授权及评论，再实际验证通知链路。不得把模拟提供方响应视为真实授权。
3. 切换前重新核对生产镜像和数据路径，补做最新一致性备份、保存旧前端版本，短暂停写。
4. 部署新后端完成补列，停写期间回填并重启清缓存，核对数据及 API；然后发布博客前端、恢复写入并观察。
5. 若失败，优先恢复旧镜像与旧前端，保留新列和切换后的评论。不得直接覆盖旧备份造成新评论丢失。自动迁移失败时先检查真实数据库状态，不假定数据库未改变。

升级时从新的明确标签建立候选，尝试应用补丁并检查冲突；更新官方 UI 哈希、镜像基线和版本标识，重复单测、副本迁移、回填幂等、接口与浏览器验收。不在本次任务中升级 Artalk。补丁失效信号包括 `avatar_url` 消失、回调未持久化、列表与侧栏优先级不一致、重复回退或 Gravatar 请求恢复。不能及时兼容时优先保持评论可用，回退到旧镜像和已保存前端。
