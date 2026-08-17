-- Serialize cover-image writes per property so concurrent admin saves cannot
-- violate the one-cover partial unique index.
-- Applied to production on 2026-08-17 via migration
-- `serialize_property_cover_image_updates_p0`.

create or replace function public.serialize_property_cover_image_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_cover is not true then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.property_id_ref::text, 0)
  );

  update public.property_images
     set is_cover = false
   where property_id_ref = new.property_id_ref
     and is_cover = true
     and id <> new.id;

  return new;
end;
$$;

revoke all on function public.serialize_property_cover_image_write()
  from public, anon, authenticated;
grant execute on function public.serialize_property_cover_image_write()
  to service_role;

drop trigger if exists serialize_property_cover_image_before_write
  on public.property_images;

create trigger serialize_property_cover_image_before_write
before insert or update of is_cover, property_id_ref
on public.property_images
for each row
when (new.is_cover = true)
execute function public.serialize_property_cover_image_write();
