import { supabase } from "@/lib/supabase";
import { initialsOf, type Category, type Nominee } from "@/lib/awards-store";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Generates a unique category slug, appending -2, -3, ... on collision. */
export function uniqueSlug(base: string, existingIds: string[]): string {
  const root = slugify(base) || `category-${Date.now()}`;
  if (!existingIds.includes(root)) return root;
  let i = 2;
  while (existingIds.includes(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

export async function createCategory(params: {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  sortOrder: number;
}) {
  const { error } = await supabase.from("categories").insert({
    id: params.id,
    icon: params.icon,
    title: params.title,
    subtitle: params.subtitle,
    total_votes: 0,
    auto_total: true,
    sort_order: params.sortOrder,
  });
  if (error) throw error;
}

export async function renameCategoryId(oldId: string, newId: string) {
  const { error } = await supabase.from("categories").update({ id: newId }).eq("id", oldId);
  if (error) throw error;
}

export async function updateCategory(
  id: string,
  patch: Partial<{
    icon: string;
    title: string;
    subtitle: string;
    totalVotes: number;
    autoTotal: boolean;
    sortOrder: number;
  }>,
) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.icon !== undefined) dbPatch.icon = patch.icon;
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.subtitle !== undefined) dbPatch.subtitle = patch.subtitle;
  if (patch.totalVotes !== undefined) dbPatch.total_votes = patch.totalVotes;
  if (patch.autoTotal !== undefined) dbPatch.auto_total = patch.autoTotal;
  if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;

  const { error } = await supabase.from("categories").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Swaps sort_order between two categories (used for move up/down). */
export async function swapCategoryOrder(a: Category, b: Category) {
  const { error: e1 } = await supabase
    .from("categories")
    .update({ sort_order: b.sortOrder })
    .eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from("categories")
    .update({ sort_order: a.sortOrder })
    .eq("id", b.id);
  if (e2) throw e2;
}

export async function createNominee(categoryId: string, sortOrder: number) {
  const { error } = await supabase.from("nominees").insert({
    category_id: categoryId,
    name: "New Nominee",
    house: "",
    votes: 0,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function updateNominee(
  id: string,
  patch: Partial<{ name: string; house: string; votes: number }>,
) {
  const { error } = await supabase.from("nominees").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteNominee(id: string) {
  const { error } = await supabase.from("nominees").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Replaces the entire dataset (used by JSON import). Deletes everything
 * and re-inserts in a single best-effort sequence. Not a true transaction
 * since the client can't run multi-statement transactions, but failures
 * after partial writes will surface to the caller so they can fix it
 * manually rather than silently end up with stale data.
 */
export async function replaceAllData(categories: Category[]) {
  const { error: delNomErr } = await supabase.from("nominees").delete().neq("id", "");
  if (delNomErr) throw delNomErr;
  const { error: delCatErr } = await supabase.from("categories").delete().neq("id", "");
  if (delCatErr) throw delCatErr;

  for (const [catIndex, c] of categories.entries()) {
    const { error: catErr } = await supabase.from("categories").insert({
      id: c.id,
      icon: c.icon,
      title: c.title,
      subtitle: c.subtitle,
      total_votes: c.totalVotes,
      auto_total: c.autoTotal,
      sort_order: catIndex,
    });
    if (catErr) throw catErr;

    if (c.nominees.length > 0) {
      const { error: nomErr } = await supabase.from("nominees").insert(
        c.nominees.map((n: Nominee, i: number) => ({
          category_id: c.id,
          name: n.name,
          house: n.house,
          votes: n.votes,
          sort_order: i,
        })),
      );
      if (nomErr) throw nomErr;
    }
  }
}

export { initialsOf };
