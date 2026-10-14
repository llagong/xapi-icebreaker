<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { HAMMERS } from '../lib/game/config';
	import { calculateBreakScore, formatDuration, resolveHit } from '../lib/game/game';
	import { loadSoundPreference, saveSoundPreference } from '../lib/game/preferences';
	import {
		loadProgress,
		PROGRESS_VERSION,
		purchaseNextHammer,
		saveProgress
	} from '../lib/game/progression';
	import type { HammerLevel } from '../lib/game/types';
	import { emitXapiEvent } from '../lib/xapi/client';
	import type { XapiEventPayload, XapiGameEvent } from '../lib/xapi/events';
	import { getOrCreateSessionRegistration } from '../lib/xapi/session';

	let points = $state(0);
	let hammerLevel = $state<HammerLevel>(0);
	let hits = $state(0);
	let firstHitAt = $state<number | null>(null);
	let isBreaking = $state(false);
	let isHitAnimating = $state(false);
	let isIceEntering = $state(true);
	let isUpgrading = $state(false);
	let soundEnabled = $state(true);
	let prefersReducedMotion = $state(false);
	let upgradeNotice = $state<string | null>(null);
	let registrationId = $state<string | null>(null);
	let iceId = $state<string | null>(null);
	let iceButton = $state<HTMLButtonElement>();
	let breakFeedback = $state<{ points: number; duration: string; label: string } | null>(null);
	let breakTimer: ReturnType<typeof setTimeout> | undefined;
	let hitTimer: ReturnType<typeof setTimeout> | undefined;
	let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
	let upgradeTimer: ReturnType<typeof setTimeout> | undefined;
	let entranceTimer: ReturnType<typeof setTimeout> | undefined;
	let audioContext: AudioContext | undefined;
	let motionQuery: MediaQueryList | undefined;
	const hammerVisuals = [
		{ head: '#bf7b45', edge: '#8b5735', handle: '#7a4a2d', glow: '#f5b968' },
		{ head: '#9aa8b6', edge: '#687784', handle: '#79533b', glow: '#b9c6d4' },
		{ head: '#687985', edge: '#394852', handle: '#804d32', glow: '#f18762' },
		{ head: '#60d9e6', edge: '#168f9b', handle: '#315b75', glow: '#56d6e9' },
		{ head: '#ffd166', edge: '#e76f51', handle: '#6b4a7d', glow: '#ffd166' }
	] as const;
	const particlePositions = [
		'top-[8%] left-[18%]',
		'top-[2%] left-[48%]',
		'top-[14%] right-[14%]',
		'top-[44%] right-[2%]',
		'right-[16%] bottom-[8%]',
		'bottom-[2%] left-[45%]',
		'bottom-[12%] left-[12%]',
		'top-[42%] left-[1%]'
	] as const;
	const currentHammer = $derived(HAMMERS[hammerLevel]);
	const currentHammerVisual = $derived(hammerVisuals[hammerLevel]);
	const nextHammer = $derived(HAMMERS.find((hammer) => hammer.level === hammerLevel + 1) ?? null);
	const upgradeCost = $derived(currentHammer.upgradeCost ?? 0);
	const isMaximumLevel = $derived(nextHammer === null);
	const isUpgradeReady = $derived(!isMaximumLevel && points >= upgradeCost);
	const upgradeProgressMaximum = $derived(isMaximumLevel ? 1 : upgradeCost);
	const upgradeProgress = $derived(isMaximumLevel ? 1 : Math.min(points, upgradeCost));
	const filledUpgradeSegments = $derived(
		isMaximumLevel ? 10 : Math.min(10, Math.floor((upgradeProgress / upgradeProgressMaximum) * 10))
	);
	const upgradeSegments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

	function focusIce(): void {
		void tick().then(() => iceButton?.focus({ preventScroll: true }));
	}

	function persistProgress(): void {
		saveProgress(window.localStorage, {
			version: PROGRESS_VERSION,
			points,
			hammerLevel
		});
	}

	function trackEvent(event: XapiEventPayload): void {
		if (!registrationId) return;
		void emitXapiEvent({
			...event,
			registration: registrationId,
			timestamp: new Date().toISOString()
		} as XapiGameEvent);
	}

	function spawnNextIce(): void {
		iceId = crypto.randomUUID();
		hits = 0;
		firstHitAt = null;
		isBreaking = false;
		isIceEntering = !prefersReducedMotion;
		if (entranceTimer) clearTimeout(entranceTimer);
		entranceTimer = setTimeout(() => {
			isIceEntering = false;
		}, 30);
		focusIce();
	}

	function getAudioContext(): AudioContext | null {
		if (!soundEnabled) return null;
		audioContext ??= new AudioContext();
		if (audioContext.state === 'suspended') void audioContext.resume();
		return audioContext;
	}

	function playImpactSound(): void {
		const context = getAudioContext();
		if (!context) return;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = hammerLevel >= 3 ? 'sawtooth' : 'triangle';
		oscillator.frequency.setValueAtTime(150 + hammerLevel * 45, context.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(55, context.currentTime + 0.09);
		gain.gain.setValueAtTime(0.0001, context.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.006);
		gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
		oscillator.connect(gain).connect(context.destination);
		oscillator.start();
		oscillator.stop(context.currentTime + 0.12);
	}

	function playShatterSound(): void {
		const context = getAudioContext();
		if (!context) return;
		const duration = 0.24;
		const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < samples.length; index += 1) {
			const fade = 1 - index / samples.length;
			samples[index] = (Math.random() * 2 - 1) * fade * fade;
		}
		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		source.buffer = buffer;
		filter.type = 'highpass';
		filter.frequency.value = 1_200;
		gain.gain.value = 0.16;
		source.connect(filter).connect(gain).connect(context.destination);
		source.start();
	}

	function toggleSound(): void {
		soundEnabled = !soundEnabled;
		saveSoundPreference(window.localStorage, soundEnabled);
	}

	function hitIce(): void {
		const result = resolveHit(hits, currentHammer.requiredHits, isBreaking);
		if (!result.accepted) return;

		const now = performance.now();
		if (firstHitAt === null) firstHitAt = now;
		hits = result.hits;
		isHitAnimating = true;
		playImpactSound();
		const activeIceId = iceId ?? crypto.randomUUID();
		iceId = activeIceId;
		trackEvent({
			type: 'ice-tapped',
			iceId: activeIceId,
			hammerName: currentHammer.name,
			hitNumber: result.hits
		});

		if (hitTimer) clearTimeout(hitTimer);
		hitTimer = setTimeout(() => {
			isHitAnimating = false;
		}, 110);

		if (!result.didBreak) return;

		isBreaking = true;
		playShatterSound();
		const durationMs = Math.max(0, now - (firstHitAt ?? now));
		const score = calculateBreakScore(durationMs);
		points += score.points;
		persistProgress();
		trackEvent({
			type: 'ice-broken',
			iceId: activeIceId,
			hammerName: currentHammer.name,
			points: score.points,
			durationMs,
			hitCount: result.hits
		});
		breakFeedback = {
			points: score.points,
			duration: formatDuration(durationMs),
			label: score.label
		};

		if (breakTimer) clearTimeout(breakTimer);
		breakTimer = setTimeout(spawnNextIce, 420);

		if (feedbackTimer) clearTimeout(feedbackTimer);
		feedbackTimer = setTimeout(() => {
			breakFeedback = null;
		}, 1_650);
	}

	function upgradeHammer(): void {
		if (isUpgrading) return;

		const result = purchaseNextHammer({
			version: PROGRESS_VERSION,
			points,
			hammerLevel
		});
		if (result.status !== 'purchased') return;

		const previousHammer = currentHammer.name;
		const newHammer = HAMMERS[result.newLevel].name;
		isUpgrading = true;
		points = result.progress.points;
		hammerLevel = result.progress.hammerLevel;
		persistProgress();
		trackEvent({
			type: 'hammer-upgraded',
			previousHammer,
			newHammer,
			cost: result.cost ?? 0,
			remainingPoints: result.progress.points
		});
		upgradeNotice = `${newHammer} unlocked`;
		hits = 0;
		firstHitAt = null;
		isBreaking = false;

		if (upgradeTimer) clearTimeout(upgradeTimer);
		upgradeTimer = setTimeout(() => {
			isUpgrading = false;
			upgradeNotice = null;
			focusIce();
		}, 700);
	}

	function resetProgress(): void {
		const confirmed = window.confirm('Reset all points and hammer upgrades?');
		if (!confirmed) return;

		points = 0;
		hammerLevel = 0;
		hits = 0;
		firstHitAt = null;
		isBreaking = false;
		breakFeedback = null;
		persistProgress();
		upgradeNotice = 'Progress reset';

		if (upgradeTimer) clearTimeout(upgradeTimer);
		upgradeTimer = setTimeout(() => {
			upgradeNotice = null;
			focusIce();
		}, 700);
	}

	onMount(() => {
		const savedProgress = loadProgress(window.localStorage);
		points = savedProgress.points;
		hammerLevel = savedProgress.hammerLevel;
		soundEnabled = loadSoundPreference(window.localStorage);
		motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = motionQuery.matches;
		const updateMotionPreference = (event: MediaQueryListEvent) => {
			prefersReducedMotion = event.matches;
		};
		motionQuery.addEventListener('change', updateMotionPreference);
		registrationId = getOrCreateSessionRegistration(window.sessionStorage, () =>
			crypto.randomUUID()
		);
		iceId = crypto.randomUUID();
		entranceTimer = setTimeout(() => {
			isIceEntering = false;
		}, 30);
		trackEvent({ type: 'game-started', hammerName: currentHammer.name });
		focusIce();

		return () => motionQuery?.removeEventListener('change', updateMotionPreference);
	});

	onDestroy(() => {
		if (breakTimer) clearTimeout(breakTimer);
		if (hitTimer) clearTimeout(hitTimer);
		if (feedbackTimer) clearTimeout(feedbackTimer);
		if (upgradeTimer) clearTimeout(upgradeTimer);
		if (entranceTimer) clearTimeout(entranceTimer);
		if (audioContext) void audioContext.close();
	});
</script>

<svelte:head>
	<title>Ice Breaker</title>
	<meta name="description" content="Tap the ice, break it fast, and upgrade your hammer." />
</svelte:head>

<main
	class="relative flex h-svh min-w-80 touch-none flex-col overflow-hidden overscroll-none bg-[#e8faf5] font-sans text-[#17443f] [color-scheme:light] select-none"
>
	<div
		class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#c9f1eb_0%,#e8faf5_66%,#ffefbd_66%,#ffe49a_100%)]"
	></div>
	<div
		class="pointer-events-none absolute top-24 right-[8%] size-24 rounded-full bg-[#ffd45e] opacity-90 shadow-[0_0_0_16px_rgba(255,212,94,0.18)] max-sm:top-28 max-sm:right-[-28px] max-sm:size-20"
	></div>
	<div
		class="pointer-events-none absolute right-[-7rem] bottom-[-9rem] size-72 rounded-full bg-[#ff8f70]/25 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute bottom-[-8rem] left-[-8rem] size-80 rounded-full bg-[#26b9ae]/20 blur-3xl"
	></div>

	<header class="relative z-10 flex h-32 items-center px-[clamp(20px,5vw,72px)] max-sm:h-28">
		<a
			class="inline-flex items-center gap-2.5 rounded-full font-black tracking-[-0.03em] text-[#17443f] no-underline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#ef795c]"
			href="/"
			aria-label="Ice Breaker home"
		>
			<span
				class="grid size-9 place-items-center rounded-xl bg-white/80 shadow-sm"
				aria-hidden="true"
			>
				<svg class="size-6 fill-[#6edbd3] stroke-[#168f88] stroke-[1.5]" viewBox="0 0 40 40">
					<path d="M20 3 34.7 11.5v17L20 37 5.3 28.5v-17L20 3Z" />
					<path
						class="fill-white/80 stroke-none"
						d="m21.5 8-5 11 6 1.2-4.2 11.8 8-14-6.1-1.1L21.5 8Z"
					/>
				</svg>
			</span>
			<span class="text-lg max-sm:hidden">Ice Breaker</span>
		</a>

		<div
			class="absolute top-3 left-1/2 min-w-48 -translate-x-1/2 rounded-2xl border-2 border-[#f3c34f] bg-[linear-gradient(145deg,#fffdf4,#fff4bd)] px-8 py-2.5 text-center shadow-[0_12px_30px_rgba(205,145,39,0.28),inset_0_1px_0_white] max-sm:min-w-40 max-sm:px-5 max-sm:py-2"
			aria-label={`${points} points`}
		>
			<span
				class="flex items-center justify-center gap-1.5 text-[0.6rem] font-black tracking-[0.16em] text-[#9a6a17]"
			>
				<svg class="size-3.5 fill-[#f2ad2f]" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="m12 2 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 8.6l6.2-.9L12 2Z"
					/>
				</svg>
				TOTAL POINTS
			</span>
			<span class="mt-0.5 flex items-baseline justify-center gap-1">
				<strong
					class="block text-5xl leading-none font-black tracking-[-0.06em] text-[#e76f51] tabular-nums max-sm:text-4xl"
				>
					{points.toLocaleString()}
				</strong>
				<small class="text-[0.55rem] font-black tracking-wider text-[#b07825]">PTS</small>
			</span>
		</div>

		<button
			class="ml-auto grid size-11 place-items-center rounded-full bg-white/80 text-[#397c75] shadow-sm ring-1 ring-[#168f88]/10 backdrop-blur transition hover:-translate-y-0.5 hover:text-[#168f88] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#ef795c] motion-reduce:transform-none motion-reduce:transition-none"
			type="button"
			onclick={toggleSound}
			aria-label={soundEnabled ? 'Mute game sounds' : 'Enable game sounds'}
			aria-pressed={!soundEnabled}
		>
			{#if soundEnabled}
				<svg
					class="size-5 fill-none stroke-current stroke-2"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M4 9v6h4l5 4V5L8 9H4Z" />
					<path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />
				</svg>
			{:else}
				<svg
					class="size-5 fill-none stroke-current stroke-2"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M4 9v6h4l5 4V5L8 9H4Z" />
					<path d="m17 9 5 5m0-5-5 5" />
				</svg>
			{/if}
		</button>
	</header>

	<section class="relative z-2 flex flex-1 pb-32 text-center max-sm:pb-44">
		<div
			class="absolute top-[52%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center max-sm:top-1/2"
		>
			<div
				class={breakFeedback
					? 'mb-4 animate-bounce rounded-2xl bg-[#fff8d7]/95 px-5 py-2 text-[#9a5a17] shadow-[0_8px_24px_rgba(205,145,39,0.18)] backdrop-blur-sm motion-reduce:animate-none'
					: 'mb-4 rounded-2xl bg-white/70 px-4 py-2 text-[#397c75] shadow-sm backdrop-blur-sm'}
				aria-live="polite"
			>
				{#if breakFeedback}
					<strong class="block text-lg font-black text-[#e76f51]"
						>+{breakFeedback.points} points</strong
					>
					<span class="mt-0.5 block text-xs font-semibold"
						>{breakFeedback.label} break · {breakFeedback.duration}</span
					>
				{:else}
					<strong class="block text-sm">Tap the ice to break it</strong>
					<span class="mt-0.5 block text-xs text-[#5c8883]">Break it fast to earn more points.</span
					>
				{/if}
			</div>

			<button
				bind:this={iceButton}
				class="group relative grid size-[clamp(210px,28vw,310px)] touch-none place-items-center border-0 bg-transparent focus-visible:rounded-[30%] focus-visible:outline-3 focus-visible:outline-offset-6 focus-visible:outline-[#ef795c] max-sm:size-[210px]"
				type="button"
				disabled={isBreaking}
				onclick={hitIce}
				aria-label={`Break the ice with ${currentHammer.name}`}
			>
				<span
					class={`absolute bottom-5 h-12 w-3/4 rounded-[50%] bg-[#168f88]/20 blur-xl transition duration-300 ${isBreaking ? 'scale-50 opacity-0' : 'opacity-100'}`}
				></span>
				<span
					class={`relative block h-[86%] w-[78%] bg-[linear-gradient(135deg,#efffff_4%,#a5eee8_35%,#54d2cb_70%,#159c96_100%)] shadow-[inset_-22px_-24px_35px_rgba(11,124,119,0.22),0_20px_38px_rgba(23,143,136,0.2)] transition duration-300 [clip-path:polygon(18%_2%,80%_0,98%_18%,95%_77%,74%_98%,21%_94%,2%_76%,5%_20%)] group-hover:-translate-y-1 group-hover:scale-[1.02] group-active:translate-y-1 group-active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none ${isIceEntering ? 'translate-y-10 scale-75 opacity-0' : ''} ${isHitAnimating ? (hits % 2 === 0 ? 'translate-x-2 scale-95 -rotate-1' : '-translate-x-2 scale-95 rotate-1') : ''} ${isBreaking ? 'scale-0 rotate-12 opacity-0' : 'opacity-100'}`}
				>
					<span
						class="absolute top-[12%] left-[17%] h-[42%] w-[18%] rotate-12 rounded-full bg-white/55 blur-sm"
					></span>
					<svg
						class="absolute inset-0 size-full fill-none stroke-white/85 stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
						viewBox="0 0 220 230"
						aria-hidden="true"
					>
						{#if hits >= 1}<path d="M112 28 99 93" />{/if}
						{#if hits >= 2}<path d="m99 93-37 23 40 16" />{/if}
						{#if hits >= 3}<path d="m102 132-17 67m17-67 45 32" />{/if}
						{#if hits >= 4}<path d="m99 93 40 18 24-32m-16 85 31-4" />{/if}
					</svg>
				</span>

				<span
					class={`pointer-events-none absolute top-[2%] right-[2%] z-10 block h-[58%] w-[42%] origin-[32%_82%] transition-transform duration-100 motion-reduce:transform-none motion-reduce:transition-none ${isBreaking ? 'translate-x-8 -translate-y-10 rotate-45 opacity-0' : isHitAnimating ? 'translate-x-[-18%] translate-y-[18%] rotate-[34deg]' : '-rotate-[28deg]'}`}
					aria-hidden="true"
				>
					<span
						class="absolute inset-2 rounded-full opacity-25 blur-xl"
						style={`background-color: ${currentHammerVisual.glow}`}
					></span>
					<svg class="relative size-full drop-shadow-lg" viewBox="0 0 120 150">
						<path d="M51 55h17l13 88H57L51 55Z" fill={currentHammerVisual.handle} />
						<path d="M19 20h72l20 20-19 31H18L5 45 19 20Z" fill={currentHammerVisual.head} />
						<path d="m91 20 20 20-19 31H77l13-29-17-22h18Z" fill={currentHammerVisual.edge} />
						<path
							d="M23 29h48"
							fill="none"
							stroke="white"
							stroke-opacity=".45"
							stroke-width="6"
							stroke-linecap="round"
						/>
					</svg>
				</span>

				{#if isBreaking && !prefersReducedMotion}
					{#each particlePositions as position, index (`${iceId}-${index}`)}
						<span
							class={`pointer-events-none absolute z-20 size-3 animate-ping rounded-sm bg-[#8ce9e2] shadow-[0_0_12px_rgba(255,255,255,0.9)] ${position}`}
							style={`animation-delay: ${index * 35}ms`}
							aria-hidden="true"
						></span>
					{/each}
				{/if}
			</button>
		</div>
		<section
			class="fixed right-4 bottom-4 left-4 z-20 mx-auto grid max-w-2xl grid-cols-[1fr_auto] items-center gap-5 rounded-2xl bg-white/92 p-3.5 text-left shadow-[0_16px_42px_rgba(28,118,108,0.2)] ring-1 ring-[#168f88]/10 backdrop-blur-md max-sm:bottom-3 max-sm:max-w-sm max-sm:grid-cols-1 max-sm:gap-3"
			aria-labelledby="hammer-heading"
		>
			<div class="flex min-w-0 items-center gap-3">
				<span
					class="grid size-12 shrink-0 place-items-center rounded-xl bg-white shadow-inner"
					aria-hidden="true"
				>
					<svg class="size-8 -rotate-12" viewBox="0 0 64 64">
						<path fill={currentHammerVisual.head} d="M10 9h34l10 10-10 13H10L3 20 10 9Z" />
						<path fill={currentHammerVisual.handle} d="m30 29 10 3-9 29-10-3 9-29Z" />
					</svg>
				</span>
				<div class="min-w-0">
					<span class="block text-[0.6rem] font-bold tracking-widest text-[#6a9691]">
						{upgradeNotice ?? 'YOUR HAMMER'}
					</span>
					<h1 id="hammer-heading" class="truncate text-base font-extrabold">
						{currentHammer.name}
					</h1>
					<button
						class="mt-0.5 text-[0.6rem] font-bold text-[#6a9691] underline decoration-[#6a9691]/35 underline-offset-2 transition hover:text-[#e76f51] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef795c]"
						type="button"
						onclick={resetProgress}
					>
						Reset progress
					</button>
				</div>
			</div>
			<button
				class={isMaximumLevel
					? 'group relative min-w-64 shrink-0 cursor-default overflow-hidden rounded-xl bg-[#d5f2df] px-4 pt-2.5 pb-4 text-left text-xs font-extrabold text-[#28785e] max-sm:w-full max-sm:min-w-0'
					: isUpgradeReady && !isUpgrading
						? 'group relative min-w-64 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#ff8d6b] px-4 pt-2.5 pb-4 text-left text-xs font-extrabold text-white transition hover:bg-[#f37f5e] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#168f88] max-sm:w-full max-sm:min-w-0'
						: 'group relative min-w-64 shrink-0 cursor-not-allowed overflow-hidden rounded-xl bg-[#edf1e8] px-4 pt-2.5 pb-4 text-left text-xs font-extrabold text-[#78938e] max-sm:w-full max-sm:min-w-0'}
				type="button"
				disabled={isMaximumLevel || !isUpgradeReady || isUpgrading}
				onclick={upgradeHammer}
			>
				<span class="relative z-1 flex items-center justify-between gap-4">
					{#if nextHammer}
						<span>Upgrade to {nextHammer.name}</span>
						<span class="whitespace-nowrap">{upgradeProgress} / {upgradeCost}</span>
					{:else}
						<span>Thunder Hammer fully upgraded</span>
						<span>MAX</span>
					{/if}
				</span>
				<span
					class="absolute right-2 bottom-2 left-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full"
					role="progressbar"
					aria-label={nextHammer
						? `Progress toward ${nextHammer.name}`
						: 'Maximum hammer level reached'}
					aria-valuemin="0"
					aria-valuemax={upgradeProgressMaximum}
					aria-valuenow={upgradeProgress}
				>
					{#each upgradeSegments as index (index)}
						<span
							class={index < filledUpgradeSegments
								? 'h-full flex-1 bg-[#168f88]'
								: 'h-full flex-1 bg-[#cbdad3]'}
						></span>
					{/each}
				</span>
			</button>
		</section>
	</section>
</main>
