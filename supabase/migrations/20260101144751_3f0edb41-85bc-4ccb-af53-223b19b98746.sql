-- Add province, city, district columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add province, city, district columns to items table
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Update handle_new_user function to include new location fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, location, province, city, district)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Jakarta'),
    NEW.raw_user_meta_data->>'province',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  PERFORM public.create_dummy_items_for_user(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Add message_type column to messages table for card-based messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.items(id);

-- Enable realtime for messages table 
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;