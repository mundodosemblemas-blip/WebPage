-- Migration 004 — normalise products.type.
--
-- Category filtering compares products.type to a fixed set of lowercase,
-- unaccented values ('pin', 'emblema', 'cinto', 'insignia', 'outro'). A row
-- stored as 'Insignia' therefore matched no category at all and was invisible
-- in the Insígnias filter, even though it appeared in the full catalog.
--
-- The application also normalises on read, so this migration is about keeping
-- the stored data honest rather than about making the site work.
--
-- Safe to run at any time, before or after deploying. Idempotent.

-- Trim, lowercase and strip accents so 'Insígnia ' and 'Insignia' converge.
update public.products
   set type = translate(
         lower(btrim(type)),
         'áàâãäéèêëíìîïóòôõöúùûüç',
         'aaaaaeeeeiiiiooooouuuuc'
       )
 where type is distinct from translate(
         lower(btrim(type)),
         'áàâãäéèêëíìîïóòôõöúùûüç',
         'aaaaaeeeeiiiiooooouuuuc'
       );

-- Fold the obvious plurals and variants onto the canonical values.
update public.products set type = 'insignia' where type in ('insignias', 'insigna');
update public.products set type = 'emblema'  where type in ('emblemas');
update public.products set type = 'cinto'    where type in ('cintos');
update public.products set type = 'pin'      where type in ('pins', 'pino', 'pinos');

-- Anything still unrecognised becomes 'outro' rather than staying unreachable.
update public.products
   set type = 'outro'
 where type not in ('pin', 'emblema', 'cinto', 'insignia', 'outro');

-- Keep it that way. The admin form only ever submits these five values.
alter table public.products drop constraint if exists products_type_check;
alter table public.products add constraint products_type_check
  check (type in ('pin', 'emblema', 'cinto', 'insignia', 'outro'));

-- Check afterwards with:
--   select type, count(*) from public.products group by type order by 2 desc;
