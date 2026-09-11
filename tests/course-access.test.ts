import {beforeEach,expect,it,vi} from 'vitest'
const m=vi.hoisted(()=>({session:vi.fn(),permission:vi.fn(),rpc:vi.fn()}))
vi.mock('@/lib/auth/dal',()=>({requireAal2:m.session,requirePermission:m.permission,writeAdminAuditEvent:vi.fn(),hasPermission:vi.fn()}))
vi.mock('@/lib/supabase/service-role',()=>({createServiceRoleClient:()=>({rpc:m.rpc})}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
import {grantCourseAccess,setCourseAllStudents,revokeCourseAccess} from '@/app/admin/actions/courses'
const id='11111111-1111-4111-8111-111111111111'
beforeEach(()=>{vi.resetAllMocks();m.session.mockResolvedValue({user:{id:'admin'}});m.rpc.mockResolvedValue({data:[],error:null})})
it('normalizes email and uses end of day in Brasília',async()=>{
 expect((await grantCourseAccess(id,' USER@EXAMPLE.COM ','2030-01-01')).success).toBe(true)
 expect(m.rpc).toHaveBeenCalledWith('course_access_admin',expect.objectContaining({p_email:'user@example.com',p_expires:'2030-01-02T02:59:59.000Z'}))
})
it('returns missing account errors without opaque server exceptions',async()=>{m.rpc.mockResolvedValue({error:{code:'P0001',message:'E-mail não cadastrado.'}});expect(await grantCourseAccess(id,'missing@example.com',null)).toEqual({success:false,error:'E-mail não cadastrado.'})})
it('rejects invalid email and past expiration',async()=>{expect((await grantCourseAccess(id,'invalid',null)).success).toBe(false);expect((await grantCourseAccess(id,'a@b.com','2000-01-01')).success).toBe(false);expect(m.rpc).not.toHaveBeenCalled()})
it('requires permission before enabling everyone',async()=>{m.permission.mockRejectedValue(new Error('denied'));await expect(setCourseAllStudents(id,true)).rejects.toThrow('denied');expect(m.rpc).not.toHaveBeenCalled()})
it('scopes revocation to its course',async()=>{await revokeCourseAccess(id,id);expect(m.rpc).toHaveBeenCalledWith('course_access_admin',expect.objectContaining({p_course:id,p_revoke:id}))})
