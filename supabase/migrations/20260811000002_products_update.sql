alter table products add column slug text unique;
alter table products add column subtitle text;
alter table products add column long_description text;
alter table products add column image_url text;
alter table products add column theme_color text;
alter table products add column benefits jsonb default '[]'::jsonb;
alter table products add column target_audience text;
alter table products add column workload_hours integer;
alter table products add column instructor text;
alter table products add column access_model text; -- 'recurring', 'lifetime', etc
alter table products add column current_price integer; -- in cents
alter table products add column original_price integer; -- in cents
alter table products add column currency text default 'BRL';
alter table products add column cta_text text;
alter table products add column order_index integer default 0;
alter table products add column published_at timestamp with time zone;
alter table products add column terms_text text;

-- Update existing trigger or it's fine.
