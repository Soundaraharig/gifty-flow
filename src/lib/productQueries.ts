import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface CheckoutConfig {
  editingStyleId: string | null;
  sizeId: string | null;
  frameMaterialId: string | null;
  frameColorId: string | null;
  addonIds: string[];
}

export interface CheckoutSummary {
  total: number;
  styleName: string;
  stylePrice: number;
  sizeName: string;
  sizePrice: number;
  materialName: string;
  colorName: string;
}

const QUERY_TIMEOUT_MS = 12000;

async function withSupabaseTimeout<T>(query: PromiseLike<T>, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Database request timed out while loading ${label}. Please retry.`));
    }, QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([Promise.resolve(query), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export async function fetchActiveEditingStyles(): Promise<Tables<"editing_styles">[]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("editing_styles").select("*").eq("is_active", true).order("sort_order"),
    "editing styles",
  );

  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveSizes(): Promise<Tables<"sizes">[]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("sizes").select("*").eq("is_active", true).order("sort_order"),
    "sizes",
  );

  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveFrameMaterials(): Promise<Tables<"frame_materials">[]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("frame_materials").select("*").eq("is_active", true).order("sort_order"),
    "frame materials",
  );

  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveFrameColors(): Promise<Tables<"frame_colors">[]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("frame_colors").select("*").eq("is_active", true).order("sort_order"),
    "frame colors",
  );

  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveAddons(): Promise<Tables<"addons">[]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("addons").select("*").eq("is_active", true).order("sort_order"),
    "add-ons",
  );

  if (error) throw error;
  return data ?? [];
}

async function fetchStyleById(id: string) {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("editing_styles").select("name,price").eq("id", id).maybeSingle(),
    "editing style",
  );
  if (error) throw error;
  return data;
}

async function fetchSizeById(id: string) {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("sizes").select("name,price").eq("id", id).maybeSingle(),
    "size",
  );
  if (error) throw error;
  return data;
}

async function fetchMaterialById(id: string) {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("frame_materials").select("name,price").eq("id", id).maybeSingle(),
    "frame material",
  );
  if (error) throw error;
  return data;
}

async function fetchColorById(id: string) {
  const { data, error } = await withSupabaseTimeout(
    supabase.from("frame_colors").select("name").eq("id", id).maybeSingle(),
    "frame color",
  );
  if (error) throw error;
  return data;
}

async function fetchAddonsByIds(ids: string[]) {
  if (ids.length === 0) return [] as Pick<Tables<"addons">, "price">[];

  const { data, error } = await withSupabaseTimeout(
    supabase.from("addons").select("price").in("id", ids),
    "add-ons",
  );

  if (error) throw error;
  return (data ?? []) as Pick<Tables<"addons">, "price">[];
}

export async function fetchCheckoutSummary(config: CheckoutConfig): Promise<CheckoutSummary> {
  const [style, size, material, color, addons] = await Promise.all([
    config.editingStyleId ? fetchStyleById(config.editingStyleId) : Promise.resolve(null),
    config.sizeId ? fetchSizeById(config.sizeId) : Promise.resolve(null),
    config.frameMaterialId ? fetchMaterialById(config.frameMaterialId) : Promise.resolve(null),
    config.frameColorId ? fetchColorById(config.frameColorId) : Promise.resolve(null),
    fetchAddonsByIds(config.addonIds),
  ]);

  const stylePrice = style?.price ?? 0;
  const sizePrice = size?.price ?? 0;
  const materialPrice = material?.price ?? 0;
  const addonTotal = addons.reduce((acc, addon) => acc + (addon.price ?? 0), 0);

  return {
    total: stylePrice + sizePrice + materialPrice + addonTotal,
    styleName: style?.name ?? "N/A",
    stylePrice,
    sizeName: size?.name ?? "N/A",
    sizePrice,
    materialName: material?.name ?? "N/A",
    colorName: color?.name ?? "N/A",
  };
}

export async function fetchCheckoutTotal(config: CheckoutConfig): Promise<number> {
  const summary = await fetchCheckoutSummary(config);
  return summary.total;
}
