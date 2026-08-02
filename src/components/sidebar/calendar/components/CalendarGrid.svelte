<script lang="ts">
	import type { CalendarGridCell } from "../types/calendar";

	interface Props {
		weekDays: string[];
		emptyCellsCount: number;
		cells: CalendarGridCell[];
		onCellClick: (dateKey: string) => void;
	}

	const { weekDays, emptyCellsCount, cells, onCellClick }: Props = $props();

	function getCellClass(cell: CalendarGridCell): string {
		let cls = "cal-day";
		if (cell.isEmpty) return cls + " cal-day--empty";
		if (cell.isSelected) return cls + " cal-day--selected";
		if (cell.isToday) return cls + " cal-day--today";
		if (cell.hasPost) return cls + " cal-day--post";
		return cls;
	}

	function handleCellClick(cell: CalendarGridCell) {
		if (!cell.isEmpty && cell.dateKey) {
			onCellClick(cell.dateKey);
		}
	}
</script>

<div class="cal-weekdays">
	{#each weekDays as day}
		<div class="cal-weekday">{day}</div>
	{/each}
</div>
<div class="cal-grid">
	{#each { length: emptyCellsCount } as _}
		<div class="cal-day cal-day--empty"></div>
	{/each}

	{#each cells as cell (cell.dateKey)}
		{#if !cell.isEmpty}
			<button
				type="button"
				class={getCellClass(cell)}
				data-date={cell.dateKey}
				onclick={() => handleCellClick(cell)}
			>
				{cell.day}
				{#if cell.hasPost && !cell.isSelected}
					<span class="cal-day__dot"></span>
				{/if}
				{#if cell.hasPost && cell.postCount > 1}
					<span class="cal-day__count">{cell.postCount}</span>
				{/if}
			</button>
		{/if}
	{/each}
</div>

<style>
	.cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}
	.cal-weekday {
		text-align: center;
		font-size: var(--text-xs);
		color: var(--foreground-muted);
		font-weight: 500;
		padding: var(--space-1) 0;
	}
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--space-1);
	}
	.cal-day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		cursor: pointer;
		position: relative;
		transition: all var(--duration-fast) var(--ease-material);
		border: 1px solid transparent;
		font-size: var(--text-xs);
		font-variant-numeric: tabular-nums;
		color: var(--foreground-secondary);
	}
	.cal-day:hover {
		background: var(--surface-1);
	}
	.cal-day--empty {
		cursor: default;
	}
	.cal-day--selected {
		background: var(--accent);
		color: var(--surface-0);
		box-shadow: var(--shadow-md);
		font-weight: 700;
	}
	.cal-day--today {
		color: var(--accent);
		font-weight: 700;
		background: color-mix(in oklch, var(--accent) 10%, transparent);
		border-color: var(--accent);
	}
	.cal-day--post {
		font-weight: 700;
		color: var(--foreground);
	}
	.cal-day--post:hover {
		background: var(--surface-1);
	}
	.cal-day__dot {
		position: absolute;
		bottom: 4px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 4px;
		border-radius: var(--radius-full);
		background: var(--accent);
	}
	.cal-day__count {
		position: absolute;
		top: 1px;
		right: 1px;
		font-size: 9px;
		opacity: 0.7;
		transform: scale(0.75);
		color: var(--foreground-muted);
	}
</style>
