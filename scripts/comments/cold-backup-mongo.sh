#!/usr/bin/env bash
# 仅在获准正式切换、Twikoo 已停写且最终逻辑备份成功之后执行。
set -euo pipefail
umask 077
backup=$(realpath "${1:?需要最终备份目录}")
[[ "$backup" == /opt/backups/dusklight-comments/*-final ]] || exit 2
[[ -f "$backup/SHA256SUMS" && ! -e "$backup/mongo-cold.tar.gz" ]] || exit 2
[[ "$(docker inspect -f '{{.State.Running}}' twikoo)" == false ]] || { echo 'Twikoo 尚未停写' >&2; exit 1; }
[[ "$(docker inspect -f '{{.State.Running}}' twikoo-mongo)" == true ]] || { echo 'MongoDB 应在逻辑备份后保持运行' >&2; exit 1; }
(cd "$backup" && sha256sum -c SHA256SUMS >/dev/null)
docker inspect twikoo-mongo > "$backup/mongo-cold-inspect.private.json"
python3 - "$backup" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]); x=json.loads((p/'mongo-cold-inspect.private.json').read_text())[0]
paths=[m['Source'] for m in x['Mounts'] if m['Destination'] in ('/data/db','/data/configdb')]
assert len(paths)==2 and all(v.startswith(('/opt/1panel/docker/compose/twikoo/','/var/lib/docker/volumes/')) for v in paths), 'MongoDB 挂载与已审查布局不符'
(p/'mongo-mounts.private.txt').write_text(''.join(v.lstrip('/')+'\n' for v in paths))
PY
docker stop twikoo-mongo >/dev/null
trap 'docker start twikoo-mongo >/dev/null' EXIT
tar -C / -czf "$backup/mongo-cold.tar.gz" -T "$backup/mongo-mounts.private.txt"
tar -tzf "$backup/mongo-cold.tar.gz" >/dev/null
(cd "$backup" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS && sha256sum -c SHA256SUMS >/dev/null)
echo '全部 MongoDB 持久化挂载冷备完成；只恢复 MongoDB，Twikoo 保持停止。'
