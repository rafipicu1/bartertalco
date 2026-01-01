CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: item_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_category AS ENUM (
    'electronics',
    'fashion',
    'home',
    'sports',
    'books',
    'gaming',
    'music',
    'art',
    'other',
    'elektronik',
    'kendaraan',
    'properti',
    'hobi_koleksi',
    'olahraga',
    'musik',
    'makanan_minuman',
    'kesehatan_kecantikan',
    'perlengkapan_rumah',
    'mainan_anak',
    'kantor_industri'
);


--
-- Name: item_condition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_condition AS ENUM (
    'new',
    'like_new',
    'good',
    'fair',
    'worn'
);


--
-- Name: calculate_distance(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  r NUMERIC := 6371; -- Earth's radius in kilometers
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$;


--
-- Name: check_for_match(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_for_match() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  item_owner_id UUID;
  match_swipe RECORD;
BEGIN
  -- Only process right swipes
  IF NEW.direction = 'right' AND NEW.user_item_id IS NOT NULL THEN
    -- Get the owner of the swiped item
    SELECT user_id INTO item_owner_id
    FROM public.items
    WHERE id = NEW.item_id;
    
    -- Check if item owner has swiped right on the swiper's item
    SELECT s.id, s.user_item_id INTO match_swipe
    FROM public.swipes s
    WHERE s.swiper_id = item_owner_id
      AND s.item_id = NEW.user_item_id
      AND s.direction = 'right'
      AND s.user_item_id IS NOT NULL
    LIMIT 1;
    
    -- Create match if mutual interest exists between specific items
    IF match_swipe.id IS NOT NULL THEN
      INSERT INTO public.matches (user1_id, user2_id, item1_id, item2_id)
      VALUES (
        LEAST(NEW.swiper_id, item_owner_id),
        GREATEST(NEW.swiper_id, item_owner_id),
        CASE WHEN NEW.swiper_id < item_owner_id THEN NEW.user_item_id ELSE NEW.item_id END,
        CASE WHEN NEW.swiper_id < item_owner_id THEN NEW.item_id ELSE NEW.user_item_id END
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_dummy_items_for_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_dummy_items_for_user(target_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_location TEXT;
BEGIN
  -- Get user location
  SELECT location INTO user_location FROM public.profiles WHERE id = target_user_id;
  
  IF user_location IS NULL THEN
    user_location := 'Jakarta';
  END IF;

  -- Insert 3-5 random items for this user
  INSERT INTO public.items (user_id, name, description, detailed_minus, photos, category, estimated_value, barter_preference, top_up_value, condition, location, is_active)
  VALUES
    -- Item 1: Electronics
    (target_user_id, 
     'iPhone 14 Pro Max', 
     'iPhone 14 Pro Max 256GB space black. Masih garansi resmi sampai 6 bulan lagi. Lengkap box, charger, kabel.', 
     'Ada baret kecil di frame samping kiri, layar masih mulus pakai screen protector dari awal', 
     ARRAY['https://images.unsplash.com/photo-1678652197950-82b0ad5b9c26?w=800', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800', 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800'],
     'electronics', 
     14500000, 
     'Laptop gaming atau MacBook', 
     0, 
     'like_new', 
     user_location, 
     true),
     
    -- Item 2: Fashion
    (target_user_id,
     'Nike Air Jordan 1 Retro',
     'Sepatu Nike Air Jordan 1 ukuran 42, warna hitam putih. Masih kinclong, jarang dipake. Original 100%.',
     'Box agak penyok, tapi sepatu perfect condition. Insole masih tebal.',
     ARRAY['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
     'fashion',
     3200000,
     'Sneakers lain atau jaket branded',
     200000,
     'like_new',
     user_location,
     true),
     
    -- Item 3: Gaming
    (target_user_id,
     'PlayStation 5 + 2 Controllers',
     'PS5 Digital Edition lengkap dengan 2 controller. Main jarang, mulus. Include game God of War Ragnarok.',
     'Thumbstick controller kanan agak kendor, tapi masih work normal',
     ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800', 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800'],
     'gaming',
     7500000,
     'Gaming laptop atau monitor gaming',
     500000,
     'good',
     user_location,
     true),
     
    -- Item 4: Electronics (gadget)
    (target_user_id,
     'iPad Pro 11" M1 2021',
     'iPad Pro 11 inch M1 chip, 128GB wifi only. Lengkap Apple Pencil gen 2 dan Magic Keyboard.',
     'Ada goresan halus di belakang, layar perfect. Battery health 95%',
     ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800'],
     'electronics',
     9500000,
     'Laptop atau kamera mirrorless',
     0,
     'good',
     user_location,
     true);
     
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, username, full_name, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Jakarta')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Auto-generate dummy items for new user (for testing)
  -- Remove this in production!
  PERFORM public.create_dummy_items_for_user(NEW.id);
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: setup_test_environment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_test_environment() RETURNS TABLE(message text, details text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY SELECT 
    'Test Environment Setup'::TEXT as message,
    'Please sign up the following test accounts manually via /auth:
    
    1. Email: andi@test.com, Pass: Test1234, Username: andi_tech, Location: Jakarta Selatan
    2. Email: bella@test.com, Pass: Test1234, Username: bella_style, Location: Bandung  
    3. Email: chris@test.com, Pass: Test1234, Username: chris_music, Location: Jakarta Pusat
    4. Email: dina@test.com, Pass: Test1234, Username: dina_books, Location: Surabaya
    
    After signup, items will be auto-generated!'::TEXT as details;
END;
$$;


--
-- Name: simulate_swipes_between_users(uuid, uuid, double precision); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.simulate_swipes_between_users(user1_id uuid, user2_id uuid, match_probability double precision DEFAULT 0.3) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  item RECORD;
  random_val FLOAT;
BEGIN
  -- User 1 swipes on User 2's items
  FOR item IN 
    SELECT id FROM public.items 
    WHERE user_id = user2_id AND is_active = true
    LIMIT 3
  LOOP
    random_val := random();
    INSERT INTO public.swipes (swiper_id, item_id, direction)
    VALUES (
      user1_id, 
      item.id, 
      CASE WHEN random_val < match_probability THEN 'right' ELSE 'left' END
    )
    ON CONFLICT (swiper_id, item_id) DO NOTHING;
  END LOOP;
  
  -- User 2 swipes on User 1's items  
  FOR item IN 
    SELECT id FROM public.items 
    WHERE user_id = user1_id AND is_active = true
    LIMIT 3
  LOOP
    random_val := random();
    INSERT INTO public.swipes (swiper_id, item_id, direction)
    VALUES (
      user2_id, 
      item.id, 
      CASE WHEN random_val < match_probability THEN 'right' ELSE 'left' END
    )
    ON CONFLICT (swiper_id, item_id) DO NOTHING;
  END LOOP;
END;
$$;


--
-- Name: update_conversation_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversation_timestamp() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    item1_id uuid,
    item2_id uuid,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    detailed_minus text NOT NULL,
    photos text[] DEFAULT '{}'::text[] NOT NULL,
    category public.item_category NOT NULL,
    estimated_value numeric(12,2) NOT NULL,
    barter_preference text NOT NULL,
    top_up_value numeric(12,2) DEFAULT 0,
    condition public.item_condition NOT NULL,
    location text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_active boolean DEFAULT true,
    is_paid boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user1_id uuid NOT NULL,
    user2_id uuid NOT NULL,
    item1_id uuid NOT NULL,
    item2_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT matches_check CHECK ((user1_id < user2_id))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    full_name text,
    bio text,
    profile_photo_url text,
    location text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: swipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    swiper_id uuid NOT NULL,
    item_id uuid NOT NULL,
    direction text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    user_item_id uuid,
    CONSTRAINT swipes_direction_check CHECK ((direction = ANY (ARRAY['left'::text, 'right'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    item_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_user1_id_user2_id_item1_id_item2_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_user2_id_item1_id_item2_id_key UNIQUE (user1_id, user2_id, item1_id, item2_id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: swipes swipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_pkey PRIMARY KEY (id);


--
-- Name: swipes swipes_swiper_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiper_id_item_id_key UNIQUE (swiper_id, item_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_user_id_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_item_id_key UNIQUE (user_id, item_id);


--
-- Name: idx_conversations_last_message; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_last_message ON public.conversations USING btree (last_message_at DESC);


--
-- Name: idx_conversations_users; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_users ON public.conversations USING btree (user1_id, user2_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: swipes on_swipe_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_swipe_created AFTER INSERT ON public.swipes FOR EACH ROW EXECUTE FUNCTION public.check_for_match();


--
-- Name: messages update_conversation_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversation_timestamp AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();


--
-- Name: items update_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: conversations conversations_item1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_item1_id_fkey FOREIGN KEY (item1_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_item2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_item2_id_fkey FOREIGN KEY (item2_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: matches matches_item1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_item1_id_fkey FOREIGN KEY (item1_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: matches matches_item2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_item2_id_fkey FOREIGN KEY (item2_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: matches matches_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: matches matches_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: swipes swipes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: swipes swipes_swiper_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_swiper_id_fkey FOREIGN KEY (swiper_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: swipes swipes_user_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swipes
    ADD CONSTRAINT swipes_user_item_id_fkey FOREIGN KEY (user_item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: items Items are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING ((is_active = true));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: wishlist Users can add to their wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their wishlist" ON public.wishlist FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: items Users can create their own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own items" ON public.items FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: swipes Users can create their own swipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own swipes" ON public.swipes FOR INSERT WITH CHECK ((auth.uid() = swiper_id));


--
-- Name: items Users can delete their own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own items" ON public.items FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: wishlist Users can remove from their wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove from their wishlist" ON public.wishlist FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: messages Users can send messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.user1_id = auth.uid()) OR (conversations.user2_id = auth.uid())))))));


--
-- Name: conversations Users can update their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: items Users can update their own items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own items" ON public.items FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING ((sender_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations
  WHERE ((conversations.id = messages.conversation_id) AND ((conversations.user1_id = auth.uid()) OR (conversations.user2_id = auth.uid()))))));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: matches Users can view their own matches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own matches" ON public.matches FOR SELECT USING (((auth.uid() = user1_id) OR (auth.uid() = user2_id)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: swipes Users can view their own swipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own swipes" ON public.swipes FOR SELECT USING ((auth.uid() = swiper_id));


--
-- Name: wishlist Users can view their own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- Name: matches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: swipes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;