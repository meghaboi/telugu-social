create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  city text not null,
  age_range text,
  bio text default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.forums (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.forums(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1500),
  is_hidden boolean not null default false,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 600),
  is_hidden boolean not null default false,
  report_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😂', '👀', '💀', '❤️')),
  created_at timestamptz not null default now(),
  constraint reaction_target_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  ),
  unique (user_id, post_id, emoji),
  unique (user_id, comment_id, emoji)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint report_target_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.auto_hide_reported_content()
returns trigger
language plpgsql
as $$
begin
  if new.post_id is not null then
    update public.posts
    set report_count = report_count + 1,
        is_hidden = (report_count + 1) >= 3
    where id = new.post_id;
  elsif new.comment_id is not null then
    update public.comments
    set report_count = report_count + 1,
        is_hidden = (report_count + 1) >= 3
    where id = new.comment_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_hide_reported_content on public.reports;
create trigger trg_auto_hide_reported_content
after insert on public.reports
for each row
execute function public.auto_hide_reported_content();

insert into public.forums (category, name)
values
  ('Culture', 'Movies & OTT'),
  ('Culture', 'Music & Pop Culture'),
  ('Culture', 'Memes & Internet Culture'),
  ('Life', 'College Life'),
  ('Life', 'Careers & Tech'),
  ('Life', 'Dating & Relationships'),
  ('City Spaces', 'Hyderabad'),
  ('City Spaces', 'Bangalore'),
  ('City Spaces', 'Vizag'),
  ('City Spaces', 'Chennai'),
  ('City Spaces', 'Pune'),
  ('City Spaces', 'NRIs')
on conflict (name) do nothing;
