#!/usr/bin/env bash
# 仅创建备份，不停止、重建或修改生产服务。冷备须在正式停写后单独执行。
set -euo pipefail
umask 077
phase=${1:-baseline}
[[ "$phase" == baseline || "$phase" == final ]] || exit 2
if [[ "$phase" == final && "$(docker inspect -f '{{.State.Running}}' twikoo)" != false ]]; then
  printf '最终备份要求 Twikoo 已停写；本脚本不会替你停止生产服务。\n' >&2
  exit 1
fi
stamp=$(TZ=Asia/Shanghai date +%Y%m%d-%H%M%S)-$phase
root=/opt/backups/dusklight-comments
backup=$root/$stamp
mkdir -p "$root"
chmod 700 "$root"
mkdir -m 700 "$backup"
docker ps --no-trunc --format '{{json .}}' > "$backup/containers-before.jsonl"
docker inspect twikoo twikoo-mongo > "$backup/twikoo-inspect.private.json"
docker image inspect "$(docker inspect -f '{{.Image}}' twikoo)" "$(docker inspect -f '{{.Image}}' twikoo-mongo)" > "$backup/images.private.json"
tar -C / -czf "$backup/configuration.private.tar.gz" \
  opt/1panel/docker/compose/twikoo/docker-compose.yml \
  opt/1panel/docker/compose/twikoo/data \
  opt/1panel/www/conf.d/twikoo.mcxiaochen.top.conf \
  opt/1panel/www/sites/twikoo.mcxiaochen.top/proxy \
  opt/1panel/www/sites/twikoo.mcxiaochen.top/ssl
compose=/opt/1panel/docker/compose/twikoo
if [[ -f "$compose/.env" ]]; then cp -p "$compose/.env" "$backup/compose.env.private"; fi
# 密码仅在容器内取值，不回显、不写入终端或命令行参数。
docker exec twikoo-mongo sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip' \
  > "$backup/mongo.archive.gz" 2> "$backup/mongodump.private.log"
for collection in comment config counter cap_kv; do
  COLLECTION="$collection" docker exec -e COLLECTION="$collection" twikoo-mongo mongosh --quiet --norc --eval '
    db.getSiblingDB("admin").auth(process.env.MONGO_INITDB_ROOT_USERNAME,process.env.MONGO_INITDB_ROOT_PASSWORD);
    print(EJSON.stringify(db.getSiblingDB("twikoo").getCollection(process.env.COLLECTION).find({}).sort({_id:1}).toArray(),{relaxed:true}));
  ' > "$backup/$collection.private.json"
done
docker image save "$(docker inspect -f '{{.Image}}' twikoo)" "$(docker inspect -f '{{.Image}}' twikoo-mongo)" | gzip -1 > "$backup/images.tar.gz"
python3 - "$backup" <<'PY'
import collections, json, pathlib, sys
p = pathlib.Path(sys.argv[1])
rows = json.loads((p/'comment.private.json').read_text())
ids = {str(c['_id']) for c in rows}
summary = {'phase':p.name, 'comments':len(rows), 'pages':dict(collections.Counter(c['url'] for c in rows)),
 'replies':sum(bool(c.get('rid') or c.get('pid')) for c in rows),
 'pending':sum(bool(c.get('isSpam')) for c in rows), 'pinned':sum(bool(c.get('top')) for c in rows),
 'orphan_rid':sum(bool(c.get('rid')) and str(c['rid']) not in ids for c in rows),
 'orphan_pid':sum(bool(c.get('pid')) and str(c['pid']) not in ids for c in rows)}
(p/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
state = '本批为停写后的最终逻辑备份；须同时检查 mongo-cold.tar.gz 及其挂载清单。' if p.name.endswith('-final') else '本批为运行期间的基线逻辑备份，不能代替停写后的最终逻辑备份和冷备。'
(p/'RESTORE.txt').write_text('先验证 SHA256SUMS，再用 images.tar.gz 恢复相同镜像。\n在隔离网络和全新数据目录启动 MongoDB，mongorestore --archive --gzip 恢复 mongo.archive.gz。\n核对评论、配置、计数、回复及 Twikoo 读取后才可切换。配置和凭据均在 private 文件中，禁止公开。\n'+state+'\n')
PY
(cd "$backup" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS && sha256sum -c SHA256SUMS > /dev/null)
printf 'BACKUP=%s\n' "$backup"
cat "$backup/summary.json"
