import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEditingStyles = () =>
  useQuery({
    queryKey: ["editing_styles"],
    queryFn: async () => {
      console.log("[useEditingStyles] queryFn called, supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      try {
        const { data, error } = await supabase
          .from("editing_styles")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        console.log("[useEditingStyles] result:", { data, error });
        if (error) throw error;
        return data;
      } catch (e) {
        console.error("[useEditingStyles] exception:", e);
        throw e;
      }
    },
  });

export const useSizes = () =>
  useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sizes")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

export const useFrameMaterials = () =>
  useQuery({
    queryKey: ["frame_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frame_materials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

export const useFrameColors = () =>
  useQuery({
    queryKey: ["frame_colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frame_colors")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

export const useAddons = () =>
  useQuery({
    queryKey: ["addons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addons")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
