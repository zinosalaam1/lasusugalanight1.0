import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Nominee = {
  id: string;
  name: string;
  house: string;
  votes: number;
  initials: string;
  sortOrder: number;
};

export type Category = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  totalVotes: number;
  autoTotal: boolean;
  sortOrder: number;
  nominees: Nominee[];
};

export const initialsOf = (n: string) =>
  n
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ----------------------------------------------------------------
// Row shapes coming back from Postgres (snake_case).
// ----------------------------------------------------------------
type CategoryRow = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  total_votes: number;
  auto_total: boolean;
  sort_order: number;
};

type NomineeRow = {
  id: string;
  category_id: string;
  name: string;
  house: string;
  votes: number;
  sort_order: number;
};

function assemble(categoryRows: CategoryRow[], nomineeRows: NomineeRow[]): Category[] {
  const byCategory = new Map<string, Nominee[]>();
  for (const n of nomineeRows) {
    const list = byCategory.get(n.category_id) ?? [];
    list.push({
      id: n.id,
      name: n.name,
      house: n.house,
      votes: n.votes,
      initials: initialsOf(n.name),
      sortOrder: n.sort_order,
    });
    byCategory.set(n.category_id, list);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return categoryRows
    .map((c) => ({
      id: c.id,
      icon: c.icon,
      title: c.title,
      subtitle: c.subtitle,
      totalVotes: c.total_votes,
      autoTotal: c.auto_total,
      sortOrder: c.sort_order,
      nominees: byCategory.get(c.id) ?? [],
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ----------------------------------------------------------------
// Fetch
// ----------------------------------------------------------------

export async function fetchCategories(): Promise<Category[]> {
  const [{ data: categoryRows, error: catErr }, { data: nomineeRows, error: nomErr }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("nominees").select("*").order("sort_order", { ascending: true }),
    ]);

  if (catErr) throw catErr;
  if (nomErr) throw nomErr;

  return assemble((categoryRows ?? []) as CategoryRow[], (nomineeRows ?? []) as NomineeRow[]);
}

/**
 * Subscribes to live results. Calls onChange with a fresh, fully
 * reassembled list whenever any category or nominee row changes
 * (insert/update/delete) for ANY viewer — this is what keeps the
 * public reveal screen and the admin dashboard in sync across
 * devices without a manual refresh.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToCategories(
  onChange: (categories: Category[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  let cancelled = false;

  const reload = async () => {
    try {
      const cats = await fetchCategories();
      if (!cancelled) onChange(cats);
    } catch (e) {
      onError?.(e);
    }
  };

  // Initial load.
  reload();

  const channel = supabase
    .channel("awards-results")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, reload)
    .on("postgres_changes", { event: "*", schema: "public", table: "nominees" }, reload)
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

/**
 * React hook for the public-facing results screen. Live-updates via
 * Supabase Realtime. `loading` is true only until the first fetch
 * resolves; `error` surfaces fetch/subscription failures so the UI
 * can show a real error state instead of silently rendering nothing.
 */
export function useCategories(): {
  categories: Category[];
  loading: boolean;
  error: string | null;
} {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToCategories(
      (cats) => {
        setCategories(cats);
        setLoading(false);
      },
      (e) => {
        console.error("Failed to load results:", e);
        setError(e instanceof Error ? e.message : "Failed to load results.");
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { categories, loading, error };
}

// Deterministic shuffle so nominee display order doesn't telegraph the winner
// but stays stable across re-renders within a category.
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
