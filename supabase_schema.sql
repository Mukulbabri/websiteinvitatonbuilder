-- SQL Schema for Wedding Website Tables
-- Copy and paste this script into your Supabase SQL Editor (SQL Editor > New Query) to create all required tables.

-- 1. Create wedding_settings table
CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name TEXT NOT NULL,
  wedding_date TIMESTAMP WITH TIME ZONE NOT NULL,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  theme_primary TEXT NOT NULL,
  theme_secondary TEXT NOT NULL,
  theme_background TEXT NOT NULL,
  font_heading TEXT NOT NULL,
  font_body TEXT NOT NULL,
  enable_leaves BOOLEAN NOT NULL DEFAULT true,
  enable_music BOOLEAN NOT NULL DEFAULT true,
  enable_animations BOOLEAN NOT NULL DEFAULT true,
  music_url TEXT NOT NULL,
  gate_video_url TEXT NOT NULL,
  hero_bg_url TEXT NOT NULL,
  caricature_url TEXT NOT NULL,
  intro_text TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  seo_og_image TEXT NOT NULL,
  
  -- Custom Traditional Card fields
  invite_line1 TEXT,
  invite_line1_font TEXT,
  invite_line1_size NUMERIC,
  invite_line1_offset NUMERIC,
  invite_line2 TEXT,
  invite_line2_font TEXT,
  invite_line2_size NUMERIC,
  invite_line2_offset NUMERIC,
  bride_name TEXT,
  bride_name_font TEXT,
  bride_name_size NUMERIC,
  bride_name_offset NUMERIC,
  bride_parents TEXT,
  bride_parents_font TEXT,
  bride_parents_size NUMERIC,
  bride_parents_offset NUMERIC,
  groom_name TEXT,
  groom_name_font TEXT,
  groom_name_size NUMERIC,
  groom_name_offset NUMERIC,
  groom_parents TEXT,
  groom_parents_font TEXT,
  groom_parents_size NUMERIC,
  groom_parents_offset NUMERIC,
  venue_label TEXT,
  venue_label_font TEXT,
  venue_label_size NUMERIC,
  venue_label_offset NUMERIC,
  blessing_note TEXT,
  blessing_note_font TEXT,
  blessing_note_size NUMERIC,
  blessing_note_offset NUMERIC,
  
  custom_font_base64 TEXT,
  custom_font_name TEXT,
  show_admin_btn BOOLEAN DEFAULT true,
  bg_color TEXT DEFAULT '#FAF6EA',
  card_color TEXT DEFAULT '#FEFAE0',
  primary_color TEXT DEFAULT '#B27F4C',
  text_color TEXT DEFAULT '#5c3a21',
  show_gate_video BOOLEAN DEFAULT true,
  
  -- Haldi Template
  haldi_name TEXT,
  haldi_message TEXT,
  haldi_date TEXT,
  haldi_time TEXT,
  haldi_venue TEXT,
  
  -- Mehndi Template
  mehndi_name TEXT,
  mehndi_message TEXT,
  mehndi_date TEXT,
  mehndi_time TEXT,
  mehndi_venue TEXT,
  
  -- Sangeet Template
  sangeet_name TEXT,
  sangeet_message TEXT,
  sangeet_date TEXT,
  sangeet_time TEXT,
  sangeet_venue TEXT,
  
  -- Wedding Template
  wedding_name TEXT,
  wedding_message TEXT,
  wedding_date_label TEXT,
  wedding_time TEXT,
  wedding_venue TEXT,
  
  -- Reception Template
  reception_name TEXT,
  reception_message TEXT,
  reception_date TEXT,
  reception_time TEXT,
  reception_venue TEXT,
  
  -- RSVP configuration
  rsvp_family TEXT,
  compliments_text TEXT,
  whatsapp_number TEXT,
  
  -- Card templates and bgs
  haldi_bg TEXT,
  mehndi_bg TEXT,
  sangeet_bg TEXT,
  wedding_bg TEXT,
  reception_bg TEXT,
  custom_events JSONB,
  
  -- Footer configs
  footer_phone TEXT,
  footer_email TEXT,
  footer_copyright TEXT,
  card_hero_bg_type TEXT DEFAULT 'image',
  card_hero_bg_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  google_map_link TEXT DEFAULT 'https://maps.google.com',
  background_image TEXT,
  caricature_image TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/3596/3596091.png',
  sort_order INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create rsvp table
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  attending BOOLEAN NOT NULL DEFAULT true,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create blessings table
CREATE TABLE IF NOT EXISTS blessings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device TEXT NOT NULL,
  country TEXT NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) on tables for initial connection simplicity:
ALTER TABLE wedding_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp DISABLE ROW LEVEL SECURITY;
ALTER TABLE blessings DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE BUCKET POLICIES FOR wedding-assets
-- Run this AFTER creating the 'wedding-assets' bucket in
-- Supabase Dashboard > Storage > New Bucket (set as Public)
-- ============================================================

-- Allow anyone (anon) to read/download files
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'wedding-assets' );

-- Allow anon and authenticated users to upload files
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'wedding-assets' );

-- Allow anon and authenticated users to update/overwrite files
CREATE POLICY "Allow public updates"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'wedding-assets' );

-- Allow anon and authenticated users to delete files
CREATE POLICY "Allow public deletes"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'wedding-assets' );

-- Migration checks: Ensure plan column exists in websites table
ALTER TABLE websites ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';

-- Create plan_features table
CREATE TABLE IF NOT EXISTS plan_features (
  plan_key TEXT PRIMARY KEY,
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

