-- ============================================================
-- DGBag: Full Database Migration
-- Run this in the Supabase SQL Editor (single execution)
-- ============================================================

-- ==================
-- 1. TABLES
-- ==================

-- profiles: one row per auth user
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  pdga_number text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- bags: each user has exactly one bag
create table public.bags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  created_at timestamptz default now() not null
);

-- bag_discs: discs placed into bag slots
create table public.bag_discs (
  id uuid default gen_random_uuid() primary key,
  bag_id uuid references public.bags on delete cascade not null,
  slot_index integer not null,
  disc_id text,
  photo text,
  plastic text,
  color text,
  shop_link text,
  unique (bag_id, slot_index)
);

-- events: analytics (insert-only from clients)
create table public.events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  user_id uuid references auth.users on delete set null,
  page_path text,
  referrer text,
  bag_owner_id uuid,
  disc_id text,
  shop_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);


-- ==================
-- 2. INDEXES
-- ==================

create index idx_bags_user_id on public.bags (user_id);
create index idx_bag_discs_bag_id on public.bag_discs (bag_id);
create index idx_events_created_at on public.events (created_at);
create index idx_events_event_type on public.events (event_type);


-- ==================
-- 3. ENABLE ROW LEVEL SECURITY
-- ==================

alter table public.profiles enable row level security;
alter table public.bags enable row level security;
alter table public.bag_discs enable row level security;
alter table public.events enable row level security;


-- ==================
-- 4. RLS POLICIES
-- ==================

-- profiles: anyone can read, owner can update/insert
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- bags: anyone can read, owner can CRUD
create policy "Bags are viewable by everyone"
  on public.bags for select
  using (true);

create policy "Users can insert own bag"
  on public.bags for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bag"
  on public.bags for update
  using (auth.uid() = user_id);

create policy "Users can delete own bag"
  on public.bags for delete
  using (auth.uid() = user_id);

-- bag_discs: anyone can read, owner can CRUD (via bag ownership)
create policy "Bag discs are viewable by everyone"
  on public.bag_discs for select
  using (true);

create policy "Users can insert discs into own bag"
  on public.bag_discs for insert
  with check (
    bag_id in (select id from public.bags where user_id = auth.uid())
  );

create policy "Users can update discs in own bag"
  on public.bag_discs for update
  using (
    bag_id in (select id from public.bags where user_id = auth.uid())
  );

create policy "Users can delete discs from own bag"
  on public.bag_discs for delete
  using (
    bag_id in (select id from public.bags where user_id = auth.uid())
  );

-- events: anyone can insert, no client reads
create policy "Anyone can insert events"
  on public.events for insert
  with check (true);


-- ==================
-- 5. TRIGGER: auto-update updated_at on profiles
-- ==================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();


-- ==================
-- 6. TRIGGER: auto-create profile + bag on signup
-- ==================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile (pulls name/avatar from OAuth metadata if available)
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      null
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      null
    )
  );

  -- Create empty bag
  insert into public.bags (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ==================
-- 7. STORAGE: avatars bucket
-- ==================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Anyone can view avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload to their own folder ({userId}/avatar.ext)
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can overwrite their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
