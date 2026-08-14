#!/usr/bin/env python3
"""将 MiSans 可变字体生成为互不重叠的 WOFF2 子集。

依赖：python -m pip install fonttools brotli
用法：python scripts/subset-misans.py <MiSansVF.ttf>

核心子集包含基础拉丁、标点和 src/ 中实际使用的字符；其余字形按
Unicode 区间分组。各组在字形层面互斥，生成的 unicode-range 也互不重叠。
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "fonts" / "misans"
CSS_OUTPUT = ROOT / "src" / "styles" / "fonts.generated.css"
TEXT_SUFFIXES = {".astro", ".css", ".js", ".mjs", ".ts", ".svelte", ".md", ".mdx"}


def collect_source_characters() -> set[int]:
    characters: set[int] = set(range(0x0000, 0x3400))
    for path in (ROOT / "src").rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            characters.update(ord(char) for char in path.read_text(encoding="utf-8"))
        except UnicodeDecodeError:
            continue
    return characters


def compress_ranges(codepoints: set[int]) -> str:
    ordered = sorted(codepoints)
    if not ordered:
        return ""
    groups: list[tuple[int, int]] = []
    start = previous = ordered[0]
    for point in ordered[1:]:
        if point == previous + 1:
            previous = point
            continue
        groups.append((start, previous))
        start = previous = point
    groups.append((start, previous))
    return ", ".join(
        f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}"
        for start, end in groups
    )


def subset_font(source: Path, target: Path, unicodes: set[int]) -> None:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 16, 17]
    options.name_legacy = True
    options.name_languages = [0x409, 0x804]
    options.recalc_average_width = True
    options.recalc_max_context = True
    font = subset.load_font(str(source), options)
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=unicodes)
    worker.subset(font)
    subset.save_font(font, str(target), options)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: subset-misans.py <MiSansVF.ttf>")

    source = Path(sys.argv[1]).resolve()
    if not source.is_file():
        raise SystemExit(f"font not found: {source}")

    with TTFont(source, lazy=True) as font:
        supported = set(font.getBestCmap())

    core = supported & collect_source_characters()
    remaining = supported - core
    definitions = [
        ("core", core),
        ("cjk-a", {cp for cp in remaining if 0x3400 <= cp <= 0x4DBF}),
        ("cjk-1", {cp for cp in remaining if 0x4E00 <= cp <= 0x6FFF}),
        ("cjk-2", {cp for cp in remaining if 0x7000 <= cp <= 0x8FFF}),
        ("cjk-3", {cp for cp in remaining if 0x9000 <= cp <= 0x9FFF}),
        ("compat", {cp for cp in remaining if 0xF900 <= cp <= 0xFFFF}),
    ]
    assigned = set().union(*(points for _, points in definitions))
    definitions.append(("extra", remaining - assigned))

    OUTPUT.mkdir(parents=True, exist_ok=True)
    css = ["/* scripts/subset-misans.py 生成，请勿手工修改。 */", ""]
    for name, points in definitions:
        if not points:
            continue
        target = OUTPUT / f"misans-{name}.woff2"
        print(f"subsetting {name}: {len(points)} codepoints -> {target.name}")
        subset_font(source, target, points)
        css.extend(
            [
                "@font-face {",
                '  font-family: "MiSans Subset";',
                f'  src: url("/fonts/misans/{target.name}") format("woff2");',
                "  font-style: normal;",
                "  font-weight: 100 900;",
                "  font-display: swap;",
                f"  unicode-range: {compress_ranges(points)};",
                "}",
                "",
            ]
        )

    CSS_OUTPUT.write_text("\n".join(css), encoding="utf-8")


if __name__ == "__main__":
    main()
