// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = Record<string, Device[]> & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	Xiaomi: [
		{
			name: "Xiaomi 17 Pro",
			image:
				"https://cdn.cnbj0.fds.api.mi-img.com/b2c-shopapi-pms/pms_1758612755.21834351.png",
			specs: "White / 16G + 512G",
			description: "第五代骁龙8至尊版，妙享背屏，徕卡光影大师影像。",
			link: "https://www.mi.com/prod/xiaomi-17-pro",
		},
		{
			name: "小米手环10 Pro",
			image:
				"https://cdn.cnbj0.fds.api.mi-img.com/b2c-shopapi-pms/pms_1779279736.36951196.jpg",
			specs: "Black",
			description: "AMOLED 大屏，专业运动健康监测，超长续航。",
			link: "https://www.mi.com/prod/xiaomi-smart-band-10-pro",
		},
	],
	Router: [
		{
			name: "NanoPi R5S",
			image: "/images/device/R5SC-01.webp",
			specs: "4G RAM / 32G eMMC",
			description: "高性能软路由，双2.5G网口，适合家庭网关和轻量级服务器。",
			link: "https://www.friendlyelec.com/index.php?route=product/product&product_id=287",
		},
	],
};
