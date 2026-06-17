import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  type Category,
  useCategories,
} from "@/lib/awards-store";
import {
  createCategory,
  createNominee,
  deleteCategory,
  deleteNominee,
  renameCategoryId,
  replaceAllData,
  swapCategoryOrder,
  uniqueSlug,
  updateCategory,
  updateNominee,
} from "@/lib/admin-store";
import { signIn, signOut, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Gala Night Admin · LASUSU LASU Epe" },
      { name: "description", content: "Manage categories, nominees and votes for the live awards reveal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

/* ============================================================
   Login gate
   ============================================================ */
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--navy-950)] px-4 text-white sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="glass-card flex w-full max-w-sm flex-col gap-5 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full gold-border">
            <span className="text-lg">🏆</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold/80">
            Awards Control Room
          </p>
          <h1 className="font-display text-2xl">Admin Sign In</h1>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Email</span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none transition focus:border-[var(--gold-500)]/60 sm:text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none transition focus:border-[var(--gold-500)]/60 sm:text-sm"
          />
        </label>

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-gold rounded-full px-6 py-3 text-xs uppercase tracking-[0.3em] disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>

        <Link
          to="/"
          className="text-center text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-gold"
        >
          ← Back to Reveal
        </Link>
      </form>
    </div>
  );
}

/* ============================================================
   Admin shell (auth-gated)
   ============================================================ */
function AdminPage() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--navy-950)] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[var(--gold-500)]" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <Dashboard userEmail={session.user.email ?? ""} />;
}

/* ============================================================
   Dashboard
   ============================================================ */
function Dashboard({ userEmail }: { userEmail: string }) {
  const { categories, loading, error } = useCategories();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const addCategory = () =>
    run(async () => {
      const id = uniqueSlug("new-award", categories.map((c) => c.id));
      await createCategory({
        id,
        icon: "🏆",
        title: "New Award",
        subtitle: "Describe this honour.",
        sortOrder: categories.length,
      });
      setOpenId(id);
    });

  const removeCategory = (id: string) => {
    if (!confirm("Delete this category and all its nominees? This cannot be undone.")) return;
    run(() => deleteCategory(id));
  };

  const moveCategory = (id: string, dir: -1 | 1) =>
    run(async () => {
      const i = categories.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= categories.length) return;
      await swapCategoryOrder(categories[i], categories[j]);
    });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(categories, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "awards-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    run(async () => {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("File must contain a JSON array of categories.");
      if (
        !confirm(
          `This will replace ALL current categories and nominees with the ${data.length} ` +
            "categories in this file. This cannot be undone. Continue?",
        )
      ) {
        return;
      }
      await replaceAllData(data as Category[]);
    });
  };

  return (
    <div className="min-h-screen bg-[var(--navy-950)] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold/80">
              Awards Control Room
            </p>
            <h1 className="font-display mt-1 text-4xl text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/50">
              Signed in as {userEmail}. Changes save live and sync to every viewer instantly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:border-[var(--gold-500)]/60 hover:text-gold sm:px-5 sm:text-xs sm:tracking-[0.3em]"
            >
              ← View Reveal
            </Link>
            <button
              onClick={exportJson}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:border-[var(--gold-500)]/60 hover:text-gold sm:px-5 sm:text-xs sm:tracking-[0.3em]"
            >
              Export
            </button>
            <label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:border-[var(--gold-500)]/60 hover:text-gold sm:px-5 sm:text-xs sm:tracking-[0.3em]">
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() => signOut()}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:border-rose-400/60 hover:text-rose-300 sm:px-5 sm:text-xs sm:tracking-[0.3em]"
            >
              Sign Out
            </button>
          </div>
        </header>

        {actionError && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            {actionError}
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            Failed to load results: {error}
          </p>
        )}

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[var(--gold-500)]" />
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                onClick={addCategory}
                disabled={busy}
                className="btn-gold rounded-full px-6 py-2 text-xs uppercase tracking-[0.3em] disabled:opacity-50"
              >
                + Add Category
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {categories.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
                  No categories yet. Add one to begin.
                </div>
              )}

              {categories.map((cat, i) => (
                <CategoryEditor
                  key={cat.id}
                  category={cat}
                  index={i}
                  total={categories.length}
                  open={openId === cat.id}
                  onToggle={() => setOpenId(openId === cat.id ? null : cat.id)}
                  onMove={(dir) => moveCategory(cat.id, dir)}
                  onDelete={() => removeCategory(cat.id)}
                  run={run}
                  onIdChanged={(newId) => setOpenId(newId)}
                  existingIds={categories.map((c) => c.id)}
                />
              ))}
            </div>
          </>
        )}

        <p className="pt-4 text-center text-[11px] uppercase tracking-[0.3em] text-white/30">
          Tip · The reveal screen hides nominee positions until each elimination,
          so the audience can't guess the winner from the layout.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Category editor
   ============================================================ */
function CategoryEditor({
  category: cat,
  index: i,
  total,
  open,
  onToggle,
  onMove,
  onDelete,
  run,
  onIdChanged,
  existingIds,
}: {
  category: Category;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  run: (fn: () => Promise<void>) => void;
  onIdChanged: (id: string) => void;
  existingIds: string[];
}) {
  const sum = cat.nominees.reduce((s, n) => s + (Number(n.votes) || 0), 0);

  const addNominee = () => run(() => createNominee(cat.id, cat.nominees.length));

  const editNomineeField = (
    nomineeId: string,
    patch: Partial<{ name: string; house: string; votes: number }>,
  ) => run(() => updateNominee(nomineeId, patch));

  const removeNominee = (nomineeId: string) => {
    if (!confirm("Delete this nominee?")) return;
    run(() => deleteNominee(nomineeId));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <header className="flex flex-wrap items-center gap-3 px-5 py-4">
        <span className="text-2xl">{cat.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg">{cat.title}</div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            {cat.nominees.length} nominees · {cat.totalVotes.toLocaleString()} votes
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={i === 0} onClick={() => onMove(-1)}>↑</IconBtn>
          <IconBtn label="Move down" disabled={i === total - 1} onClick={() => onMove(1)}>↓</IconBtn>
          <IconBtn label="Delete" onClick={onDelete} danger>✕</IconBtn>
          <button
            onClick={onToggle}
            className="ml-2 rounded-full border border-white/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-white/70 hover:border-[var(--gold-500)]/60 hover:text-gold"
          >
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </header>

      {open && (
        <div className="flex flex-col gap-6 border-t border-white/10 bg-black/20 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Icon (emoji)">
              <input
                key={`icon-${cat.id}`}
                defaultValue={cat.icon}
                onBlur={(e) => {
                  if (e.target.value === cat.icon) return;
                  run(() => updateCategory(cat.id, { icon: e.target.value }));
                }}
                className={inputCls}
                maxLength={4}
              />
            </Field>
            <Field label="Identifier (slug)">
              <input
                key={`id-${cat.id}`}
                defaultValue={cat.id}
                onBlur={(e) => {
                  const newId = e.target.value.trim();
                  if (!newId || newId === cat.id) return;
                  if (existingIds.includes(newId)) {
                    alert("That identifier is already used by another category.");
                    e.target.value = cat.id;
                    return;
                  }
                  run(async () => {
                    await renameCategoryId(cat.id, newId);
                    onIdChanged(newId);
                  });
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <input
                key={`title-${cat.id}`}
                defaultValue={cat.title}
                onBlur={(e) => {
                  if (e.target.value === cat.title) return;
                  run(() => updateCategory(cat.id, { title: e.target.value }));
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Subtitle / tagline" className="sm:col-span-2">
              <input
                key={`subtitle-${cat.id}`}
                defaultValue={cat.subtitle}
                onBlur={(e) => {
                  if (e.target.value === cat.subtitle) return;
                  run(() => updateCategory(cat.id, { subtitle: e.target.value }));
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Auto-calculate total votes">
              <label className="flex items-center gap-2 pt-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={cat.autoTotal}
                  onChange={(e) => run(() => updateCategory(cat.id, { autoTotal: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--gold-500)]"
                />
                Sum of nominee votes
              </label>
            </Field>
            <Field label={`Total votes ${cat.autoTotal ? "(auto)" : "(manual)"}`}>
              <input
                key={`total-${cat.id}`}
                type="number"
                min={0}
                defaultValue={cat.totalVotes}
                disabled={cat.autoTotal}
                onBlur={(e) =>
                  run(() => updateCategory(cat.id, { totalVotes: Number(e.target.value) || 0 }))
                }
                className={inputCls + (cat.autoTotal ? " opacity-50" : "")}
              />
            </Field>
            {!cat.autoTotal && sum !== cat.totalVotes && (
              <p className="sm:col-span-2 text-xs text-rose-300">
                Sum of nominee votes ({sum.toLocaleString()}) doesn't match total votes (
                {cat.totalVotes.toLocaleString()}).
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.3em] text-gold/80">Nominees</h3>
              <button
                onClick={addNominee}
                className="rounded-full border border-[var(--gold-500)]/40 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold hover:bg-[var(--gold-500)]/10"
              >
                + Add Nominee
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {cat.nominees.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
                  No nominees yet.
                </div>
              )}
              {cat.nominees.map((n) => {
                const pct = cat.totalVotes > 0 ? (n.votes / cat.totalVotes) * 100 : 0;
                return (
                  <div
                    key={n.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <input
                      defaultValue={n.name}
                      onBlur={(e) => editNomineeField(n.id, { name: e.target.value })}
                      placeholder="Full name"
                      className={inputCls + " col-span-12 sm:col-span-4"}
                    />
                    <input
                      defaultValue={n.house}
                      onBlur={(e) => editNomineeField(n.id, { house: e.target.value })}
                      placeholder="House / group"
                      className={inputCls + " col-span-6 sm:col-span-3"}
                    />
                    <input
                      type="number"
                      min={0}
                      defaultValue={n.votes}
                      onBlur={(e) => editNomineeField(n.id, { votes: Number(e.target.value) || 0 })}
                      placeholder="Votes"
                      className={inputCls + " col-span-6 sm:col-span-2 text-right tabular-nums"}
                    />
                    <div className="col-span-9 text-right text-xs tabular-nums text-gold/80 sm:col-span-2">
                      {pct.toFixed(1)}%
                    </div>
                    <div className="col-span-3 flex justify-end sm:col-span-1">
                      <IconBtn label="Delete nominee" danger onClick={() => removeNominee(n.id)}>
                        ✕
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-base text-white outline-none transition focus:border-[var(--gold-500)]/60 sm:text-sm";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"flex flex-col gap-1 " + className}>
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">{label}</span>
      {children}
    </label>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={
        "grid h-8 w-8 place-items-center rounded-full border text-sm transition " +
        (disabled
          ? "cursor-not-allowed border-white/5 text-white/20"
          : danger
            ? "border-white/10 text-white/60 hover:border-rose-400/60 hover:text-rose-300"
            : "border-white/10 text-white/60 hover:border-[var(--gold-500)]/60 hover:text-gold")
      }
    >
      {children}
    </button>
  );
}
