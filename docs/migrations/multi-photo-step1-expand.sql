-- Step 1 (Expand): additive migration only
-- Safe to run before app code fully switches to multi-photo model.

begin;

-- 1) Add new table for variable number of images per battle.
create table if not exists battle_images (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  position int not null check (position >= 0),
  image_url text not null,
  created_at timestamptz default now(),
  unique (battle_id, position)
);

create index if not exists battle_images_battle_id_idx on battle_images (battle_id);

-- 2) Add index-based vote column (keep legacy choice column for compatibility).
alter table votes add column if not exists choice_index int;

update votes
set choice_index = case
  when choice = 'A' then 0
  when choice = 'B' then 1
  else null
end
where choice_index is null;

-- 3) Add index-based reason target column (keep selected_slot for compatibility).
alter table vote_reasons add column if not exists selected_index int;

update vote_reasons
set selected_index = case
  when selected_slot = 'A' then 0
  when selected_slot = 'B' then 1
  else null
end
where selected_index is null;

-- 4) Optional bootstrap for legacy battles:
-- Insert existing A/B URLs into battle_images if missing.
insert into battle_images (battle_id, position, image_url)
select b.id, x.position, x.image_url
from battles b
cross join lateral (
  values
    (0, b.image_a_url),
    (1, b.image_b_url)
) as x(position, image_url)
where x.image_url is not null
  and not exists (
    select 1
    from battle_images bi
    where bi.battle_id = b.id
      and bi.position = x.position
  );

commit;
