create table analytics_events (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles on delete set null,
  event_name text not null,
  payload jsonb,
  url text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table analytics_events enable row level security;

-- Users can only insert their own events or anonymous events
create policy "Users can insert analytics events" 
on analytics_events for insert 
with check (
  auth.uid() = profile_id OR profile_id is null
);

-- Only admins/service roles can read events (implicitly handled as no select policy is given to users)
