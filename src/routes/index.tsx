import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  type Category,
  type Nominee,
  seededShuffle,
  useCategories,
} from "@/lib/awards-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1st LASU Epe Gala Night — Live Results" },
      { name: "description", content: "Live cinematic reveal of the 1st LASU Epe Gala Night award results. Theme: Faculty Fusion Forge." },
      { property: "og:title", content: "1st LASU Epe Gala Night — Live Results" },
      { property: "og:description", content: "Faculty Fusion Forge · LASUSU LASU Epe Social Committee" },
    ],
  }),
  component: Index,
});

type Stage =
  | "welcome"
  | "category"
  | "nominees"
  | "reveal"
  | "winner"
  | "breakdown";

/* ============================================================
   Helpers
   ============================================================ */
function useCountUp(target: number, durationMs = 1600, start = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return val;
}

function fireConfetti() {
  const end = Date.now() + 2500;
  const colors = ["#ffd700", "#fff3b0", "#b8860b", "#ffffff"];
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
      scalar: 1.1,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
      scalar: 1.1,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  // burst
  confetti({
    particleCount: 180,
    spread: 110,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1.3,
  });
}

/* ============================================================
   Background — particles & lights
   ============================================================ */
function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 5,
        delay: -Math.random() * 18,
        duration: 14 + Math.random() * 14,
        opacity: 0.3 + Math.random() * 0.5,
        key: i,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.key}
          className="animate-float-up absolute rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, #fff3b0 0%, #ffd700 40%, transparent 70%)",
            boxShadow: "0 0 10px rgba(255,215,0,0.7)",
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function Spotlights() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/4 h-[80vh] w-[40vw] -rotate-12 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,215,0,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -top-40 right-1/4 h-[80vh] w-[40vw] rotate-12 blur-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,215,0,0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/* ============================================================
   Shared UI
   ============================================================ */
function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--gold-500)]" />
      <span className="text-gold text-xs tracking-[0.4em]">★</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--gold-500)]" />
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gold/80 text-[11px] font-semibold uppercase tracking-[0.5em]">
      {children}
    </p>
  );
}

/* ============================================================
   Screens
   ============================================================ */
function WelcomeScreen({
  onBegin,
  categories,
}: {
  onBegin: () => void;
  categories: Category[];
}) {
  const CATEGORIES = categories;
  return (
    <div className="stage-bg vignette relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <Particles />
      <Spotlights />

      <div className="animate-slide-up-fade relative z-10 flex flex-col items-center gap-6 sm:gap-8">
        {/* Crest / logo */}
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)" }} />
          <div className="animate-pulse-gold relative grid h-24 w-24 place-items-center rounded-full gold-border sm:h-32 sm:w-32">
            <div className="font-display text-gradient-gold text-3xl font-bold leading-none sm:text-5xl">
              🏆
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Kicker>Lagos State University Student Union (LASUSU)</Kicker>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 sm:text-[11px]">
            LASU Epe Social Committee
          </p>
        </div>

        <h1 className="font-display max-w-4xl text-4xl font-medium leading-[1.05] text-white sm:text-7xl md:text-8xl">
          1st LASU Epe <br />
          <span className="shimmer-text italic">Gala Night</span>
        </h1>

        <p className="max-w-xl text-sm italic text-gold/90 sm:text-lg">
          Theme: Faculty Fusion Forge
        </p>

        <p className="max-w-xl text-sm text-white/60 sm:text-lg">
          A live cinematic reveal of the award show results — one night, one
          venue, the entire LASU elite.
        </p>

        <GoldDivider className="my-2" />

        <button
          onClick={onBegin}
          className="btn-gold group relative overflow-hidden rounded-full px-8 py-4 text-xs uppercase tracking-[0.3em] sm:px-12 sm:text-sm"
        >
          <span className="relative z-10">Tap to Begin Ceremony</span>
        </button>

        <p className="text-[10px] uppercase tracking-[0.35em] text-white/30 sm:text-xs sm:tracking-[0.4em]">
          {CATEGORIES.length} Categories · {CATEGORIES.reduce((s, c) => s + c.totalVotes, 0).toLocaleString()} Votes Cast
        </p>
        <Link
          to="/admin"
          className="mt-2 text-[10px] uppercase tracking-[0.4em] text-white/25 hover:text-gold"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

function CategoryIntro({
  category,
  index,
  total,
  onNext,
}: {
  category: Category;
  index: number;
  total: number;
  onNext: () => void;
}) {
  const votes = useCountUp(category.totalVotes, 1400);
  return (
    <div className="stage-bg vignette relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <Particles />

      {/* sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="spotlight-sweep absolute inset-0" />
      </div>

      <div className="animate-slide-up-fade relative z-10 flex w-full flex-col items-center gap-5 sm:gap-6">
        <Kicker>Category {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}</Kicker>

        <div className="animate-scale-in-bounce text-6xl drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] sm:text-8xl">
          {category.icon}
        </div>

        <h2 className="font-display max-w-full break-words px-2 text-3xl font-medium leading-tight text-white sm:max-w-4xl sm:text-7xl">
          <span className="text-gradient-gold">{category.title}</span>
        </h2>

        <p className="max-w-xl px-2 text-sm italic text-white/60 sm:text-lg">
          "{category.subtitle}"
        </p>

        <GoldDivider className="my-2" />

        <div className="flex flex-wrap items-baseline justify-center gap-2 sm:gap-3">
          <span className="font-display text-4xl font-semibold text-gold tabular-nums sm:text-7xl">
            {votes.toLocaleString()}
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-xs sm:tracking-[0.4em]">
            Total Votes Cast
          </span>
        </div>

        <button
          onClick={onNext}
          className="btn-gold mt-4 rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em] sm:px-10"
        >
          Meet the Nominees →
        </button>
      </div>
    </div>
  );
}

function NomineeCard({
  nominee,
  rank,
  state,
  showVotes,
  totalVotes,
  delay = 0,
}: {
  nominee: Nominee;
  rank?: number;
  state: "idle" | "eliminating" | "eliminated" | "winner" | "runnerup";
  showVotes: boolean;
  totalVotes: number;
  delay?: number;
}) {
  const pct = totalVotes > 0 ? (nominee.votes / totalVotes) * 100 : 0;
  const animatedPct = useCountUp(showVotes ? pct : 0, 1400, showVotes);
  const animatedVotes = useCountUp(showVotes ? nominee.votes : 0, 1400, showVotes);

  const isOut = state === "eliminated";
  const isElim = state === "eliminating";
  const isWin = state === "winner";
  const isRunner = state === "runnerup";

  return (
    <div
      className={[
        "animate-slide-up-fade glass-card relative overflow-hidden rounded-2xl p-5 transition-all duration-700",
        isOut && "pointer-events-none scale-95 opacity-0 blur-md",
        isElim && "animate-drum-shake",
        isWin && "animate-pulse-gold ring-2 ring-[var(--gold-500)]",
        isRunner && "ring-1 ring-[var(--gold-500)]/40",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {rank !== undefined && (
        <div className="absolute right-4 top-4 font-display text-2xl font-semibold text-gold/70">
          #{rank}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div
          className={[
            "grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-xl font-semibold",
            isWin ? "text-[#1a1300]" : "text-gold",
          ].join(" ")}
          style={{
            background: isWin
              ? "var(--gradient-gold)"
              : "linear-gradient(135deg, rgba(255,215,0,0.18), rgba(255,215,0,0.04))",
            border: "1px solid rgba(255,215,0,0.35)",
          }}
        >
          {nominee.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-xl font-semibold text-white">
            {nominee.name}
          </div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">
            {nominee.house || "\u00A0"}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[1400ms] ease-out"
            style={{
              width: `${animatedPct}%`,
              background: "var(--gradient-gold)",
              boxShadow: "0 0 12px rgba(255,215,0,0.6)",
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs tabular-nums">
          <span className="text-white/50">
            {showVotes ? animatedVotes.toLocaleString() : "—"} votes
          </span>
          <span className="font-semibold text-gold">
            {showVotes ? animatedPct.toFixed(1) : "0.0"}%
          </span>
        </div>
      </div>
    </div>
  );
}

function NomineesScreen({
  category,
  onReveal,
}: {
  category: Category;
  onReveal: () => void;
}) {
  // Shuffle display order so the layout itself doesn't telegraph the winner.
  const display = useMemo(
    () => seededShuffle(category.nominees, `nominees:${category.id}`),
    [category],
  );
  return (
    <div className="stage-bg vignette relative min-h-screen px-4 py-12 sm:px-6">
      <Particles />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10">
        <div className="animate-slide-up-fade flex flex-col items-center gap-3 text-center">
          <Kicker>The Nominees</Kicker>
          <h2 className="font-display max-w-full break-words px-2 text-3xl font-medium text-white sm:text-6xl">
            <span className="text-gold">{category.icon}</span>{" "}
            <span className="text-gradient-gold">{category.title}</span>
          </h2>
          <p className="text-xs text-white/50 sm:text-sm">
            {category.totalVotes.toLocaleString()} ballots verified · Polls now closed
          </p>
          <GoldDivider />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {display.map((n, i) => (
            <NomineeCard
              key={n.id}
              nominee={n}
              state="idle"
              showVotes={false}
              totalVotes={category.totalVotes}
              delay={i * 220}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={onReveal}
            className="btn-gold rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em] sm:px-12 sm:py-4"
          >
            Begin the Reveal 🥁
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense reveal: nominees ordered ascending; eliminate from lowest upward.
 */
function RevealScreen({
  category,
  onWinner,
}: {
  category: Category;
  onWinner: () => void;
}) {
  // Elimination queue: ascending by votes (lowest goes first).
  const ordered = useMemo(
    () => [...category.nominees].sort((a, b) => a.votes - b.votes),
    [category],
  );
  // Display order: seeded shuffle so on-stage positions do NOT reveal ranking.
  const display = useMemo(
    () => seededShuffle(category.nominees, `reveal:${category.id}`),
    [category],
  );

  // step: 0 = drumroll, then eliminate 1..N-1 (4th, 3rd, 2nd), then winner
  const [step, setStep] = useState(0);
  const [elimIdx, setElimIdx] = useState<number | null>(null);

  useEffect(() => {
    const totalElims = ordered.length - 1; // last one wins
    if (step > totalElims) {
      const t = setTimeout(onWinner, 1400);
      return () => clearTimeout(t);
    }
    // intro pause before first elimination
    const introDelay = step === 0 ? 2200 : 1800;
    const shakeDuration = 900;

    const t1 = setTimeout(() => setElimIdx(step), introDelay);
    const t2 = setTimeout(() => {
      setElimIdx(null);
      setStep((s) => s + 1);
    }, introDelay + shakeDuration + 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step, ordered.length, onWinner]);

  // Track eliminations by nominee id (display order is independent of rank;
  // ids are stable and unique, unlike names which two nominees could share).
  const eliminatedIds = new Set<string>();
  for (let i = 0; i < step; i++) eliminatedIds.add(ordered[i].id);
  const currentEliminatingId = elimIdx !== null ? ordered[elimIdx].id : null;
  const winnerId = ordered[ordered.length - 1].id;

  const remaining = ordered.length - step;
  const place =
    elimIdx !== null
      ? ordered.length - elimIdx // 4 for idx 0 of 4
      : null;

  return (
    <div className="stage-bg vignette relative min-h-screen px-4 py-12 sm:px-6">
      <Particles />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 sm:gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Kicker>Live Reveal</Kicker>
          <h2 className="font-display max-w-full break-words px-2 text-2xl font-medium text-white sm:text-5xl">
            <span className="text-gradient-gold">{category.title}</span>
          </h2>
          <GoldDivider />

          <div className="mt-4 h-12">
            {place !== null && (
              <div className="animate-scale-in-bounce">
                <p className="text-xs uppercase tracking-[0.5em] text-white/50">
                  Eliminating
                </p>
                <p className="font-display text-3xl font-semibold text-gold sm:text-4xl">
                  {ordinal(place)} Place
                </p>
              </div>
            )}
            {place === null && step === 0 && (
              <p className="font-display text-2xl italic text-white/60">
                Drum roll please…
              </p>
            )}
            {place === null && step > 0 && remaining > 1 && (
              <p className="text-xs uppercase tracking-[0.5em] text-white/50">
                {remaining} Remaining
              </p>
            )}
            {remaining === 1 && (
              <p className="font-display text-2xl italic shimmer-text">
                And the winner is…
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {display.map((n) => {
            const isElim = eliminatedIds.has(n.id);
            const isCurrent = n.id === currentEliminatingId;
            // Only mark a "runner-up" once we are down to two so it doesn't
            // pre-announce which card is the eventual winner.
            const isRunnerCandidate =
              remaining === 2 && !isElim && n.id !== winnerId;
            const state: Parameters<typeof NomineeCard>[0]["state"] = isElim
              ? "eliminated"
              : isCurrent
                ? "eliminating"
                : isRunnerCandidate
                  ? "runnerup"
                  : "idle";
            // Reveal the final placing on a card ONLY after it has been
            // eliminated or while it is being eliminated.
            const orderedIdx = ordered.findIndex((o) => o.id === n.id);
            const showRank = isElim || isCurrent;
            return (
              <NomineeCard
                key={n.id}
                nominee={n}
                rank={showRank ? ordered.length - orderedIdx : undefined}
                state={state}
                showVotes={isElim || isCurrent}
                totalVotes={category.totalVotes}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ----- Winner ----- */
function WinnerRing({ pct }: { pct: number }) {
  const r = 110;
  const c = 2 * Math.PI * r;
  const animatedPct = useCountUp(pct, 2000);
  const offset = c - (animatedPct / 100) * c;
  return (
    <div className="relative grid aspect-square w-56 max-w-[72vw] place-items-center sm:w-72 sm:max-w-none">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 260 260">
        <defs>
          <linearGradient id="goldGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="50%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="4" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="130" cy="130" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="130"
          cy="130"
          r={r}
          stroke="url(#goldGrad)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          filter="url(#goldGlow)"
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="text-center">
        <div className="font-display text-4xl font-semibold text-gradient-gold tabular-nums sm:text-6xl">
          {animatedPct.toFixed(1)}%
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-white/40 sm:text-[10px] sm:tracking-[0.4em]">
          of the vote
        </div>
      </div>
    </div>
  );
}

function WinnerScreen({
  category,
  onNext,
}: {
  category: Category;
  onNext: () => void;
}) {
  const winner = useMemo(
    () => [...category.nominees].sort((a, b) => b.votes - a.votes)[0],
    [category]
  );
  const pct = category.totalVotes > 0 ? (winner.votes / category.totalVotes) * 100 : 0;
  const votes = useCountUp(winner.votes, 2000);

  useEffect(() => {
    fireConfetti();
    const t = setInterval(fireConfetti, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="stage-bg vignette relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <Particles />
      <Spotlights />

      {/* Burst glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,215,0,0.35) 0%, transparent 50%)",
        }}
      />

      <div className="animate-scale-in-bounce relative z-10 flex w-full flex-col items-center gap-5 sm:gap-6">
        <Kicker>{category.title}</Kicker>

        <div className="text-5xl drop-shadow-[0_0_30px_rgba(255,215,0,0.7)] sm:text-6xl">
          🥇
        </div>

        <p className="font-display text-xl italic text-gold sm:text-2xl">Winner</p>

        <h1 className="font-display max-w-full break-words px-2 text-4xl font-semibold uppercase leading-none tracking-tight text-white sm:max-w-3xl sm:text-8xl md:text-9xl">
          <span className="shimmer-text">{winner.name}</span>
        </h1>

        {winner.house && (
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 sm:text-xs sm:tracking-[0.5em]">
            {winner.house}
          </p>
        )}

        <GoldDivider />

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-12">
          <WinnerRing pct={pct} />
          <div className="text-center sm:text-left">
            <div className="font-display text-5xl font-semibold text-gradient-gold tabular-nums leading-none sm:text-7xl">
              {votes.toLocaleString()}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-xs sm:tracking-[0.4em]">
              Total Votes Received
            </div>
            <div className="mt-6 max-w-sm text-sm italic text-white/60">
              "An overwhelming mandate from the student body — a defining
              moment{winner.house ? ` for ${winner.house.split(" ")[0]}` : ""}."
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="btn-gold mt-4 rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em] sm:mt-6 sm:px-10"
        >
          View Full Breakdown
        </button>
      </div>
    </div>
  );
}

/* ----- Breakdown / Race chart ----- */
function BreakdownScreen({
  category,
  isLast,
  onNext,
  onRestart,
}: {
  category: Category;
  isLast: boolean;
  onNext: () => void;
  onRestart: () => void;
}) {
  const sorted = useMemo(
    () => [...category.nominees].sort((a, b) => b.votes - a.votes),
    [category]
  );
  const max = sorted[0].votes;

  return (
    <div className="stage-bg vignette relative min-h-screen px-4 py-12 sm:px-6">
      <Particles />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Kicker>Final Standings</Kicker>
          <h2 className="font-display max-w-full break-words px-2 text-3xl font-medium text-white sm:text-6xl">
            <span className="text-gradient-gold">{category.title}</span>
          </h2>
          <p className="text-xs text-white/50 sm:text-sm">
            {category.totalVotes.toLocaleString()} verified votes
          </p>
          <GoldDivider />
        </div>

        <div className="glass-card flex flex-col gap-5 rounded-3xl p-4 sm:gap-6 sm:p-10">
          {sorted.map((n, i) => (
            <RaceRow
              key={n.id}
              nominee={n}
              rank={i + 1}
              max={max}
              totalVotes={category.totalVotes}
              delay={i * 180}
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onRestart}
            className="rounded-full border border-white/15 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-[var(--gold-500)]/60 hover:text-gold sm:px-8"
          >
            ← Restart Ceremony
          </button>
          <button
            onClick={onNext}
            className="btn-gold rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em] sm:px-10"
          >
            {isLast ? "Finale →" : "Next Category →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RaceRow({
  nominee,
  rank,
  max,
  totalVotes,
  delay,
}: {
  nominee: Nominee;
  rank: number;
  max: number;
  totalVotes: number;
  delay: number;
}) {
  const [start, setStart] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), delay + 250);
    return () => clearTimeout(t);
  }, [delay]);
  const pct = totalVotes > 0 ? (nominee.votes / totalVotes) * 100 : 0;
  const widthPct = max > 0 ? (nominee.votes / max) * 100 : 0;
  const animatedVotes = useCountUp(nominee.votes, 1600, start);
  const animatedPct = useCountUp(pct, 1600, start);
  const isWinner = rank === 1;

  return (
    <div className="animate-slide-up-fade" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-baseline gap-2 sm:gap-3">
          <span className="shrink-0 font-display text-lg font-semibold text-gold/70 tabular-nums sm:text-2xl">
            {String(rank).padStart(2, "0")}
          </span>
          <span
            className={[
              "truncate font-display text-base font-medium sm:text-2xl",
              isWinner ? "text-gradient-gold" : "text-white",
            ].join(" ")}
          >
            {nominee.name}
          </span>
          {nominee.house && (
            <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.3em] text-white/30 sm:inline">
              · {nominee.house}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-baseline gap-2 tabular-nums sm:gap-3">
          <span className="hidden text-sm text-white/40 sm:inline">
            {animatedVotes.toLocaleString()}
          </span>
          <span
            className={[
              "font-display text-lg font-semibold tabular-nums sm:text-3xl",
              isWinner ? "text-gold" : "text-white/80",
            ].join(" ")}
          >
            {animatedPct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/5 sm:h-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[1600ms] ease-out"
          style={{
            width: start ? `${widthPct}%` : "0%",
            background: isWinner
              ? "var(--gradient-gold)"
              : "linear-gradient(90deg, rgba(255,215,0,0.55), rgba(184,134,11,0.4))",
            boxShadow: isWinner
              ? "0 0 24px rgba(255,215,0,0.6)"
              : "0 0 10px rgba(255,215,0,0.25)",
          }}
        />
      </div>
      <div className="mt-1 text-right text-[11px] text-white/40 sm:hidden">
        {animatedVotes.toLocaleString()} votes
      </div>
    </div>
  );
}

/* ============================================================
   Top progress / chrome
   ============================================================ */
function CeremonyChrome({
  catIndex,
  total,
  stage,
  onExit,
}: {
  catIndex: number;
  total: number;
  stage: Stage;
  onExit: () => void;
}) {
  if (stage === "welcome") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-5">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full gold-border sm:h-9 sm:w-9">
          <span className="text-xs sm:text-sm">🏆</span>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[8px] uppercase tracking-[0.3em] text-white/40 sm:text-[10px] sm:tracking-[0.4em]">
            LASU Epe Gala Night
          </div>
          <div className="truncate text-[10px] text-gold sm:text-xs">
            Faculty Fusion Forge · Live Reveal
          </div>
        </div>
      </div>

      <div className="hidden gap-2 sm:flex">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={[
              "h-1 w-10 rounded-full transition-all",
              i < catIndex
                ? "bg-[var(--gold-500)]"
                : i === catIndex
                  ? "bg-[var(--gold-500)]/70 shadow-[0_0_10px_rgba(255,215,0,0.6)]"
                  : "bg-white/10",
            ].join(" ")}
          />
        ))}
      </div>

      <button
        onClick={onExit}
        className="pointer-events-auto shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-white/50 transition hover:border-[var(--gold-500)]/60 hover:text-gold sm:px-4 sm:text-[10px] sm:tracking-[0.3em]"
      >
        Exit
      </button>
    </div>
  );
}

/* ============================================================
   Finale
   ============================================================ */
function FinaleScreen({ onRestart }: { onRestart: () => void }) {
  useEffect(() => {
    fireConfetti();
  }, []);
  return (
    <div className="stage-bg vignette relative flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <Particles />
      <Spotlights />
      <div className="animate-slide-up-fade relative z-10 flex flex-col items-center gap-5 sm:gap-6">
        <div className="text-5xl drop-shadow-[0_0_30px_rgba(255,215,0,0.7)] sm:text-7xl">🎭</div>
        <Kicker>That's a Wrap</Kicker>
        <h1 className="font-display text-4xl font-medium text-white sm:text-7xl">
          <span className="shimmer-text italic">Thank You,</span> <br />
          <span className="text-gradient-gold">LASU Epe</span>
        </h1>
        <p className="max-w-xl text-sm text-white/60 sm:text-base">
          Congratulations to every nominee and every faculty represented
          tonight. One night, one venue, the entire LASU elite.
        </p>
        <GoldDivider />
        <button onClick={onRestart} className="btn-gold rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em] sm:px-10">
          Replay Ceremony
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Loading / Error states
   ============================================================ */
function LoadingScreen() {
  return (
    <div className="font-body grid min-h-screen place-items-center bg-[var(--navy-950)] px-6 text-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[var(--gold-500)]" />
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">
          Loading results…
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="font-body grid min-h-screen place-items-center bg-[var(--navy-950)] px-6 text-center text-white">
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="font-display text-2xl">Couldn't load results</h1>
        <p className="text-sm text-white/60">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-gold rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Main
   ============================================================ */
function Index() {
  const { categories: rawCategories, loading, error } = useCategories();
  // Categories with no nominees can't be revealed (no winner to crown), so
  // they're excluded from the live ceremony flow. They still show up in the
  // admin dashboard so they can be filled in.
  const CATEGORIES = useMemo(
    () => rawCategories.filter((c) => c.nominees.length > 0),
    [rawCategories],
  );
  const [catIndex, setCatIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("welcome");
  const [finale, setFinale] = useState(false);
  const safeIndex = Math.min(catIndex, Math.max(0, CATEGORIES.length - 1));
  const category = CATEGORIES[safeIndex];

  const nextCategory = () => {
    if (catIndex + 1 >= CATEGORIES.length) {
      setFinale(true);
      return;
    }
    setCatIndex((i) => i + 1);
    setStage("category");
  };

  const goWelcome = () => {
    setFinale(false);
    setCatIndex(0);
    setStage("welcome");
  };

  // Keyboard nav (Space / Enter to advance). These hooks must run on every
  // render regardless of loading/error/empty state below — React requires
  // the same hooks in the same order every time, or it throws (error #310).
  const handlerRef = useRef<() => void>(() => {});
  handlerRef.current = () => {
    if (loading || error || !category || finale) return;
    if (stage === "welcome") setStage("category");
    else if (stage === "category") setStage("nominees");
    else if (stage === "nominees") setStage("reveal");
    else if (stage === "winner") setStage("breakdown");
    else if (stage === "breakdown") nextCategory();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        handlerRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  // Empty-data guard so the live screen doesn't crash if no categories
  // have been configured yet (or none have nominees). The admin link
  // gives a way back.
  if (!category) {
    return (
      <div className="font-body grid min-h-screen place-items-center bg-[var(--navy-950)] px-6 text-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">🏆</div>
          <h1 className="font-display text-3xl">No categories configured</h1>
          <p className="text-white/60">
            {rawCategories.length === 0
              ? "Add a category in the admin dashboard to begin."
              : "Add nominees to a category in the admin dashboard to begin."}
          </p>
          <a
            href="/admin"
            className="btn-gold rounded-full px-8 py-3 text-xs uppercase tracking-[0.3em]"
          >
            Open Admin
          </a>
        </div>
      </div>
    );
  }

  if (finale) return <FinaleScreen onRestart={goWelcome} />;

  return (
    <div className="font-body min-h-screen bg-[var(--navy-950)] text-white">
      <CeremonyChrome
        catIndex={catIndex}
        total={CATEGORIES.length}
        stage={stage}
        onExit={goWelcome}
      />

      {stage === "welcome" && (
        <WelcomeScreen categories={CATEGORIES} onBegin={() => setStage("category")} />
      )}
      {stage === "category" && (
        <CategoryIntro
          category={category}
          index={catIndex}
          total={CATEGORIES.length}
          onNext={() => setStage("nominees")}
        />
      )}
      {stage === "nominees" && (
        <NomineesScreen category={category} onReveal={() => setStage("reveal")} />
      )}
      {stage === "reveal" && (
        <RevealScreen category={category} onWinner={() => setStage("winner")} />
      )}
      {stage === "winner" && (
        <WinnerScreen category={category} onNext={() => setStage("breakdown")} />
      )}
      {stage === "breakdown" && (
        <BreakdownScreen
          category={category}
          isLast={catIndex + 1 >= CATEGORIES.length}
          onNext={nextCategory}
          onRestart={goWelcome}
        />
      )}
    </div>
  );
}
