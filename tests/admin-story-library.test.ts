import {beforeEach,it,expect,vi} from 'vitest'
const mocks=vi.hoisted(()=>({permission:vi.fn(),from:vi.fn()}))
vi.mock('server-only',()=>({}))
vi.mock('@/lib/auth/dal',()=>({requirePermission:mocks.permission}))
vi.mock('@/lib/supabase/service-role',()=>({createServiceRoleClient:()=>({from:mocks.from})}))
import {loadAdminStoryLibrary} from '@/lib/admin-story-library'
beforeEach(()=>vi.resetAllMocks())
it('requires management permission before accessing the archive',async()=>{
 mocks.permission.mockRejectedValue(new Error('denied'))
 await expect(loadAdminStoryLibrary()).rejects.toThrow('denied')
 expect(mocks.from).not.toHaveBeenCalled()
})
it('loads pending and saved stories beyond the first page',async()=>{
 mocks.from.mockImplementation(table=>{const q:any={select:()=>q,neq:()=>q,in:()=>q,order:()=>q,range:async(start:number)=>({data:table==='cases'?[{id:'case',title:'Caso'}]:Array.from({length:start===0?500:1},(_,i)=>({id:String(start+i),case_id:'case',status:'published'})),error:null})};return q})
 const result=await loadAdminStoryLibrary()
 expect(result.stories).toHaveLength(501)
 expect(result.stories[500].id).toBe('500')
 expect(mocks.permission).toHaveBeenCalledWith('cases.manage')
})
