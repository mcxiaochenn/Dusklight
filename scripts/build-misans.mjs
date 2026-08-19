import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fontSplit } from "cn-font-split";

const root = resolve(".");
const source = join(root, "fonts", "source", "MiSans-VF.ttf");
const outputDirectory = join(root, "public", "fonts", "misans");
const cssOutput = join(root, "src", "styles", "fonts.generated.css");
const textExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".svelte",
  ".md",
  ".mdx",
  ".json",
  ".yml",
  ".yaml",
]);
const charactersPerSubset = 512;

async function collectFiles(directory) {
  const files = [];

  try {
    await stat(directory);
  } catch {
    return files;
  }

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (textExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }

  return files;
}

async function collectCodepoints() {
  const files = [
    ...(await collectFiles(join(root, "src"))),
    ...(await collectFiles(join(root, "content"))),
  ];
  const codepoints = new Set();

  for (const file of files) {
    for (const character of await readFile(file, "utf8")) {
      codepoints.add(character.codePointAt(0));
    }
  }

  return [...codepoints].sort((left, right) => left - right);
}

const codepoints = await collectCodepoints();
const subsets = [];
for (let offset = 0; offset < codepoints.length; offset += charactersPerSubset) {
  subsets.push(codepoints.slice(offset, offset + charactersPerSubset));
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await fontSplit({
  input: source,
  outDir: outputDirectory,
  subsets,
  subsetRemainChars: false,
  autoSubset: false,
  languageAreas: false,
  css: {
    fontFamily: "MiSans Subset",
    fontWeight: "100 900",
    fontStyle: "normal",
    fontDisplay: "swap",
    localFamily: ["MiSans"],
    polyfill: [],
  },
  targetType: "woff2",
  testHtml: false,
  reporter: false,
  renameOutputFont: "misans-[index].[ext]",
  silent: true,
});

const css = await readFile(join(outputDirectory, "result.css"), "utf8");
await rm(join(outputDirectory, "result.css"), { force: true });
await rm(join(outputDirectory, "index.proto"), { force: true });

const publicCss = css.replaceAll('url("./', 'url("/fonts/misans/');
await writeFile(
  cssOutput,
  `/* 由 scripts/build-misans.mjs 生成，请勿手工修改。 */\n\n${publicCss}`,
  "utf8",
);

console.log(
  `MiSans: ${codepoints.length} 个字符，${subsets.length} 个分包已生成。`,
);
