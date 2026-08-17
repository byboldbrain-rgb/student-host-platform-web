-- P0 phase 12: restrict legacy generic Storage policies to explicitly public media buckets
-- and make sensitive receipt / messaging buckets private.
-- Applied to production on 2026-08-17 via migration `isolate_sensitive_storage_buckets_p0`.

update storage.buckets
set public = false
where id in ('wallet-receipts', 'receipts', 'whatsapp-media');

alter policy "read 1k7agta_0"
on storage.objects
using (
  bucket_id = any (
    array[
      'property-images',
      'Brokers-images',
      'lost-items',
      'food-grocery',
      'doctor-photos',
      'community-posts',
      'property-videos',
      'property-owner-documents',
      'home-banners',
      'service-provider-images',
      'career-assets',
      'student-activity-assets',
      'coworking-images',
      'now-home-banners'
    ]::text[]
  )
);

-- Keep legacy generic client uploads constrained to the same public-media allowlist.
-- The exact policy names are retained for compatibility with the existing project.
alter policy "upload 1k7agta_0"
on storage.objects
with check (
  bucket_id = any (
    array[
      'property-images',
      'Brokers-images',
      'lost-items',
      'food-grocery',
      'doctor-photos',
      'community-posts',
      'property-videos',
      'property-owner-documents',
      'home-banners',
      'service-provider-images',
      'career-assets',
      'student-activity-assets',
      'coworking-images',
      'now-home-banners'
    ]::text[]
  )
);
