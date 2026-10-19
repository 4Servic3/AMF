import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
import { createClient } from '@/lib/supabase/server';
import { loadMemberMaterials } from '@/lib/member-materials';
const row = { id: '00000000-0000-0000-0000-000000000001', course_id: 'course', title: 'PDF', name: 'name.pdf', mime_type: 'application/pdf', download_policy: 'download', view_policy: 'private', lessons: { title: 'Aula', course_modules: { course_id: 'course', courses: { id: 'course', title: 'Curso', slug: 'curso' } } } };
function setup(rows: unknown[] = [row], access: unknown = true, user: { id: string } | null = { id: 'member' }, error: unknown = null) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), then: (resolve: (r: unknown) => unknown) => Promise.resolve({ data: rows, error }).then(resolve) };
  const db = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: vi.fn().mockReturnValue(query), rpc: vi.fn().mockResolvedValue({ data: access, error: null }) };
  vi.mocked(createClient).mockResolvedValue(db as unknown as Awaited<ReturnType<typeof createClient>>);
  return { db, query };
}
beforeEach(() => vi.clearAllMocks());
describe('member material access and pagination', () => {
  it('does not query materials for anonymous visitors', async () => {
    const { db } = setup([], false, null);
    expect((await loadMemberMaterials()).userId).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });
  it('denies material metadata when course RPC rejects access', async () => {
    setup([row], false);
    expect((await loadMemberMaterials()).items).toEqual([]);
  });
  it('checks course access once per distinct course and never returns storage URLs', async () => {
    const { db, query } = setup([row, { ...row, id: 'second' }]);
    const result = await loadMemberMaterials();
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith('has_course_access', { course_uuid: 'course' });
    expect(result.items[0].downloadHref).toBe('/api/courses/curso/material/' + row.id + '/download');
    expect(result.items[0].viewHref).toMatch(/\/view$/);
    expect(query.select.mock.calls[0][0]).not.toMatch(/storage_path|file_url|bucket/);
    for (const field of ['status', 'lessons.status', 'lessons.course_modules.status', 'lessons.course_modules.courses.status']) expect(query.eq).toHaveBeenCalledWith(field, 'published');
  });
  it('fails closed on query or RPC errors', async () => {
    setup([], false, { id: 'member' }, new Error('db'));
    await expect(loadMemberMaterials()).rejects.toThrow('carregar');
    const { db } = setup();
    db.rpc.mockResolvedValue({ data: true, error: new Error('rpc') } as never);
    await expect(loadMemberMaterials()).rejects.toThrow('verificar');
  });
  it('limits each page and validates cursor without scanning the full library', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ ...row, id: '00000000-0000-0000-0000-' + String(i).padStart(12, '0') }));
    const { query } = setup(rows);
    const result = await loadMemberMaterials(row.id);
    expect(result.items).toHaveLength(24);
    expect(result.nextCursor).toBe(rows[23].id);
    expect(query.limit).toHaveBeenCalledWith(25);
    expect(query.gt).toHaveBeenCalledWith('id', row.id);
    const invalid = setup();
    await loadMemberMaterials('invalid,or(id.gt.0)');
    expect(invalid.query.gt).not.toHaveBeenCalled();
  });
  it('rejects inconsistent course relations', async () => {
    setup([{ ...row, course_id: 'other' }]);
    expect((await loadMemberMaterials()).items).toEqual([]);
  });
  it('respects disabled actions and only previews PDFs', async () => {
    setup([{ ...row, view_policy: 'disabled', download_policy: 'disabled' }, { ...row, mime_type: 'application/zip' }]);
    const { items } = await loadMemberMaterials();
    expect(items[0].viewHref).toBeNull();
    expect(items[0].downloadHref).toBeNull();
    expect(items[1].viewHref).toBeNull();
  });
});
