-- Alter profiles table to add ar_credits column
ALTER TABLE public.profiles ADD COLUMN ar_credits INTEGER DEFAULT 0 NOT NULL;

-- Create credit_requests table
CREATE TABLE IF NOT EXISTS public.credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 50,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on credit_requests
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_requests
CREATE POLICY "Users can insert own credit requests" ON public.credit_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own credit requests" ON public.credit_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update credit requests" ON public.credit_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to protect ar_credits from manual non-admin edits
CREATE OR REPLACE FUNCTION public.protect_ar_credits_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ar_credits IS DISTINCT FROM OLD.ar_credits THEN
    -- Check if the current user is an admin
    IF NOT (public.has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Only administrators are allowed to modify AR credits.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_ar_credits_admin_only
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_ar_credits_update();

-- RPC Function to approve credit requests atomically
CREATE OR REPLACE FUNCTION public.approve_credit_request(target_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Verify that the caller is an admin
  IF NOT (public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only administrators are allowed to approve credit requests.';
  END IF;

  -- 2. Fetch user_id and lock the row to avoid concurrent race conditions
  SELECT user_id INTO v_user_id
  FROM public.credit_requests
  WHERE id = target_request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 3. Update request status
  UPDATE public.credit_requests
  SET status = 'approved'
  WHERE id = target_request_id;

  -- 4. Increment the user's credits in profiles table
  UPDATE public.profiles
  SET ar_credits = ar_credits + 1
  WHERE user_id = v_user_id;

  RETURN TRUE;
END;
$$;
