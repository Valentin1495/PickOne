-- PickOne MVP Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- battles table
create table if not exists battles (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  creator_user_id text,
  title         text,
  invite_token  text        unique not null,
  image_a_url   text        not null,
  image_b_url   text        not null,
  is_active     boolean     default true
);

-- votes table (guest-friendly: voter_user_id is nullable)
create table if not exists votes (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  battle_id         uuid        references battles(id) on delete cascade,
  choice            text        not null check (choice in ('A', 'B')),
  voter_user_id     text,
  voter_fingerprint text        not null,
  invite_token      text,
  -- prevent duplicate votes from same device per battle
  unique (battle_id, voter_fingerprint)
);

-- indexes for fast lookups
create index if not exists battles_invite_token_idx on battles (invite_token);
create index if not exists votes_battle_id_idx      on votes  (battle_id);

-- Public read policy for battles (anyone with the token can view)
alter table battles enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'battles'
      and policyname = 'Public read battles'
  ) then
    create policy "Public read battles" on battles
      for select using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'battles'
      and policyname = 'Anon insert battles'
  ) then
    create policy "Anon insert battles" on battles
      for insert with check (true);
  end if;
end
$$;

-- Public read/write policy for votes (guest voting)
alter table votes enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'votes'
      and policyname = 'Public read votes'
  ) then
    create policy "Public read votes" on votes
      for select using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'votes'
      and policyname = 'Anon insert votes'
  ) then
    create policy "Anon insert votes" on votes
      for insert with check (true);
  end if;
end
$$;

-- vote_reasons table (선택형 투표 이유)
create table if not exists vote_reasons (
  id            uuid        primary key default gen_random_uuid(),
  vote_id       uuid        references votes(id) on delete cascade,
  battle_id     uuid        references battles(id) on delete cascade,
  selected_slot text        not null check (selected_slot in ('A', 'B')),
  reason_key    text        not null,
  created_at    timestamptz default now()
);

create index if not exists vote_reasons_battle_id_idx on vote_reasons (battle_id);

alter table vote_reasons enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vote_reasons'
      and policyname = 'Public read vote_reasons'
  ) then
    create policy "Public read vote_reasons" on vote_reasons
      for select using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vote_reasons'
      and policyname = 'Anon insert vote_reasons'
  ) then
    create policy "Anon insert vote_reasons" on vote_reasons
      for insert with check (true);
  end if;
end
$$;

-- vote_comments table (선택형 이유 + 선택적 한 줄 코멘트)
create table if not exists vote_comments (
  id               uuid        primary key default gen_random_uuid(),
  vote_id          uuid        references votes(id) on delete cascade,
  battle_id        uuid        references battles(id) on delete cascade,
  voter_fingerprint text       not null,
  comment_text     text        not null check (char_length(comment_text) between 2 and 80),
  is_hidden        boolean     not null default false,
  created_at       timestamptz default now()
);

create index if not exists vote_comments_battle_id_idx
  on vote_comments (battle_id, created_at desc);
create index if not exists vote_comments_fingerprint_idx
  on vote_comments (voter_fingerprint);

alter table vote_comments enable row level security;

-- No direct select/insert policies for vote_comments.
-- Access is mediated via SECURITY DEFINER RPC functions below.

create or replace function can_view_battle_comments(
  p_battle_id uuid,
  p_invite_token text,
  p_voter_fingerprint text
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1
      from battles b
      where b.id = p_battle_id
        and p_invite_token is not null
        and b.invite_token = p_invite_token
    )
    or exists (
      select 1
      from votes v
      where v.battle_id = p_battle_id
        and p_voter_fingerprint is not null
        and v.voter_fingerprint = p_voter_fingerprint
    );
$$;

create or replace function create_vote_comment(
  p_vote_id uuid,
  p_battle_id uuid,
  p_comment_text text,
  p_voter_fingerprint text,
  p_invite_token text default null
) returns vote_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_text text;
  v_row vote_comments;
  v_recent_count int;
begin
  if not can_view_battle_comments(p_battle_id, p_invite_token, p_voter_fingerprint) then
    raise exception 'NOT_ALLOWED';
  end if;

  v_text := regexp_replace(trim(coalesce(p_comment_text, '')), '\s+', ' ', 'g');

  if char_length(v_text) < 2 or char_length(v_text) > 80 then
    raise exception 'COMMENT_LENGTH_INVALID';
  end if;

  if v_text ~* '([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})'
     or v_text ~* '(https?://|www\.)'
     or v_text ~* '(\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4})' then
    raise exception 'COMMENT_BLOCKED_CONTENT';
  end if;

  if v_text ~* '(fuck|shit|bitch|개새|씨발|병신|좆)' then
    raise exception 'COMMENT_BLOCKED_CONTENT';
  end if;

  select count(*)
  into v_recent_count
  from vote_comments c
  where c.battle_id = p_battle_id
    and c.voter_fingerprint = p_voter_fingerprint
    and c.created_at > now() - interval '1 minute';

  if v_recent_count >= 3 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into vote_comments (
    vote_id,
    battle_id,
    voter_fingerprint,
    comment_text
  )
  values (
    p_vote_id,
    p_battle_id,
    p_voter_fingerprint,
    v_text
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function get_battle_comments_secure(
  p_battle_id uuid,
  p_invite_token text default null,
  p_voter_fingerprint text default null,
  p_limit int default 30
) returns table (
  id uuid,
  vote_id uuid,
  battle_id uuid,
  comment_text text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not can_view_battle_comments(p_battle_id, p_invite_token, p_voter_fingerprint) then
    raise exception 'NOT_ALLOWED';
  end if;

  return query
  select
    c.id,
    c.vote_id,
    c.battle_id,
    c.comment_text,
    c.created_at
  from vote_comments c
  where c.battle_id = p_battle_id
    and c.is_hidden = false
  order by c.created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
end;
$$;

grant execute on function can_view_battle_comments(uuid, text, text) to anon, authenticated;
grant execute on function create_vote_comment(uuid, uuid, text, text, text) to anon, authenticated;
grant execute on function get_battle_comments_secure(uuid, text, text, int) to anon, authenticated;

-- Storage bucket for battle images (run in Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public) values ('battle-images', 'battle-images', true);

-- Create the public storage bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('battle-images', 'battle-images', true)
on conflict (id) do update
set public = excluded.public;

-- Storage policies for battle images
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read battle images'
  ) then
    create policy "Public read battle images"
      on storage.objects
      for select
      using (bucket_id = 'battle-images');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon insert battle images'
  ) then
    create policy "Anon insert battle images"
      on storage.objects
      for insert
      with check (bucket_id = 'battle-images');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon update battle images'
  ) then
    create policy "Anon update battle images"
      on storage.objects
      for update
      using (bucket_id = 'battle-images')
      with check (bucket_id = 'battle-images');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anon delete battle images'
  ) then
    create policy "Anon delete battle images"
      on storage.objects
      for delete
      using (bucket_id = 'battle-images');
  end if;
end
$$;
