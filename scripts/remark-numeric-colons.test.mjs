import test from "node:test";
import assert from "node:assert/strict";
import { escapeNumericColons, remarkEscapeNumericColons } from "../src/plugins/remark-escape-numeric-colons.mjs";

test("数字比例和图片替代文本转义，代码与正常指令保持不变", () => {
  const source = "比例 3:4\n![图 16:9](image.png)\n`3:4`\n```text\n16:9\n```\n:::note\n正文\n:::";
  assert.equal(escapeNumericColons(source), source.replace("比例 3:4", "比例 3\\:4").replace("图 16:9", "图 16\\:9"));
});

test("unified 通过动态 this 安装包装解析器，并保留原解析返回值", () => {
  const result = { type: "root", children: [] };
  let received;
  const processor = { parser(source) { received = source; return result; } };
  remarkEscapeNumericColons.call(processor);
  assert.equal(processor.parser("3:4 :note[提示]"), result);
  assert.equal(received, "3\\:4 :note[提示]");
});
