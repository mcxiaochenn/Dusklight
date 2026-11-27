import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const asModule = (source) => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText).toString("base64")}`;
const config = asModule((await readFile(new URL("../../src/config/comment.ts", import.meta.url), "utf8")).replaceAll("import.meta.env", "({})"));
const source = (await readFile(new URL("../../src/utils/comment-avatar.ts", import.meta.url), "utf8")).replace('"../config/comment"', JSON.stringify(config));
const avatars = await import(asModule(source));

test("任意远程头像失败只回退一次，本地图失败终止重试", () => {
  for (const src of ["https://avatars.githubusercontent.com/u/123", "https://thirdqq.qlogo.cn/avatar"]) {
    const image = { src, hidden: false, dataset: {}, ownerDocument: { baseURI: "https://blog.example.com/posts/" } };
    avatars.fallbackCommentAvatar(image);
    assert.equal(image.src, "/images/avatar-fallback.svg");
    assert.equal(image.hidden, false);
    avatars.fallbackCommentAvatar(image);
    assert.equal(image.hidden, true);
  }
  const image = { src: "https://blog.example.com/images/avatar-fallback.svg", hidden: false, dataset: {}, ownerDocument: { baseURI: "https://blog.example.com/posts/" } };
  avatars.fallbackCommentAvatar(image);
  assert.equal(image.hidden, true);
  assert.deepEqual(image.dataset, {});
});
