-- P0 phase 13: keep WhatsApp media private while preserving existing UI contracts.
-- Apply only after `/api/admin/whatsapp/media` is deployed to production.

create or replace function public.normalize_private_whatsapp_media_url()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.media_storage_path is not null and btrim(new.media_storage_path) <> '' then
    new.media_url := '/api/admin/whatsapp/media?path=' || new.media_storage_path;
  end if;

  return new;
end;
$$;

revoke all on function public.normalize_private_whatsapp_media_url() from public, anon, authenticated;
grant execute on function public.normalize_private_whatsapp_media_url() to service_role;

drop trigger if exists normalize_private_whatsapp_media_url_before_write
  on public.whatsapp_messages;

create trigger normalize_private_whatsapp_media_url_before_write
before insert or update of media_storage_path, media_url
on public.whatsapp_messages
for each row
execute function public.normalize_private_whatsapp_media_url();

update public.whatsapp_messages
set media_url = '/api/admin/whatsapp/media?path=' || media_storage_path
where media_storage_path is not null
  and btrim(media_storage_path) <> '';
