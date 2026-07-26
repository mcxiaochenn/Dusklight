// 赞助名单配置
// 按日期倒序排列，最新的在前

export interface Sponsor {
	name: string; // 昵称
	avatar?: string; // 头像 URL（可选，无则显示首字母）
	date: string; // 日期，格式 YYYY-MM-DD
	amount: string; // 金额/赞助方式（如 "10￥"、"5 B币"）
	link?: string; // 个人链接（可选）
}

export const sponsorsData: Sponsor[] = [
	{
		name: "雨云",
		avatar: "https://app.rainyun.com/favicon.ico",
		date: "2025-07-17",
		amount: "￥180.0",
	},
];

// 获取按日期倒序排列的赞助名单
export function getSortedSponsors(): Sponsor[] {
	return [...sponsorsData].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
}
