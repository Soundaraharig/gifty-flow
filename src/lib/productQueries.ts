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

async function withSupabaseTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Database request timed out while loading ${label}. Please retry.`));
    }, QUERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function fetchActiveRows<T extends keyof Pick<
  TablesMap,
  "editing_styles" | "sizes" | "frame_materials" | "frame_colors" | "addons"
>>(table: T): Promise<TablesMap[T][]> {
  const { data, error } = await withSupabaseTimeout(
    supabase.from(table).select("*").eq("is_active", true).order("sort_order"),
    String(table),
  );

  if (error) throw error;
  return (data ?? []) as TablesMap[T][];
}

type TablesMap = {
  editing_styles: Tables<"editing_styles">;
  sizes: Tables<"sizes">;
  frame_materials: Tables<"frame_materials">;
  frame_colors: Tables<"frame_colors">;
  addons: Tables<"addons">;
};

export const fetchActiveEditingStyles = () => fetchActiveRows("editing_styles");
export const fetchActiveSizes = () => fetchActiveRows("sizes");
export const fetchActiveFrameMaterials = () => fetchActiveRows("frame_materials");
export const fetchActiveFrameColors = () => fetchActiveRows("frame_colors");
export const fetchActiveAddons = () => fetchActiveRows("addons");

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
