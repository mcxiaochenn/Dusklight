<script lang="ts">
	import { onMount } from "svelte";

	import type { CalendarStats } from "../types/calendar";

	interface Props {
		currentYear: number;
		stats: CalendarStats;
		onYearSelect: (year: number) => void;
	}

	const { currentYear, stats, onYearSelect }: Props = $props();

	let containerEl: HTMLDivElement;

	const years = $derived.by(() => {
		const result: number[] = [];
		for (let y = stats.minYear; y <= stats.maxYear; y++) {
			result.push(y);
		}
		return result;
	});

	function getYearClass(year: number): string {
		const isCurrent = year === currentYear;
		let baseClass = "cal-year";
		if (isCurrent) {
			baseClass += " cal-year--current";
		}
		return baseClass;
	}

	function scrollToCurrentYear() {
		setTimeout(() => {
			const el = containerEl?.querySelector(`[data-year="${currentYear}"]`);
			if (el) {
				el.scrollIntoView({ block: "center", behavior: "smooth" });
			}
		}, 50);
	}

	onMount(() => {
		scrollToCurrentYear();
	});
</script>

<div bind:this={containerEl} class="cal-years">
	{#each years as year (year)}
		{@const hasPost = stats.hasPostInYear[year]}
		<button
			type="button"
			class={getYearClass(year)}
			data-year={year}
			onclick={() => onYearSelect(year)}
		>
			<span class="cal-year__name">{year}</span>
			{#if hasPost}
				<span class="cal-year__dot"></span>
			{:else}
				<span class="cal-year__dot cal-year__dot--none"></span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.cal-years {
		width: 100%;
		height: 100%;
		padding: var(--space-2);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
		align-content: start;
		overflow-y: auto;
	}
	.cal-years::-webkit-scrollbar {
		width: 4px;
	}
	.cal-years::-webkit-scrollbar-track {
		background: transparent;
	}
	.cal-years::-webkit-scrollbar-thumb {
		background-color: color-mix(in oklch, var(--foreground-muted) 50%, transparent);
		border-radius: 2px;
	}
	.cal-years::-webkit-scrollbar-thumb:hover {
		background-color: color-mix(in oklch, var(--foreground-muted) 80%, transparent);
	}
	.cal-year {
		cursor: pointer;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) 0;
		transition: all var(--duration-fast) var(--ease-material);
		position: relative;
		border: 1px solid transparent;
		color: var(--foreground-secondary);
		background: none;
	}
	.cal-year:hover {
		background: var(--surface-1);
	}
	.cal-year--current {
		border-color: var(--accent);
		color: var(--accent);
		background: color-mix(in oklch, var(--accent) 5%, transparent);
	}
	.cal-year__name {
		font-size: var(--text-sm);
		font-weight: 700;
	}
	.cal-year__dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--accent);
		margin-top: var(--space-1);
	}
	.cal-year__dot--none {
		background: transparent;
	}
</style>
