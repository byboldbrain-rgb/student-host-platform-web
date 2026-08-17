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
      'student-activities',
      'community-posts'
    ]::text[]
  )
);

alter policy "Allow authenticated upload 1k7agta_0"
on storage.objects
with check (
  auth.role() = 'authenticated'
  and bucket_id = any (
    array[
      'property-images',
      'Brokers-images',
      'lost-items',
      'food-grocery',
      'doctor-photos',
      'student-activities',
      'community-posts'
    ]::text[]
  )
);

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
      'student-activities',
      'community-posts'
    ]::text[]
  )
);
