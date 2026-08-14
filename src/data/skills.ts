// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string; // Iconify icon name
	category: "frontend" | "backend" | "database" | "tools" | "other";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[]; // Related project IDs
	certifications?: string[];
	color?: string; // Skill card theme color
}

export const skillsData: Skill[] = [
	{
		id: "python",
		name: "Python",
		description: "通用编程语言，适用于 Web 开发、数据分析、自动化脚本等。",
		icon: "simple-icons:python",
		category: "backend",
		level: "expert",
		experience: { years: 7, months: 0 },
		color: "#3776AB",
	},
	{
		id: "javascript",
		name: "JavaScript",
		description: "现代 JavaScript 开发，包括 ES6+ 语法、异步编程和模块化开发。",
		icon: "simple-icons:javascript",
		category: "frontend",
		level: "advanced",
		experience: { years: 3, months: 0 },
		color: "#F7DF1E",
	},
	{
		id: "typescript",
		name: "TypeScript",
		description: "JavaScript 的类型超集，提升代码质量和开发效率。",
		icon: "simple-icons:typescript",
		category: "frontend",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#3178C6",
	},
	{
		id: "vue",
		name: "Vue.js",
		description: "渐进式 JavaScript 框架，易于上手，适合快速开发。",
		icon: "simple-icons:vuedotjs",
		category: "frontend",
		level: "intermediate",
		experience: { years: 1, months: 6 },
		color: "#4FC08D",
	},
	{
		id: "react",
		name: "React",
		description: "用于构建用户界面的 JavaScript 库，包括 Hooks 和状态管理。",
		icon: "simple-icons:react",
		category: "frontend",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#61DAFB",
	},
	{
		id: "astro",
		name: "Astro",
		description: "现代静态站点生成器，支持多框架集成和优异的性能。",
		icon: "simple-icons:astro",
		category: "frontend",
		level: "intermediate",
		experience: { years: 1, months: 0 },
		color: "#FF5D01",
	},
	{
		id: "nodejs",
		name: "Node.js",
		description: "基于 Chrome V8 引擎的 JavaScript 运行时，用于服务端开发。",
		icon: "simple-icons:nodedotjs",
		category: "backend",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#339933",
	},
	{
		id: "java",
		name: "Java",
		description: "企业级应用开发的主流编程语言，跨平台、面向对象。",
		icon: "fa7-brands:java",
		category: "backend",
		level: "advanced",
		experience: { years: 3, months: 0 },
		color: "#ED8B00",
	},
	{
		id: "php",
		name: "PHP",
		description: "广泛使用的服务端脚本语言，特别适合 Web 开发。",
		icon: "simple-icons:php",
		category: "backend",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#777BB4",
	},
	{
		id: "vscode",
		name: "VS Code",
		description: "轻量且强大的代码编辑器，拥有丰富的插件生态。",
		icon: "simple-icons:visualstudiocode",
		category: "tools",
		level: "expert",
		experience: { years: 6, months: 0 },
		color: "#007ACC",
	},
	{
		id: "docker",
		name: "Docker",
		description: "容器化平台，简化应用部署和环境管理。",
		icon: "simple-icons:docker",
		category: "tools",
		level: "advanced",
		experience: { years: 4, months: 0 },
		color: "#2496ED",
	},
	{
		id: "nginx",
		name: "Nginx",
		description: "高性能 Web 服务器和反向代理服务器。",
		icon: "simple-icons:nginx",
		category: "tools",
		level: "advanced",
		experience: { years: 4, months: 0 },
		color: "#009639",
	},
	{
		id: "photoshop",
		name: "Photoshop",
		description: "专业图像编辑和设计软件。",
		icon: "simple-icons:adobephotoshop",
		category: "other",
		level: "advanced",
		experience: { years: 3, months: 0 },
		color: "#31A8FF",
	},
	{
		id: "lightroom",
		name: "Lightroom",
		description: "专业照片后期处理和管理工具。",
		icon: "simple-icons:adobelightroom",
		category: "other",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		color: "#31A8FF",
	},
	{
		id: "linux",
		name: "Linux",
		description: "开源操作系统，服务器部署和开发环境的首选。",
		icon: "fa7-brands:linux",
		category: "tools",
		level: "expert",
		experience: { years: 6, months: 0 },
		color: "#FCC624",
	},
];
