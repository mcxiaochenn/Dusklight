# MiSans 字体来源与说明

- 字体文件：`source/MiSans-VF.ttf`（MiSans VF，版本 4.003；SHA-256：`5DAF8D5447BFD423CFDEC94A0E07C53B205892223CCC6EA21B7B8A37248B44D9`）。
- 官方下载来源：[MiSans Global](https://hyperos.mi.com/font-download/MiSans_Global_ALL.zip)。
- 官方许可：[`LICENSE-MiSans.pdf`](./LICENSE-MiSans.pdf)。部署站点应在适当位置保留小米版权提示。

本项目仅依据 `src/` 与 `content/` 中实际出现的字符生成 WOFF2 子集，不修改字形、字重、字体名称或字体功能。`public/fonts/misans/` 与 `src/styles/fonts.generated.css` 都是派生产物，须使用 `pnpm fonts:build` 生成，不纳入版本控制。
