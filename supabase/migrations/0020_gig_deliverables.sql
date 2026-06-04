-- =====================================================================
-- Gig deliverables: how many videos, which platforms, and content type.
-- Captured when a brand posts a gig so creators know the scope up front.
-- Idempotent.
-- =====================================================================

alter table public.gigs
  add column if not exists video_quantity integer not null default 1,
  -- e.g. '["tiktok","instagram","youtube"]'
  add column if not exists platforms jsonb not null default '[]'::jsonb,
  -- e.g. 'product_demo' | 'tutorial' | 'unboxing' | 'lifestyle' | 'testimonial' | 'other'
  add column if not exists content_type text;
