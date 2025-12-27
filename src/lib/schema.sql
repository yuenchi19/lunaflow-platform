-- USERS PROFILE
-- Extends the default auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text default 'student' check (role in ('student', 'admin', 'staff', 'accounting')),
  plan text default 'light' check (plan in ('light', 'standard', 'premium')),
  phone_number text,
  address text,
  zip_code text,
  community_nickname text,
  avatar_url text,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- TRIGGER to auto-create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'student', 'light');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- PROGRESS TRACKING
create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id text not null,
  category_id text not null,
  block_id text not null,
  status text default 'completed' check (status in ('completed', 'viewed')),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on public.user_progress
  for insert with check (auth.uid() = user_id);


-- PURCHASES / SUBSCRIPTIONS
create table public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_session_id text,
  amount integer not null,
  currency text default 'jpy',
  status text default 'succeeded',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.purchases enable row level security;

create policy "Users can view own purchases" on public.purchases
  for select using (auth.uid() = user_id);

-- Only service role can insert purchases (via webhook)
create policy "Service role can insert purchases" on public.purchases
  for insert with check (true);
