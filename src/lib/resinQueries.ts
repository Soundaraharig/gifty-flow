import { supabase } from "@/integrations/supabase/client";

const QUERY_TIMEOUT_MS = 12000;

async function withTimeout<T>(query: PromiseLike<T>, label: string): Promise<T> {
  let h: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    h = setTimeout(() => reject(new Error(`Timeout loading ${label}`)), QUERY_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve(query), timeout]);
  } finally {
    if (h) clearTimeout(h);
  }
}

export interface ResinProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export async function fetchActiveResinTypes(): Promise<ResinProductType[]> {
  const { data, error } = await withTimeout(
    supabase.from("resin_product_types" as any).select("*").eq("is_active", true).order("sort_order"),
    "resin product types",
  );
  if (error) throw error;
  return (data ?? []) as unknown as ResinProductType[];
}
