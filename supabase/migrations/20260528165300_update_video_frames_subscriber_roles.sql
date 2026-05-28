-- Alter video_frames table to add created_by column
ALTER TABLE public.video_frames 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid();

-- Enable Row Level Security (redundant if already enabled, but safe)
ALTER TABLE public.video_frames ENABLE ROW LEVEL SECURITY;

-- Drop old policies to clear the namespace
DROP POLICY IF EXISTS "Everyone can view video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins can manage video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Everyone can view active video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Subscribers can insert own video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Subscribers can update own video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Subscribers can delete own video_frames" ON public.video_frames;

-- 1. Everyone (guests & authed users) can view all video frames
CREATE POLICY "Everyone can view video_frames" ON public.video_frames
  FOR SELECT USING (true);

-- 2. Allow Admins and Subscribers to insert entries
-- (Subscribers are restricted to checking that created_by is their own UID)
CREATE POLICY "Admins and Subscribers can insert video_frames" ON public.video_frames
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    (public.has_role(auth.uid(), 'subscriber'::public.app_role) AND (created_by = auth.uid()))
  );

-- 3. Allow Admins (all frames) and Subscribers (their own frames) to update entries
CREATE POLICY "Admins and Subscribers can update video_frames" ON public.video_frames
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    (public.has_role(auth.uid(), 'subscriber'::public.app_role) AND (created_by = auth.uid()))
  );

-- 4. Allow Admins (all frames) and Subscribers (their own frames) to delete entries
CREATE POLICY "Admins and Subscribers can delete video_frames" ON public.video_frames
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    (public.has_role(auth.uid(), 'subscriber'::public.app_role) AND (created_by = auth.uid()))
  );
