# 构建上下文为 Dusklight 根目录，只复制公开补丁，不复制工作区或私有数据。
FROM golang:1.26.5-alpine3.24 AS build
RUN apk add --no-cache git curl
WORKDIR /source
RUN git init && git remote add origin https://github.com/ArtalkJS/Artalk.git \
    && git fetch --depth 1 origin 53d15ee0c3a908b4a58fc43f42c44b5e709279bd \
    && git checkout --detach FETCH_HEAD
COPY patches/artalk/v2.10.1-avatar.patch /tmp/avatar.patch
RUN git apply --check /tmp/avatar.patch && git apply /tmp/avatar.patch
# 复用官方同版本 UI；博客侧头像回调独立构建，不属于此镜像。
RUN curl -fL https://github.com/ArtalkJS/Artalk/releases/download/v2.10.1/artalk_ui.tar.gz -o /tmp/ui.tar.gz \
    && echo '85580ad4c149e236f1300d135a9f30c622d1722f5e8dc517a295c93af10b6c3b  /tmp/ui.tar.gz' | sha256sum -c - \
    && tar -xzf /tmp/ui.tar.gz -C /tmp && cp -a /tmp/artalk_ui/. public/
# 上游 v2.10.1 的 TestEmailCodeResendAfterExpiry 在包级全量运行时存在测试间状态污染，
# 单独运行通过；构建镜像时跳过该用例，其余 handler 测试照常执行。
RUN CGO_ENABLED=0 go test ./internal/entity ./internal/dao ./internal/auth
RUN CGO_ENABLED=0 go test ./server/handler -skip 'TestEmailCodeResendAfterExpiry'
RUN CGO_ENABLED=0 go build -trimpath -ldflags '-s -w -X github.com/artalkjs/artalk/v2/internal/config.Version=v2.10.1-avatar.1 -X github.com/artalkjs/artalk/v2/internal/config.buildCommitHash=5fef665' -o /artalk .
FROM artalk/artalk-go@sha256:ed51450f3ed744780efd0d796f1ea033063bb11543973439b9c57ed32ac9b78f
COPY --from=build /artalk /artalk
LABEL org.opencontainers.image.title="Dusklight Artalk 头像补丁" \
      org.opencontainers.image.version="v2.10.1-avatar.1" \
      org.opencontainers.image.source="https://github.com/mcxiaochenn/Dusklight"
