-- Single-photo Phase 1 (Expand): additive migration only
-- Safe to run before app code switches to single_reaction writes.

begin;

-- 1) Add battle mode.
alter table battles
  add column if not exists mode text not null default 'duel';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'battles_mode_check'
  ) then
    alter table battles
      add constraint battles_mode_check
      check (mode in ('duel', 'single_reaction'));
  end if;
end
$$;

-- 2) Add reaction field for single-photo mode votes.
alter table votes
  add column if not exists reaction text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'votes_reaction_check'
  ) then
    alter table votes
      add constraint votes_reaction_check
      check (reaction is null or reaction in ('LIKE', 'DISLIKE'));
  end if;
end
$$;

-- 3) Helpful index for reaction aggregation.
create index if not exists votes_battle_reaction_idx on votes (battle_id, reaction);

commit;
