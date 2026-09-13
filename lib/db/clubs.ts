import "server-only";

// The managed club list. Products point at a club, and customers can browse
// the catalog by club.

import { supabaseAdmin } from "../supabase-admin";
import { slugify, type Club } from "../types";

const TABLE = "clubs";

interface ClubRow {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  sort_order: number;
}

function rowToClub(row: ClubRow): Club {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? null,
    active: row.active,
    sortOrder: row.sort_order ?? 0,
  };
}

export async function listClubs(
  opts: { activeOnly?: boolean } = {}
): Promise<Club[]> {
  let query = supabaseAdmin()
    .from(TABLE)
    .select("id, name, slug, active, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (opts.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as ClubRow[]).map(rowToClub);
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "clube";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : base + "-" + n;
    const { data, error } = await supabaseAdmin()
      .from(TABLE)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    const taken = data as { id: string } | null;
    if (!taken || taken.id === excludeId) return candidate;
  }
  return base + "-" + Date.now().toString(36);
}

export type ClubInput = {
  name: string;
  slug?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function createClub(data: ClubInput): Promise<Club> {
  const slug = await uniqueSlug(data.slug || data.name);
  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .insert({
      name: data.name,
      slug,
      active: data.active ?? true,
      sort_order: data.sortOrder ?? 0,
    })
    .select("id, name, slug, active, sort_order")
    .single();
  if (error) throw error;
  return rowToClub(row as ClubRow);
}

export async function updateClub(
  id: string,
  patch: Partial<ClubInput>
): Promise<Club | null> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (patch.slug !== undefined) {
    update.slug = await uniqueSlug(patch.slug || patch.name || "clube", id);
  }

  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select("id, name, slug, active, sort_order")
    .maybeSingle();
  if (error) throw error;
  return row ? rowToClub(row as ClubRow) : null;
}

// Products referencing this club have their club_id set to null by the foreign
// key (on delete set null), so deleting a club never deletes products.
export async function deleteClub(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
