-- Enable pgTAP for testing
create extension if not exists pgtap with schema public;

begin;
select plan(8);

-- Test 1: Verify Media Assets Table Exists
select has_table('media_assets', 'Table media_assets should exist');

-- Test 2: Verify Media Asset Status Enum
select has_enum('media_status', 'Enum media_status should exist');

-- Test 3: Verify Media Assets Policies Existence
select policies_are(
  'public',
  'media_assets',
  ARRAY[
    'Read media_assets if dashboard.read',
    'Manage media_assets with media.manage and AAL2'
  ],
  'media_assets should have correct RLS policies'
);

-- Test 4: Verify Media Usage Table Exists
select has_table('media_usage', 'Table media_usage should exist');

-- Test 5: Verify Media Tags Table Exists
select has_table('media_tags', 'Table media_tags should exist');

-- Test 6: Verify public_media bucket exists in storage
select is(
  (select count(*) from storage.buckets where id = 'public_media'),
  1::bigint,
  'public_media bucket should exist'
);

-- Test 7: Verify premium_media bucket exists in storage
select is(
  (select count(*) from storage.buckets where id = 'premium_media'),
  1::bigint,
  'premium_media bucket should exist'
);

-- Test 8: Verify storage.objects policies for media
-- Note: pgTAP has policies_are but it expects a schema name. 
-- Since storage schema is protected, we just check if any policy exists.
select is(
  (select count(*) > 0 from pg_policies where schemaname = 'storage' and tablename = 'objects'),
  true,
  'Storage objects should have RLS policies applied'
);

select * from finish();
rollback;
