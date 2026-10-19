import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '../src/lib/supabase/server';
import { createServiceRoleClient } from '../src/lib/supabase/service-role';
import { saveOwnProfile } from '../src/lib/member-account';
import { listOwnTickets, getOwnTicket, createOwnTicket, replyOwnTicket } from '../src/lib/member-support';
import { memberPage, profileEditSchema, ticketCreateSchema } from '../src/lib/member-account-schema';
vi.mock('../src/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../src/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn() }));

const userId = '70be7d9a-3a2b-4a1d-a5ef-65fa38ff4a11';
const ticketId = '70be7d9a-3a2b-4a1d-a5ef-65fa38ff4a22';
const ticket = { id: ticketId, profile_id: userId, subject: 'Ajuda técnica', category: 'technical', status: 'open', created_at: '2026-01-01T00:00:00Z' };
const profile = { full_name: 'Nome Real', display_name: 'Nome', phone: '+55 11 99999-1111', profession: 'veterinarian' };
type Result = { data?: unknown; error?: unknown };
function setup(results: Result[] = [], authenticated = true) {
  vi.mocked(createClient).mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: authenticated ? { id: userId } : null }, error: null }) } } as unknown as Awaited<ReturnType<typeof createClient>>);
  const queries: Record<string, ReturnType<typeof vi.fn>>[] = [];
  const db = { from: vi.fn(() => {
    const result = results.shift() || { data: null, error: null };
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['select', 'eq', 'in', 'order', 'range', 'insert', 'update', 'delete']) query[method] = vi.fn().mockReturnValue(query);
    query.single = vi.fn().mockResolvedValue(result);
    query.maybeSingle = vi.fn().mockResolvedValue(result);
    query.then = vi.fn((resolve) => Promise.resolve(result).then(resolve));
    queries.push(query);
    return query;
  }) };
  vi.mocked(createServiceRoleClient).mockReturnValue(db as unknown as ReturnType<typeof createServiceRoleClient>);
  return { db, queries };
}
beforeEach(() => vi.clearAllMocks());

describe('member self profile', () => {
  it('never initializes privileged access without authentication', async () => {
    setup([], false);
    await expect(saveOwnProfile(profile)).rejects.toThrow('Entre novamente');
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
  it.each(['id', 'role', 'email', 'avatar_url'])('rejects injected %s', async (field) => {
    setup();
    await expect(saveOwnProfile({ ...profile, [field]: 'attacker' })).rejects.toThrow();
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
  it('updates allowed fields only on the verified user', async () => {
    const { queries } = setup([{ data: { id: userId } }]);
    await saveOwnProfile(profile);
    expect(queries[0].update).toHaveBeenCalledWith(profile);
    expect(queries[0].eq).toHaveBeenCalledWith('id', userId);
  });
  it('rejects invalid profession, name and phone', () => {
    expect(profileEditSchema.safeParse({ ...profile, profession: 'admin' }).success).toBe(false);
    expect(profileEditSchema.safeParse({ ...profile, full_name: '' }).success).toBe(false);
    expect(profileEditSchema.safeParse({ ...profile, phone: 'invalid' }).success).toBe(false);
  });
});

describe('member support privacy and validation', () => {
  it('rejects unauthenticated ticket listing', async () => {
    setup([], false);
    await expect(listOwnTickets(1)).rejects.toThrow('Entre novamente');
    expect(createServiceRoleClient).not.toHaveBeenCalled();
  });
  it('lists only own tickets with bounded pagination', async () => {
    const { queries } = setup([{ data: [ticket, { ...ticket, profile_id: 'other' }] }]);
    const result = await listOwnTickets(2);
    expect(result.tickets).toHaveLength(1);
    expect(queries[0].eq).toHaveBeenCalledWith('profile_id', userId);
    expect(queries[0].range).toHaveBeenCalledWith(20, 40);
    expect(memberPage(-2)).toBe(1);
    expect(memberPage(Infinity)).toBe(1);
    expect(memberPage(100000)).toBe(1000);
  });
  it('never loads messages from another user ticket', async () => {
    const { db, queries } = setup([{ data: { ...ticket, profile_id: 'other' } }]);
    expect(await getOwnTicket(ticketId)).toBeNull();
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(queries[0].eq).toHaveBeenCalledWith('profile_id', userId);
  });
  it('filters internal messages and messages belonging to another ticket twice', async () => {
    const publicMessage = { id: 'message', ticket_id: ticketId, sender_id: userId, content: 'Mensagem pública', is_internal: false, created_at: ticket.created_at };
    const { queries } = setup([{ data: ticket }, { data: [publicMessage, { ...publicMessage, is_internal: true, content: 'PRIVATE' }, { ...publicMessage, ticket_id: 'other', content: 'FOREIGN' }] }]);
    const result = await getOwnTicket(ticketId);
    expect(result?.messages).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
    expect(JSON.stringify(result)).not.toContain('FOREIGN');
    expect(queries[1].eq).toHaveBeenCalledWith('is_internal', false);
    expect(queries[1].eq).toHaveBeenCalledWith('ticket_id', ticketId);
  });
  it.each(['closed', 'resolved', 'unknown'])('cannot reply to %s status', async (status) => {
    const { db } = setup([{ data: { ...ticket, status } }]);
    await expect(replyOwnTicket({ ticketId, content: 'Hello' })).rejects.toThrow();
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it('cannot reply to another user ticket', async () => {
    const { db } = setup([{ data: { ...ticket, profile_id: 'other' } }]);
    await expect(replyOwnTicket({ ticketId, content: 'Hello' })).rejects.toThrow();
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it('creates public replies using verified sender identity', async () => {
    const { queries } = setup([{ data: ticket }, { error: null }]);
    await replyOwnTicket({ ticketId, content: 'Resposta' });
    expect(queries[1].insert).toHaveBeenCalledWith({ ticket_id: ticketId, sender_id: userId, content: 'Resposta', is_internal: false });
  });
  it('creates own tickets with fixed open status and public initial message', async () => {
    const { queries } = setup([{ data: { id: ticketId } }, { error: null }]);
    expect(await createOwnTicket({ subject: 'Ajuda', category: 'general', content: 'Olá' })).toBe(ticketId);
    expect(queries[0].insert).toHaveBeenCalledWith({ profile_id: userId, subject: 'Ajuda', category: 'general', status: 'open' });
    expect(queries[1].insert).toHaveBeenCalledWith({ ticket_id: ticketId, sender_id: userId, content: 'Olá', is_internal: false });
  });
  it('compensates an empty newly created ticket if initial message fails', async () => {
    const { queries } = setup([{ data: { id: ticketId } }, { error: new Error('fail') }, { error: null }]);
    await expect(createOwnTicket({ subject: 'Ajuda', category: 'general', content: 'Olá' })).rejects.toThrow();
    expect(queries[2].delete).toHaveBeenCalled();
    expect(queries[2].eq).toHaveBeenCalledWith('profile_id', userId);
    expect(queries[2].eq).toHaveBeenCalledWith('id', ticketId);
  });
  it('rejects privilege fields, unsafe category and oversized messages', () => {
    const input = { subject: 'Ajuda', category: 'general', content: 'Olá' };
    for (const patch of [{ profile_id: 'other' }, { status: 'closed' }, { is_internal: true }, { category: 'admin' }, { content: 'x'.repeat(5001) }]) {
      expect(ticketCreateSchema.safeParse({ ...input, ...patch }).success).toBe(false);
    }
  });
});
