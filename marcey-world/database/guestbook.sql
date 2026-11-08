-- Run this once in Supabase: SQL Editor > New query > paste > Run

create table guestbook (
    id bigint generated always as identity primary key,
    name text not null check (char_length(name) between 1 and 40),
    message text not null check (char_length(message) between 1 and 500),
    created_at timestamptz not null default now()
);

-- Lock the table so only the site's server function can use it
alter table guestbook enable row level security;
