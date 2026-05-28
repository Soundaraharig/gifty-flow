-- Alter video_frames table to add photo_url column for dynamic combined multi-target compilation
ALTER TABLE public.video_frames ADD COLUMN IF NOT EXISTS photo_url TEXT;
NOTIFY pgrst, 'reload schema';
