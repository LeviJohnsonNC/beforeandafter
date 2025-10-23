-- Create storage bucket for comparison images
INSERT INTO storage.buckets (id, name, public)
VALUES ('comparison-images', 'comparison-images', true);

-- Create RLS policies for comparison-images bucket
CREATE POLICY "Public can view comparison images"
ON storage.objects FOR SELECT
USING (bucket_id = 'comparison-images');

CREATE POLICY "Anyone can upload comparison images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comparison-images');

-- Create comparisons table
CREATE TABLE public.comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  branding_config JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view comparisons"
ON public.comparisons FOR SELECT
USING (true);

-- Allow anyone to create comparisons (can add auth later)
CREATE POLICY "Anyone can create comparisons"
ON public.comparisons FOR INSERT
WITH CHECK (true);

-- Allow incrementing view count
CREATE POLICY "Anyone can update view count"
ON public.comparisons FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_comparisons_created_at ON public.comparisons(created_at DESC);