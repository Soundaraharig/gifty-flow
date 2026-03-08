ALTER TABLE public.frame_materials
  ADD COLUMN image_url text,
  ADD COLUMN stock integer NOT NULL DEFAULT 10;