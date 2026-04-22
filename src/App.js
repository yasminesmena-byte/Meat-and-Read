create table members (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  password text not null,
  avatar text default '🌸',
  genres text[] default '{}',
  is_admin boolean default false,
  bio text default '',
  profile_pic text,
  joined_at timestamptz default now()
);

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text,
  cover text default '📗'
);

create table shelves (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  shelf text not null,
  rating int,
  review text
);

create table nominees (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  nominated_by uuid references members(id)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  nominee_id uuid references nominees(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  unique(member_id)
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  date date not null,
  time text not null,
  notes text,
  image_url text,
  rsvps uuid[] default '{}'
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  text text,
  image_url text,
  gif_url text,
  created_at timestamptz default now()
);

create table feed (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  text text not null,
  created_at timestamptz default now()
);

alter table members enable row level security;
alter table books enable row level security;
alter table shelves enable row level security;
alter table nominees enable row level security;
alter table votes enable row level security;
alter table meetings enable row level security;
alter table chat_messages enable row level security;
alter table feed enable row level security;

create policy "allow all" on members for all using (true) with check (true);
create policy "allow all" on books for all using (true) with check (true);
create policy "allow all" on shelves for all using (true) with check (true);
create policy "allow all" on nominees for all using (true) with check (true);
create policy "allow all" on votes for all using (true) with check (true);
create policy "allow all" on meetings for all using (true) with check (true);
create policy "allow all" on chat_messages for all using (true) with check (true);
create policy "allow all" on feed for all using (true) with check (true);
