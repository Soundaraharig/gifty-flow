-- Create video_frames table
CREATE TABLE IF NOT EXISTS public.video_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_name TEXT NOT NULL,
  target_mind_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_frames ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Everyone can view video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins can manage video_frames" ON public.video_frames;

-- Create SELECT policy allowing public read access
CREATE POLICY "Everyone can view video_frames" ON public.video_frames
  FOR SELECT USING (true);

-- Create INSERT/UPDATE/DELETE policies restricting strictly to admin role
CREATE POLICY "Admins can manage video_frames" ON public.video_frames
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );
