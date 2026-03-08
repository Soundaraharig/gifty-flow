
CREATE TABLE public.style_gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  editing_style_id UUID NOT NULL REFERENCES public.editing_styles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.style_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active gallery images"
  ON public.style_gallery_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage gallery images"
  ON public.style_gallery_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
