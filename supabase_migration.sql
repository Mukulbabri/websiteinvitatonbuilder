-- MULTI-TENANT SAAS DATABASE MIGRATION SCRIPT
-- Copy and run this script in your Supabase SQL Editor (SQL Editor > New Query) to upgrade the tables.

-- ============================================================
-- 1. Create templates table
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  default_data JSONB, -- Predefined default configurations/settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 2. Create websites table
-- ============================================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL, -- References auth.users(id) / profiles(id)
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  domain TEXT UNIQUE, -- Custom domain mapping e.g., rahulwedsneha.com
  subdomain TEXT UNIQUE, -- Subdomain prefix e.g., rahul
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'disabled'
  plan TEXT NOT NULL DEFAULT 'starter', -- 'starter', 'premium', or 'royal'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 3. Create profiles table (Public mirror for users management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Maps to auth.users.id
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client', -- 'admin' (Super Admin) or 'client' (Site Owner)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles table but disable it for initial simplicity, or set basic select policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Trigger to automatically mirror new signup users into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE 
      WHEN new.email = 'admin@wedding.com' THEN 'admin' 
      ELSE 'client' 
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles table for existing auth users if any
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 
  CASE WHEN email = 'admin@wedding.com' THEN 'admin' ELSE 'client' END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Alter existing tables to add site_id scoping columns
-- ============================================================
ALTER TABLE wedding_settings ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;
ALTER TABLE blessings ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES websites(id) ON DELETE CASCADE;

-- Disable Row Level Security (RLS) on new tables for connection simplicity
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE websites DISABLE ROW LEVEL SECURITY;

-- Migration checks: Ensure plan column exists in websites table
ALTER TABLE websites ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';

-- 5. Create plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
  plan_key TEXT PRIMARY KEY, -- 'starter', 'premium', 'royal'
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  gallery_limit INTEGER NOT NULL DEFAULT 5,
  enable_music BOOLEAN NOT NULL DEFAULT false,
  enable_watermark_removal BOOLEAN NOT NULL DEFAULT false,
  enable_custom_domain BOOLEAN NOT NULL DEFAULT false,
  enable_priority_support BOOLEAN NOT NULL DEFAULT false,
  enable_pdf_download BOOLEAN NOT NULL DEFAULT false,
  enable_multilang BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default plan features
INSERT INTO plan_features (plan_key, name, price, gallery_limit, enable_music, enable_watermark_removal, enable_custom_domain, enable_priority_support, enable_pdf_download, enable_multilang)
VALUES
  ('starter', 'Starter Plan', 0, 5, false, false, false, false, false, false),
  ('premium', 'Premium Invitation', 1499, 30, true, true, false, false, false, false),
  ('royal', 'Royal Elite', 3999, 9999, true, true, true, true, true, true)
ON CONFLICT (plan_key) DO NOTHING;

ALTER TABLE plan_features DISABLE ROW LEVEL SECURITY;
