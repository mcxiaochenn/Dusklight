/**
 * Artalk 2.10.0 的 list-fetch 事件回调在报告错误后重新抛出 Promise 拒绝，
 * 事件总线不消费返回值，导致断网时出现 unhandledrejection。
 * 只移除这次重复抛出，保留 list-failed、list-fetched 和 finally 的原生行为。
 * 固定版本的精确匹配是升级门槛：升级 Artalk 时必须重新确认上游是否已修复。
 */
export function artalkNetworkErrors() {
  const source = 'throw i.onError&&i.onError(n),e.trigger("list-failed",n),e.trigger("list-fetched",{params:i,error:n}),t';
  const handled = 'i.onError&&i.onError(n),e.trigger("list-failed",n),e.trigger("list-fetched",{params:i,error:n})';
  return {
    name: "dusklight-artalk-network-errors",
    enforce: /** @type {const} */ ("pre"),
    transform(code, id) {
      if (!id.replaceAll("\\", "/").split("?")[0].endsWith("/artalk/dist/Artalk.mjs")) return;
      if (code.split(source).length !== 2) {
        throw new Error("Artalk 列表异常修正与安装版本不匹配，请检查上游后再升级。");
      }
      return code.replace(source, handled);
    },
  };
}
