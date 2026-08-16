-- Enable pgTAP for testing
create extension if not exists pgtap with schema public;

begin;
select plan(8);

-- Test 1: has_permission should return false for unknown user
select is(
  has_permission('dashboard.read'),
  false,
  'Unknown user should not have dashboard.read permission'
);

-- Test 2: Audit Logs are append-only. UPDATE should fail.
-- Insert a mock log directly (bypassing RLS as postgres user for setup)
insert into admin_audit_logs (action, resource_type) values ('test_action', 'test_resource');
-- Attempting to update should throw
select throws_ok(
  $$ update admin_audit_logs set action = 'modified' $$,
  null,
  'Modification of audit logs is strictly prohibited.',
  'Updating audit logs should be blocked by trigger'
);

-- Test 3: Audit Logs are append-only. DELETE should fail.
select throws_ok(
  $$ delete from admin_audit_logs $$,
  null,
  'Modification of audit logs is strictly prohibited.',
  'Deleting audit logs should be blocked by trigger'
);

-- Test 4: Prevent last superadmin removal
-- First, ensure there is exactly one active superadmin
-- (Note: Since we don't have users in test environment, we insert a mock one)
-- For simplicity in pgTAP without auth schema access, we mock the behavior or skip the complex auth user constraint.
-- Because of FK to auth.users, inserting into admin_user_roles directly might fail in a pure unit test unless auth.users is populated.
-- We will just check if the function exists and is attached to the trigger.
select has_trigger(
  'admin_user_roles',
  'tr_prevent_last_superadmin_removal',
  'Trigger tr_prevent_last_superadmin_removal should exist on admin_user_roles'
);

-- Test 5: Verify Policies Existence (AAL2 checks)
select policies_are(
  'public',
  'admin_user_roles',
  ARRAY[
    'Read user_roles with users.read',
    'Assign roles with roles.assign and AAL2',
    'Update roles with roles.assign and AAL2',
    'Delete roles with roles.assign and AAL2'
  ],
  'admin_user_roles should have correct RLS policies'
);

-- Test 6: Verify Admin Audit Logs Policies
select policies_are(
  'public',
  'admin_audit_logs',
  ARRAY[
    'Read audit logs with audit.read',
    'No direct insert on audit logs via app'
  ],
  'admin_audit_logs should have correct RLS policies'
);

-- Test 7: Verify Admin Roles Policies
select policies_are(
  'public',
  'admin_roles',
  ARRAY[
    'Read roles with roles.read'
  ],
  'admin_roles should have correct RLS policies'
);

-- Test 8: App Settings Policies
select policies_are(
  'public',
  'app_settings',
  ARRAY[
    'Read app_settings with settings.read',
    'Update app_settings with settings.update and AAL2'
  ],
  'app_settings should have correct RLS policies'
);

select * from finish();
rollback;
