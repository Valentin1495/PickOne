-- Step 2 (Contract): run only after app reads/writes are fully migrated.
-- Preconditions:
-- - App writes votes.choice_index and vote_reasons.selected_index only
-- - App reads battle_images for all battle image rendering
-- - Historical backfill validated

begin;

-- 1) Enforce new required columns.
alter table votes
  alter column choice_index set not null;

alter table vote_reasons
  alter column selected_index set not null;

-- 2) Remove legacy A/B specific columns.
alter table votes
  drop column if exists choice;

alter table vote_reasons
  drop column if exists selected_slot;

alter table battles
  drop column if exists image_a_url,
  drop column if exists image_b_url;

commit;
