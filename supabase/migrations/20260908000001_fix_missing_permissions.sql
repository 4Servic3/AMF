-- Migration: Fix missing permission keys
-- These permissions are used in requirePermission() calls throughout the codebase
-- but were never inserted into admin_permissions, causing super_admin to be blocked
-- from accessing Cases, Users, Operations, and publishing content.

-- Insert the 12 missing permission keys
insert into admin_permissions (key, resource, action, risk_level, description) values
  ('cases.manage',           'cases',          'manage',          'medium',   'Create, edit and delete clinical cases'),
  ('users.manage',           'users',          'manage',          'high',     'Manage user accounts, roles and access'),
  ('ops.manage',             'ops',            'manage',          'high',     'Monitor operations, webhooks and background jobs'),
  ('content.manage',         'content',        'manage',          'medium',   'Manage all content types (home, stories, courses)'),
  ('content.publish',        'content',        'publish',         'medium',   'Publish courses, modules and lessons'),
  ('courses.videos.manage',  'courses',        'videos.manage',   'medium',   'Upload, replace and manage lesson videos via Mux'),
  ('stories.manage',         'stories',        'manage',          'medium',   'Create, edit and delete stories'),
  ('support.manage',         'support',        'manage',          'medium',   'Read and respond to support tickets'),
  ('communications.manage',  'communications', 'manage',          'medium',   'Send notifications and manage campaigns'),
  ('settings.manage',        'settings',       'manage',          'high',     'Manage application settings and feature flags'),
  ('audit.view',             'audit',          'view',            'low',      'View audit logs (alias for audit.read in UI)'),
  ('system.manage',          'system',         'manage',          'critical', 'Manage system-level configuration and overrides')
on conflict (key) do nothing;

-- Grant ALL permissions (including the new ones) to super_admin
do $$
declare
  super_admin_id uuid;
begin
  select id into super_admin_id from admin_roles where key = 'super_admin';
  insert into admin_role_permissions (role_id, permission_id)
  select super_admin_id, id from admin_permissions
  on conflict do nothing;
end $$;

-- Grant content-related permissions to content_admin role
do $$
declare
  content_admin_id uuid;
begin
  select id into content_admin_id from admin_roles where key = 'content_admin';
  insert into admin_role_permissions (role_id, permission_id)
  select content_admin_id, id from admin_permissions
  where key in (
    'cases.manage', 'content.manage', 'content.publish',
    'courses.videos.manage', 'stories.manage'
  )
  on conflict do nothing;
end $$;

-- Grant support permissions to support_agent role
do $$
declare
  support_agent_id uuid;
begin
  select id into support_agent_id from admin_roles where key = 'support_agent';
  insert into admin_role_permissions (role_id, permission_id)
  select support_agent_id, id from admin_permissions
  where key in ('support.manage', 'users.manage')
  on conflict do nothing;
end $$;
