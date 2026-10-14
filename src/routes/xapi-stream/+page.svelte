<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatStatementSummary } from '../../lib/xapi/records';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expandedId = $state<string | null>(null);
	let isRefreshing = $state(false);
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	const records = $derived(data.records);
	const mode = $derived(data.mode);
	const loadError = $derived(data.error);

	async function refreshRecords(): Promise<void> {
		if (isRefreshing) return;
		isRefreshing = true;
		try {
			await refreshAll();
			if (expandedId && !records.some((record) => record.id === expandedId)) expandedId = null;
		} finally {
			isRefreshing = false;
		}
	}

	function formatTime(timestamp: string): string {
		return new Intl.DateTimeFormat(undefined, {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		}).format(new Date(timestamp));
	}

	onMount(() => {
		refreshTimer = setInterval(() => void refreshRecords(), 2_000);

		return () => {
			if (refreshTimer) clearInterval(refreshTimer);
		};
	});
</script>

<svelte:head>
	<title>xAPI Stream — Ice Breaker</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="min-h-svh bg-[#f5faf9] px-5 py-8 font-sans text-[#173f3b] [color-scheme:light] sm:px-8 lg:px-12"
>
	<div class="mx-auto max-w-6xl">
		<header class="mb-8 flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="mb-2 text-xs font-bold tracking-[0.18em] text-[#168f88]">DEVELOPER VIEW</p>
				<h1 class="text-3xl font-black tracking-[-0.04em] sm:text-4xl">xAPI Stream</h1>
			</div>
			<div class="flex items-center gap-3">
				<span
					class={mode === 'live'
						? 'inline-flex items-center gap-2 rounded-full bg-[#d5f2df] px-3 py-2 text-xs font-bold text-[#28785e]'
						: 'inline-flex items-center gap-2 rounded-full bg-[#fff1c2] px-3 py-2 text-xs font-bold text-[#8b6421]'}
				>
					<i
						class={mode === 'live'
							? 'size-2 rounded-full bg-[#2ca779]'
							: 'size-2 rounded-full bg-[#f2a93b]'}
					></i>
					{mode === 'live' ? 'LRS connected' : 'Demo mode'}
				</span>
				<button
					class="rounded-full px-3 py-2 text-xs font-bold text-[#71938f] transition hover:bg-white hover:text-[#d15f4b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168f88] disabled:cursor-not-allowed disabled:opacity-40"
					type="button"
					disabled={isRefreshing}
					onclick={() => void refreshRecords()}
				>
					{isRefreshing ? 'Refreshing…' : 'Refresh'}
				</button>
			</div>
		</header>

		<section class="grid gap-4 sm:grid-cols-2" aria-label="Stream status">
			<div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#168f88]/10">
				<span class="text-xs font-bold tracking-wide text-[#71938f]">STATEMENTS</span>
				<strong class="mt-2 block text-3xl tabular-nums">{records.length}</strong>
			</div>
			<div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#168f88]/10">
				<span class="text-xs font-bold tracking-wide text-[#71938f]">SOURCE</span>
				<strong class="mt-2 block text-lg text-[#71938f]">Remote LRS</strong>
			</div>
		</section>

		{#if loadError}
			<p class="mt-5 rounded-2xl bg-[#ffe6df] px-5 py-4 text-sm font-semibold text-[#9f4435]">
				{loadError}
			</p>
		{/if}

		<section
			class="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#168f88]/10"
			aria-labelledby="activity-heading"
		>
			<div class="flex items-center justify-between border-b border-[#dceeea] px-5 py-4">
				<h2 id="activity-heading" class="font-extrabold">Statement activity</h2>
				<span class="font-mono text-xs text-[#71938f]">actor · action · object</span>
			</div>

			{#if records.length === 0}
				<div class="grid min-h-80 place-items-center px-5 py-16 text-center">
					<div>
						<svg
							class="mx-auto mb-4 size-12 fill-none stroke-[#85b9b3] stroke-[1.5]"
							viewBox="0 0 48 48"
							aria-hidden="true"
						>
							<path d="M15 8h14l7 7v25H15V8Z" />
							<path d="M29 8v8h7M21 24h9M21 30h9" />
						</svg>
						<h3 class="font-extrabold">No statements yet</h3>
						<p class="mt-1 text-sm text-[#71938f]">
							Play the game in another tab to populate this stream.
						</p>
					</div>
				</div>
			{:else}
				<ul class="divide-y divide-[#dceeea]">
					{#each records as record (record.id)}
						<li>
							<button
								class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-left transition hover:bg-[#f5faf9] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#168f88]"
								type="button"
								onclick={() => (expandedId = expandedId === record.id ? null : record.id)}
								aria-expanded={expandedId === record.id}
							>
								<span class="size-2.5 rounded-full bg-[#2ca779]"></span>
								<span class="min-w-0">
									<strong class="block truncate text-sm">{formatStatementSummary(record)}</strong>
									<span class="mt-0.5 block truncate font-mono text-[0.68rem] text-[#71938f]">
										{record.statement.verb.id}
									</span>
								</span>
								<span class="text-right">
									<span
										class="block text-[0.65rem] font-black tracking-wide text-[#71938f] uppercase"
										>stored</span
									>
									<time class="mt-0.5 block text-xs text-[#71938f]" datetime={record.recordedAt}
										>{formatTime(record.recordedAt)}</time
									>
								</span>
							</button>

							{#if expandedId === record.id}
								<div class="border-t border-[#dceeea] bg-[#153d3a] p-4 sm:p-5">
									<pre class="overflow-x-auto text-xs leading-relaxed text-[#d9f4ee]"><code
											>{JSON.stringify(record.statement, null, 2)}</code
										></pre>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</main>
