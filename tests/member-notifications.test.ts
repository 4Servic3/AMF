import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/member-account', () => ({ requireMemberAccount: vi.fn() }));
import { requireMemberAccount } from '@/lib/member-account';
import { listMemberNotifications, markMemberNotifications, safeNotificationLink } from '@/lib/member-notifications';
const id = '11111111-1111-4111-8111-111111111111';
function setup(results: unknown[]) {
 const queries: any[] = [];
 const db = { from: vi.fn(() => { const result = results.shift(); const q: any = {}; for (const m of ['select','order','range','eq','in','upsert']) q[m] = vi.fn(() => q); q.then = (resolve: any) => Promise.resolve(result).then(resolve); queries.push(q); return q; }) };
 vi.mocked(requireMemberAccount).mockResolvedValue({userId:'verified-user',db} as any); return {db,queries};
}
beforeEach(() => vi.resetAllMocks());
describe('member notifications', () => {
 it.each(['https://evil.example','//evil.example','/admin','/app\\\\evil','javascript:alert(1)','/app\n/evil'])('rejects unsafe destination %s', value => expect(safeNotificationLink(value)).toBeNull());
 it('allows protected app paths', () => expect(safeNotificationLink('/app/cursos/teste')).toBe('/app/cursos/teste'));
 it('requires authentication', async () => { vi.mocked(requireMemberAccount).mockRejectedValue(new Error('auth')); await expect(listMemberNotifications(1)).rejects.toThrow('auth'); });
 it('bounds pagination and reads only the authenticated users markers', async () => {
 const {queries}=setup([{data:[{id,target_url:'/app',title:'Notice'}],error:null},{data:[{notification_id:id}],error:null}]);
 const result=await listMemberNotifications(2); expect(queries[0].range).toHaveBeenCalledWith(20,40); expect(queries[1].eq).toHaveBeenCalledWith('profile_id','verified-user');expect(result.items[0].read).toBe(true);
 });
 it('rejects oversized writes before database access', async()=>{await expect(markMemberNotifications(Array(21).fill(id))).rejects.toThrow();expect(requireMemberAccount).not.toHaveBeenCalled()});
 it('only marks existing ids for the authenticated identity, idempotently',async()=>{
 const {queries}=setup([{data:[{id},{id:'unexpected'}],error:null},{error:null}]); await markMemberNotifications([id,id]);expect(queries[1].upsert).toHaveBeenCalledWith([{profile_id:'verified-user',notification_id:id}],{onConflict:'profile_id,notification_id',ignoreDuplicates:true});
 });
 it('does not mask database failures as an empty feed',async()=>{setup([{data:null,error:{message:'down'}}]);await expect(listMemberNotifications(1)).rejects.toThrow()});
});
