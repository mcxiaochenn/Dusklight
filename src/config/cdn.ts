/**
 * CDN 配置
 * 所有第三方库已自托管至 public/vendor/，本文件仅保留结构供 index.ts 重导出。
 * 如需新增自托管资源，在 public/vendor/ 放文件后在此记录即可。
 */
export const cdnConfig = {
  resources: {} as Record<string, string>,
} as const;
