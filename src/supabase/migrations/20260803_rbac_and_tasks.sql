-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'Member'
);

-- 2. Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- 3. Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'Member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create channel_tasks table
CREATE TABLE IF NOT EXISTS public.channel_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'pending',
  submitted_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security for channel_tasks
ALTER TABLE public.channel_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read on channel_tasks" ON public.channel_tasks;
CREATE POLICY "Allow authenticated read on channel_tasks" 
ON public.channel_tasks FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on channel_tasks" ON public.channel_tasks;
CREATE POLICY "Allow authenticated insert on channel_tasks" 
ON public.channel_tasks FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow EB role to update task status" ON public.channel_tasks;
CREATE POLICY "Allow EB role to update task status" 
ON public.channel_tasks FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'EB'
  )
);