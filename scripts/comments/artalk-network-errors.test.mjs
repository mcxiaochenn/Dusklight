import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { artalkNetworkErrors } from "../../src/plugins/artalk-network-errors.mjs";

test("固定 Artalk ESM 的列表失败仍报告事件，但不产生重复拒绝", () => {
  const url = import.meta.resolve("artalk");
  const original = readFileSync(new URL(url), "utf8");
  const transformed = artalkNetworkErrors().transform(original, fileURLToPath(url));
  assert.equal(original.split('throw i.onError&&i.onError(n),e.trigger("list-failed"').length, 2);
  assert.equal(transformed.includes('throw i.onError&&i.onError(n),e.trigger("list-failed"'), false);
  assert.equal(transformed.split('e.trigger("list-failed",n)').length, original.split('e.trigger("list-failed",n)').length);
  assert.ok(transformed.includes('e.getData().setLoading(!1)'));
});

test("升级后不匹配时拒绝静默应用，其他模块不修改", () => {
  const plugin = artalkNetworkErrors();
  assert.throws(() => plugin.transform("upstream changed", "/node_modules/artalk/dist/Artalk.mjs"), /不匹配/);
  assert.equal(plugin.transform("unrelated", "/src/app.ts"), undefined);
});
