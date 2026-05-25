import { useQuery } from "@tanstack/react-query";
import {
  fetchActiveAddons,
  fetchActiveEditingStyles,
  fetchActiveFrameColors,
  fetchActiveFrameMaterials,
  fetchActiveSizes,
  fetchEditingStylesWithGallery,
} from "@/lib/productQueries";

export const useEditingStyles = () =>
  useQuery({
    queryKey: ["editing_styles"],
    queryFn: fetchActiveEditingStyles,
  });

export const useEditingStylesWithGallery = () =>
  useQuery({
    queryKey: ["editing_styles_with_gallery"],
    queryFn: fetchEditingStylesWithGallery,
  });


export const useSizes = () =>
  useQuery({
    queryKey: ["sizes"],
    queryFn: fetchActiveSizes,
  });

export const useFrameMaterials = () =>
  useQuery({
    queryKey: ["frame_materials"],
    queryFn: fetchActiveFrameMaterials,
  });

export const useFrameColors = () =>
  useQuery({
    queryKey: ["frame_colors"],
    queryFn: fetchActiveFrameColors,
  });

export const useAddons = () =>
  useQuery({
    queryKey: ["addons"],
    queryFn: fetchActiveAddons,
  });
