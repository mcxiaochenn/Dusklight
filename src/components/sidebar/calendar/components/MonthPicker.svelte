<script lang="ts">
	import type { CalendarStats } from "../types/calendar";

	interface Props {
		monthNames: string[];
		currentYear: number;
		currentMonth: number;
		stats: CalendarStats;
		onMonthSelect: (month: number) => void;
	}

	const { monthNames, currentYear, currentMonth, stats, onMonthSelect }: Props =
		$props();

	function getMonthClass(index: number, _hasPost: boolean): string {
		const isCurrentMonth = index === currentMonth;
		let baseClass = "cal-month";
		if (isCurrentMonth) {
			baseClass += " cal-month--current";
		}
		return baseClass;
	}
</script>

<div class="cal-months">
	{#each monthNames as name, index}
		{@const hasPost = stats.hasPostInMonth[`${currentYear}-${index + 1}`]}
		<button
			type="button"
			class={getMonthClass(index, hasPost)}
			data-month={index}
			onclick={() => onMonthSelect(index)}
		>
			<span class="cal-month__name">{name}</span>
			{#if hasPost}
				<span class="cal-month__dot"></span>
			{:else}
				<span class="cal-month__dot cal-month__dot--none"></span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.cal-months {
		width: 100%;
		height: 100%;
		padding: var(--space-4);
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
		align-content: center;
	}
	.cal-month {
		cursor: pointer;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		transition: all var(--duration-fast) var(--ease-material);
		position: relative;
		border: 1px solid transparent;
		color: var(--foreground-secondary);
		background: none;
	}
	.cal-month:hover {
		background: var(--surface-1);
	}
	.cal-month--current {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in oklch, var(--accent) 5%, transparent);
	}
	.cal-month__name {
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.cal-month__dot {
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
		background: var(--accent);
		margin-top: var(--space-1);
	}
	.cal-month__dot--none {
		background: transparent;
	}
</style>
