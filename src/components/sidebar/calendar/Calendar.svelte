<script lang="ts">
	import { onMount } from "svelte";

	let dateCheckInterval: ReturnType<typeof setInterval> | null = null;

	function updateTodayDate() {
		const t = getSiteToday();
		todayYear = t.year;
		todayMonth = t.month;
		todayDate = t.date;
	}

	import CalendarGrid from "./components/CalendarGrid.svelte";
	import MonthPicker from "./components/MonthPicker.svelte";
	import YearPicker from "./components/YearPicker.svelte";
	import {
		formatDateKey,
		formatMonthKey,
		getCurrentPostId,
		getDaysInMonth,
		getFirstDayOfMonth,
		processPostsData,
	} from "./hooks/useCalendar";
	import type {
		CalendarGridCell,
		CalendarPost,
		CalendarStats,
	} from "./types/calendar";

	interface Props {
		monthNames: string[];
		weekDays: string[];
		yearSuffix: string;
	}

	const { monthNames, weekDays, yearSuffix }: Props = $props();

	// State
	let allPostsData: CalendarPost[] = $state([]);
	let postDateMap: Record<string, CalendarPost[]> = $state({});
	let postsByMonth: Record<string, CalendarPost[]> = $state({});
	let stats: CalendarStats = $state({
		hasPostInYear: {},
		hasPostInMonth: {},
		minYear: new Date().getFullYear(),
		maxYear: new Date().getFullYear() + 5,
	});

	let currentYear = $state(new Date().getFullYear());
	let currentMonth = $state(new Date().getMonth());
	let selectedDateKey: string | null = $state(null);
	let currentView: "day" | "month" | "year" = $state("day");

	// 站点时区（+08:00）的“今天”，与 SiteStats/Footer 统一口径 ——
	// 访客本地时区会让海外访客的“今天”高亮与 UTC 面值的文章日期错位
	function getSiteToday() {
		const t = new Date(Date.now() + 8 * 3600 * 1000);
		return { year: t.getUTCFullYear(), month: t.getUTCMonth(), date: t.getUTCDate() };
	}
	let todayYear = $state(getSiteToday().year);
	let todayMonth = $state(getSiteToday().month);
	let todayDate = $state(getSiteToday().date);

	const isBackToTodayVisible = $derived(
		currentYear !== todayYear ||
			currentMonth !== todayMonth ||
			selectedDateKey !== null,
	);

	const emptyCellsCount = $derived(getFirstDayOfMonth(currentYear, currentMonth));

	const cells = $derived(
		(() => {
			const daysInMonth = getDaysInMonth(currentYear, currentMonth);
			const result: CalendarGridCell[] = [];

			for (let day = 1; day <= daysInMonth; day++) {
				const dateKey = formatDateKey(currentYear, currentMonth, day);
				const posts = postDateMap[dateKey] || [];
				const isToday =
					currentYear === todayYear &&
					currentMonth === todayMonth &&
					day === todayDate;
				const isSelected = selectedDateKey === dateKey;

				result.push({
					day,
					dateKey,
					posts,
					hasPost: posts.length > 0,
					postCount: posts.length,
					isToday,
					isSelected,
					isEmpty: false,
				});
			}

			return result;
		})(),
	);

	// SSR 阶段无 window，getCurrentPostId 只在客户端调用
	const currentPostId = $derived(
		typeof window !== "undefined"
			? getCurrentPostId(window.location.pathname, allPostsData)
			: null,
	);

	const displayedPosts = $derived(
		(() => {
			if (selectedDateKey && postDateMap[selectedDateKey]) {
				return postDateMap[selectedDateKey];
			}
			const monthKey = formatMonthKey(currentYear, currentMonth);
			return postsByMonth[monthKey] || [];
		})(),
	);

	// Functions
	async function fetchCalendarData() {
		try {
			const res = await fetch("/api/calendar-data.json");
			const data = await res.json();
			if (Array.isArray(data)) {
				allPostsData = data;
				const processed = processPostsData(allPostsData);
				postDateMap = processed.postDateMap;
				postsByMonth = processed.postsByMonth;
				stats = processed.stats;

				const currentPostIdValue = getCurrentPostId(
					window.location.pathname,
					allPostsData,
				);
				if (currentPostIdValue) {
					const matchedPost = allPostsData.find(
						(p) => p.id === currentPostIdValue,
					);
					if (matchedPost) {
						const [y, m] = matchedPost.date.split("-");
						currentYear = Number.parseInt(y, 10);
						currentMonth = Number.parseInt(m, 10) - 1;
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch calendar data:", error);
		}
	}

	function handlePrevMonth() {
		currentMonth--;
		if (currentMonth < 0) {
			currentMonth = 11;
			currentYear--;
		}
		selectedDateKey = null;
	}

	function handleNextMonth() {
		currentMonth++;
		if (currentMonth > 11) {
			currentMonth = 0;
			currentYear++;
		}
		selectedDateKey = null;
	}

	function handleBackToToday() {
		currentYear = todayYear;
		currentMonth = todayMonth;
		selectedDateKey = null;
		if (currentView !== "day") {
			closeSelectionPanel();
		}
	}

	function handleTitleClick() {
		if (currentView === "day") {
			showMonthPicker();
		} else if (currentView === "month") {
			showYearPicker();
		} else {
			closeSelectionPanel();
		}
	}

	function handleCellClick(dateKey: string) {
		if (selectedDateKey === dateKey) {
			selectedDateKey = null;
		} else {
			selectedDateKey = dateKey;
		}
	}

	function handleMonthSelect(month: number) {
		currentMonth = month;
		selectedDateKey = null;
		closeSelectionPanel();
	}

	function handleYearSelect(year: number) {
		currentYear = year;
		selectedDateKey = null;
		showMonthPicker();
	}

	function showMonthPicker() {
		currentView = "month";
	}

	function showYearPicker() {
		currentView = "year";
	}

	function closeSelectionPanel() {
		currentView = "day";
	}

	onMount(() => {
		fetchCalendarData();

		// Check for date change every minute
		dateCheckInterval = setInterval(() => {
			const t = getSiteToday();
			if (t.year !== todayYear || t.month !== todayMonth || t.date !== todayDate) {
				updateTodayDate();
			}
		}, 60000);

		return () => {
			if (dateCheckInterval) {
				clearInterval(dateCheckInterval);
			}
		};
	});
</script>

<div class="cal-header">
	<div class="cal-title-wrap">
		<button
			type="button"
			class="cal-title-btn"
			onclick={handleTitleClick}
			aria-label="选择月份或年份"
		>
			<span class="cal-title-text"
				>{currentYear}{yearSuffix} {monthNames[currentMonth]}</span
			>
		</button>
	</div>

	<div class="cal-actions">
		{#if isBackToTodayVisible}
			<button
				type="button"
				class="cal-icon-btn cal-icon-btn--today"
				onclick={handleBackToToday}
				aria-label="回到今天"
			>
				<svg class="cal-ic cal-ic--md" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M136 80v43.47l36.12 21.67a8 8 0 0 1-8.24 13.72l-40-24A8 8 0 0 1 120 128V80a8 8 0 0 1 16 0m-8-48a95.44 95.44 0 0 0-67.92 28.15C52.81 67.51 46.35 74.59 40 82V64a8 8 0 0 0-16 0v40a8 8 0 0 0 8 8h40a8 8 0 0 0 0-16H49c7.15-8.42 14.27-16.35 22.39-24.57a80 80 0 1 1 1.66 114.75a8 8 0 1 0-11 11.64A96 96 0 1 0 128 32"/></svg>
			</button>
		{/if}
		<button
			type="button"
			class="cal-icon-btn {currentView === 'day' ? '' : 'cal-icon-btn--hidden'}"
			onclick={handlePrevMonth}
			aria-label="上个月"
		>
			<svg class="cal-ic cal-ic--sm" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z"/></svg>
		</button>
		<button
			type="button"
			class="cal-icon-btn {currentView === 'day' ? '' : 'cal-icon-btn--hidden'}"
			onclick={handleNextMonth}
			aria-label="下个月"
		>
			<svg class="cal-ic cal-ic--sm" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"/></svg>
		</button>
	</div>
</div>

<div class="cal-viewport">
	<div id="calendar-view" class="cal-view-main">
		<CalendarGrid
			{weekDays}
			{emptyCellsCount}
			{cells}
			onCellClick={handleCellClick}
		/>

		<div class="cal-post-list">
			<div
				class="cal-post-divider {displayedPosts.length === 0
					? 'cal-post-divider--hidden'
					: ''}"
			></div>
			<div class="cal-posts">
				{#if displayedPosts.length > 0}
					{#each displayedPosts as post (post.id)}
						{@const isCurrentPost = post.id === currentPostId}
						{@const [, m, d] = post.date.split("-")}
						{@const dateStr = `${parseInt(m)}-${parseInt(d)}`}
						<a
							href="/posts/{post.id}/"
							class="cal-post-link {isCurrentPost
								? 'cal-post-link--current'
								: ''}"
						>
							<span class="cal-post-title">{post.title}</span>
							<span class="cal-post-date">{dateStr}</span>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	{#if currentView === "month"}
		<div class="cal-overlay">
			<MonthPicker
				{monthNames}
				{currentYear}
				{currentMonth}
				{stats}
				onMonthSelect={handleMonthSelect}
			/>
		</div>
	{:else if currentView === "year"}
		<div class="cal-overlay">
			<YearPicker {currentYear} {stats} onYearSelect={handleYearSelect} />
		</div>
	{/if}
</div>

<style>
	.cal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: var(--space-2) 0;
	}
	.cal-title-wrap {
		font-weight: 700;
		transition: color var(--duration-fast) var(--ease-material);
		/* 固定 18px 对齐原版 Mizuki；--text-lg 是响应式大号（最大 ~31px），
		   --text-md 会随视口涨到 20px，侧栏内标题偏大 */
		font-size: 1.125rem;
		color: var(--foreground);
		position: relative;
		margin-left: var(--space-4);
		display: flex;
		align-items: center;
	}
	.cal-title-wrap::before {
		content: "";
		width: 4px;
		height: var(--space-4);
		border-radius: var(--radius-md);
		background: var(--accent);
		position: absolute;
		left: -16px;
	}
	.cal-title-btn {
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		padding: var(--space-2);
		margin-left: calc(-1 * var(--space-2));
		border-radius: var(--radius-lg);
		transition: background-color var(--duration-fast) var(--ease-material);
		border: none;
		background: none;
	}
	.cal-title-btn:hover {
		background: var(--surface-1);
	}
	.cal-title-text {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--foreground);
		user-select: none;
	}
	.cal-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-shrink: 0;
		margin-left: var(--space-2);
	}
	.cal-icon-btn {
		padding: 6px;
		border-radius: var(--radius-md);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--foreground-muted);
		transition: all var(--duration-fast) var(--ease-material);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cal-icon-btn:hover {
		background: var(--surface-1);
		color: var(--accent);
	}
	.cal-icon-btn--today {
		color: var(--accent);
	}
	.cal-icon-btn--hidden {
		visibility: hidden;
	}
	.cal-ic {
		display: block;
	}
	.cal-ic--md {
		width: 20px;
		height: 20px;
	}
	.cal-ic--sm {
		width: 18px;
		height: 18px;
	}
	.cal-viewport {
		position: relative;
		width: 100%;
		overflow: hidden;
		min-height: 15.625rem;
	}
	.cal-view-main {
		width: 100%;
	}
	.cal-post-list {
		margin-top: var(--space-4);
	}
	.cal-post-divider {
		height: 1px;
		width: 100%;
		background: var(--border-subtle);
		margin-bottom: var(--space-2);
	}
	.cal-post-divider--hidden {
		display: none;
	}
	.cal-posts {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		max-height: 150px;
		overflow-y: auto;
	}
	.cal-posts::-webkit-scrollbar {
		width: 4px;
	}
	.cal-posts::-webkit-scrollbar-track {
		background: transparent;
	}
	.cal-posts::-webkit-scrollbar-thumb {
		background-color: color-mix(in oklch, var(--foreground-muted) 50%, transparent);
		border-radius: 2px;
	}
	.cal-posts::-webkit-scrollbar-thumb:hover {
		background-color: color-mix(in oklch, var(--foreground-muted) 80%, transparent);
	}
	.cal-post-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: var(--text-sm);
		transition: all var(--duration-fast) var(--ease-material);
		padding: var(--space-2);
		border-radius: var(--radius-lg);
		border: 1px solid transparent;
		color: var(--foreground-secondary);
		text-decoration: none;
	}
	.cal-post-link:hover {
		color: var(--accent);
		background: var(--surface-1);
	}
	.cal-post-link--current {
		background: color-mix(in oklch, var(--accent) 10%, transparent);
		color: var(--accent);
		border-color: color-mix(in oklch, var(--accent) 10%, transparent);
	}
	.cal-post-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		font-weight: 700;
	}
	.cal-post-date {
		font-size: var(--text-xs);
		margin-left: var(--space-2);
		white-space: nowrap;
		color: var(--foreground-muted);
		transition: color var(--duration-fast) var(--ease-material);
	}
	.cal-post-link--current .cal-post-date {
		color: color-mix(in oklch, var(--accent) 80%, transparent);
	}
	.cal-post-link:hover .cal-post-date {
		color: color-mix(in oklch, var(--accent) 70%, transparent);
	}
	.cal-overlay {
		position: absolute;
		inset: 0;
		/* 85% 半透明磨砂（参考 --code-bg 的可读性平衡）——
		   覆盖层里是月份/年份文本，需保证可读；低于此透明度
		   底下网格透出会干扰阅读 */
		background: color-mix(in oklch, var(--surface-1) 85%, transparent);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness));
		backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation)) brightness(var(--glass-brightness));
		box-shadow: var(--glass-highlight);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		z-index: 10;
		display: flex;
		flex-direction: column;
	}
</style>
