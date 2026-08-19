/**
 * Pagefind 只在生产构建后写入 dist，因此必须保留运行时 URL 导入。
 * 将导入置于普通 TS 模块可避免 Svelte 编译重写注释位置，供 Vite 正确识别。
 */
export function loadPagefind(url: string): Promise<any> {
	return import(/* @vite-ignore */ url);
}
