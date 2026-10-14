<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { HourlyActivity } from '../../lib/xapi/stats';
	import type { PageData } from './$types';

	const chart = { width: 800, height: 280, left: 56, right: 24, top: 24, bottom: 48 };
	const plotWidth = chart.width - chart.left - chart.right;
	const plotHeight = chart.height - chart.top - chart.bottom;
	const gridSteps = [0, 1, 2, 3, 4] as const;

	let { data }: { data: PageData } = $props();
	let isRefreshing = $state(false);

	const maxActivity = $derived(
		Math.max(1, ...data.stats.activityPerHour.map((entry) => entry.count))
	);
	const chartPoints = $derived(calculatePoints(data.stats.activityPerHour, maxActivity));
	const polylinePoints = $derived(chartPoints.map((point) => `${point.x},${point.y}`).join(' '));
	const maxHammerPlayers = $derived(
		Math.max(1, ...data.stats.hammerProgress.map((progress) => progress.count))
	);
	const activityRangeLabel = $derived(formatActivityRange(data.stats.activityPerHour));

	function calculatePoints(entries: HourlyActivity[], maximum: number) {
		return entries.map((entry, index) => ({
			...entry,
			x:
				entries.length === 1
					? chart.left + plotWidth / 2
					: chart.left + (index / (entries.length - 1)) * plotWidth,
			y: chart.top + (1 - entry.count / maximum) * plotHeight
		}));
	}

	function showAxisLabel(index: number): boolean {
		const interval = Math.max(1, Math.ceil(chartPoints.length / 8));
		return index % interval === 0 || index === chartPoints.length - 1;
	}

	function formatHour(hour: string): string {
		const localDate = new Date(new Date(hour).getTime() + data.utcOffsetMinutes * 60 * 1_000);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			timeZone: 'UTC'
		}).format(localDate);
	}

	function formatActivityRange(entries: HourlyActivity[]): string {
		if (entries.length === 0) return 'Times shown in UTC';
		const offsetMs = data.utcOffsetMinutes * 60 * 1_000;
		const start = new Date(new Date(entries[0].hour).getTime() + offsetMs);
		const end = new Date(new Date(entries.at(-1)!.hour).getTime() + offsetMs);
		const formatDate = (date: Date) =>
			new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC'
			}).format(date);
		const startDate = formatDate(start);
		const endDate = formatDate(end);
		return startDate === endDate
			? `${startDate} · 00:00–23:00 local time`
			: `${startDate} 00:00 – ${endDate} 23:00 local time`;
	}

	async function refreshStats(): Promise<void> {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			await refreshAll();
		} finally {
			isRefreshing = false;
		}
	}

	onMount(() => {
		const localOffset = -new Date().getTimezoneOffset();
		if (localOffset === data.utcOffsetMinutes) return;

		const url = new URL(window.location.href);
		url.searchParams.set('utcOffset', String(localOffset));
		void goto(`${url.pathname}${url.search}`, { replaceState: true });
	});
</script>

<svelte:head>
	<title>xAPI Statistics — Ice Breaker</title>
	<meta
		name="description"
		content="Aggregated Ice Breaker activity from the configured xAPI Learning Record Store."
	/>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="min-h-svh bg-[#f5faf9] px-5 py-8 font-sans text-[#173f3b] [color-scheme:light] sm:px-8 lg:px-12"
>
	<div class="mx-auto max-w-6xl">
		<header class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="mb-2 text-xs font-bold tracking-[0.18em] text-[#168f88]">DEVELOPER VIEW</p>
				<h1 class="text-3xl font-black tracking-[-0.04em] sm:text-4xl">xAPI Statistics</h1>
				<p class="mt-2 text-sm text-[#71938f]">Aggregated activity from the remote LRS.</p>
			</div>
			<div class="flex items-center gap-3">
				<span
					class={data.mode === 'live'
						? 'inline-flex items-center gap-2 rounded-full bg-[#d5f2df] px-3 py-2 text-xs font-bold text-[#28785e]'
						: 'inline-flex items-center gap-2 rounded-full bg-[#fff1c2] px-3 py-2 text-xs font-bold text-[#8b6421]'}
				>
					<i
						class={data.mode === 'live'
							? 'size-2 rounded-full bg-[#2ca779]'
							: 'size-2 rounded-full bg-[#f2a93b]'}
					></i>
					{data.mode === 'live' ? 'LRS connected' : 'Demo mode'}
				</span>
				<button
					class="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#397c75] shadow-sm ring-1 ring-[#168f88]/10 transition hover:text-[#168f88] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168f88] disabled:cursor-not-allowed disabled:opacity-40"
					type="button"
					disabled={isRefreshing}
					onclick={() => void refreshStats()}
				>
					{isRefreshing ? 'Refreshing…' : 'Refresh'}
				</button>
			</div>
		</header>

		{#if data.error}
			<p class="mb-5 rounded-2xl bg-[#ffe6df] px-5 py-4 text-sm font-semibold text-[#9f4435]">
				{data.error}
			</p>
		{/if}

		<section class="grid gap-4 sm:grid-cols-3" aria-label="xAPI summary statistics">
			<article class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#168f88]/10">
				<p class="text-xs font-black tracking-[0.14em] text-[#71938f] uppercase">Players</p>
				<strong
					class="mt-3 block text-5xl font-black tracking-[-0.05em] text-[#168f88] tabular-nums"
					>{data.stats.players.toLocaleString()}</strong
				>
			</article>
			<article class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#168f88]/10">
				<p class="text-xs font-black tracking-[0.14em] text-[#71938f] uppercase">Ice broken</p>
				<strong
					class="mt-3 block text-5xl font-black tracking-[-0.05em] text-[#4c9fca] tabular-nums"
					>{data.stats.iceBroken.toLocaleString()}</strong
				>
			</article>
			<article class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#168f88]/10">
				<p class="text-xs font-black tracking-[0.14em] text-[#71938f] uppercase">Hammer upgrades</p>
				<strong
					class="mt-3 block text-5xl font-black tracking-[-0.05em] text-[#e76f51] tabular-nums"
					>{data.stats.hammerUpgrades.toLocaleString()}</strong
				>
			</article>
		</section>

		<section class="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#168f88]/10 sm:p-7">
			<div class="mb-6">
				<p class="text-xs font-black tracking-[0.14em] text-[#71938f] uppercase">Progression</p>
				<h2 class="mt-1 text-xl font-black tracking-[-0.02em]">Players by current hammer</h2>
				<p class="mt-1 text-sm text-[#71938f]">
					Each player appears under their latest observed hammer.
				</p>
			</div>

			<div class="space-y-4">
				{#each data.stats.hammerProgress as progress (progress.level)}
					<article class="rounded-2xl bg-[#f5faf9] p-4 sm:p-5">
						<div class="flex items-center justify-between gap-4">
							<div class="flex min-w-0 items-center gap-3">
								<span
									class="size-3 shrink-0 rounded-full"
									style={`background-color: ${progress.accent}`}
								></span>
								<div class="min-w-0">
									<h3 class="truncate font-extrabold">{progress.hammer}</h3>
									<p class="text-xs font-semibold text-[#71938f]">Level {progress.level}</p>
								</div>
							</div>
							<strong class="text-2xl font-black tabular-nums">
								{progress.count}
								<span class="text-xs font-bold text-[#71938f]"
									>{progress.count === 1 ? 'player' : 'players'}</span
								>
							</strong>
						</div>

						<div class="mt-3 h-2 overflow-hidden rounded-full bg-white">
							<div
								class="h-full rounded-full transition-[width]"
								style={`width: ${(progress.count / maxHammerPlayers) * 100}%; background-color: ${progress.accent}`}
							></div>
						</div>

						{#if progress.players.length > 0}
							<ul class="mt-3 flex flex-wrap gap-2" aria-label={`${progress.hammer} players`}>
								{#each progress.players as player (player)}
									<li
										class="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#397c75] shadow-sm"
									>
										{player}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="mt-3 text-xs font-semibold text-[#9ab3b0]">No players</p>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		<section class="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#168f88]/10 sm:p-7">
			<div class="mb-6 flex flex-wrap items-end justify-between gap-2">
				<div>
					<p class="text-xs font-black tracking-[0.14em] text-[#71938f] uppercase">Activity</p>
					<h2 class="mt-1 text-xl font-black tracking-[-0.02em]">Statements per hour</h2>
				</div>
				<span class="text-xs font-semibold text-[#71938f]">{activityRangeLabel}</span>
			</div>

			{#if chartPoints.length === 0}
				<div class="grid min-h-72 place-items-center rounded-2xl bg-[#f5faf9] text-center">
					<div>
						<p class="font-extrabold">No activity yet</p>
						<p class="mt-1 text-sm text-[#71938f]">Play the game to populate this graph.</p>
					</div>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<svg
						class="min-w-[700px]"
						viewBox={`0 0 ${chart.width} ${chart.height}`}
						role="img"
						aria-label="Line graph showing the number of xAPI statements per hour"
					>
						{#each gridSteps as step (step)}
							{@const y = chart.top + (step / (gridSteps.length - 1)) * plotHeight}
							{@const value = Math.round(maxActivity * (1 - step / (gridSteps.length - 1)))}
							<line
								x1={chart.left}
								x2={chart.width - chart.right}
								y1={y}
								y2={y}
								stroke="#dceeea"
								stroke-width="1"
							/>
							<text
								x={chart.left - 12}
								y={y + 4}
								text-anchor="end"
								class="fill-[#71938f] text-[11px] font-semibold">{value}</text
							>
						{/each}

						{#if chartPoints.length > 1}
							<polyline
								points={polylinePoints}
								fill="none"
								stroke="#168f88"
								stroke-width="4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						{/if}

						{#each chartPoints as point, index (point.hour)}
							<circle
								cx={point.x}
								cy={point.y}
								r="5"
								fill="#168f88"
								stroke="white"
								stroke-width="3"
							>
								<title>{formatHour(point.hour)}: {point.count} statements</title>
							</circle>
							<text
								x={point.x}
								y={point.y - 12}
								text-anchor="middle"
								class="fill-[#17443f] text-[11px] font-black">{point.count}</text
							>
							{#if showAxisLabel(index)}
								<text
									x={point.x}
									y={chart.height - 14}
									text-anchor="middle"
									class="fill-[#71938f] text-[10px] font-semibold">{formatHour(point.hour)}</text
								>
							{/if}
						{/each}
					</svg>
				</div>
			{/if}
		</section>
	</div>
</main>
