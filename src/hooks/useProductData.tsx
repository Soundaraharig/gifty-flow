import { useQuery } from "@tanstack/react-query";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function fetchTable(table: string, params: string = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${res.status}`);
  return res.json();
}

export const useEditingStyles = () =>
  useQuery({
    queryKey: ["editing_styles"],
    queryFn: () => fetchTable("editing_styles", "is_active=eq.true&select=*&order=sort_order"),
  });

export const useSizes = () =>
  useQuery({
    queryKey: ["sizes"],
    queryFn: () => fetchTable("sizes", "is_active=eq.true&select=*&order=sort_order"),
  });

export const useFrameMaterials = () =>
  useQuery({
    queryKey: ["frame_materials"],
    queryFn: () => fetchTable("frame_materials", "is_active=eq.true&select=*&order=sort_order"),
  });

export const useFrameColors = () =>
  useQuery({
    queryKey: ["frame_colors"],
    queryFn: () => fetchTable("frame_colors", "is_active=eq.true&select=*&order=sort_order"),
  });

export const useAddons = () =>
  useQuery({
    queryKey: ["addons"],
    queryFn: () => fetchTable("addons", "is_active=eq.true&select=*&order=sort_order"),
  });
