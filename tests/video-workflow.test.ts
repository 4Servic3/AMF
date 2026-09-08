import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({admin:vi.fn(),rpc:vi.fn(),cancel:vi.fn(),upload:vi.fn(),sync:vi.fn(),from:vi.fn(),verify:vi.fn()}));
vi.mock('@/lib/mux/admin',async()=>({...await vi.importActual<any>('@/lib/mux/admin'),requireVideoAdmin:mocks.admin}));
vi.mock('@/lib/supabase/service-role',()=>({createServiceRoleClient:()=>({rpc:mocks.rpc,from:mocks.from})}));
vi.mock('@/lib/mux/client',()=>({createDirectUpload:mocks.upload,getMuxClient:()=>({video:{uploads:{cancel:mocks.cancel}}})}));
vi.mock('@/lib/mux/origins',()=>({validateRequestOrigin:()=>({allowed:true,origin:'https://amf-eight.vercel.app'})}));
vi.mock('@/lib/mux',()=>({verifyWebhookSignature:mocks.verify,recordWebhookMetric:vi.fn()}));
vi.mock('@/lib/mux/sync',()=>({syncVideo:mocks.sync}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import {POST as upload} from '@/app/api/admin/courses/lessons/[lessonId]/video-upload/route';
import {POST as publish} from '@/app/api/admin/courses/lessons/[lessonId]/video-replace/route';
import {POST as webhook} from '@/app/api/webhooks/mux/route';
const ctx={params:Promise.resolve({lessonId:'11111111-1111-4111-8111-111111111111'})};
const req=(body={})=>new Request('https://amf-eight.vercel.app/api/video',{method:'POST',body:JSON.stringify(body),headers:{'content-type':'application/json'}});
function chain(result:unknown) {
 const q:any={};for(const k of ['insert','select','eq','update'])q[k]=vi.fn(()=>q);
 q.single=vi.fn(async()=>result);q.maybeSingle=q.single;q.then=(resolve:any)=>Promise.resolve(result).then(resolve);return q;
}
beforeEach(()=>{vi.resetAllMocks();mocks.admin.mockResolvedValue({id:'admin'});mocks.verify.mockResolvedValue({valid:true});mocks.cancel.mockResolvedValue({});});
describe('Real video route regressions',()=>{
 it('cancels the remote upload if local registration fails',async()=>{
  mocks.from.mockReturnValue(chain({data:{id:'lesson'},error:null}));
  mocks.upload.mockResolvedValue({uploadId:'mux-upload',uploadUrl:'https://upload.example'});
  mocks.rpc.mockResolvedValue({error:{message:'upload_in_progress'}});
  expect((await upload(req(),ctx)).status).toBe(409);
  expect(mocks.cancel).toHaveBeenCalledWith('mux-upload');
 });
 it('publishes through one transaction instead of archiving the active video',async()=>{
  mocks.rpc.mockResolvedValue({error:null});
  const response=await publish(req({new_video_asset_id:'22222222-2222-4222-8222-222222222222'}),ctx);
  expect(response.status).toBe(200);expect(mocks.rpc).toHaveBeenCalledWith('activate_lesson_video',expect.objectContaining({p_actor_id:'admin'}));
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it('rejects publication when the transaction reports an unready video',async()=>{
  mocks.rpc.mockResolvedValue({error:{message:'video_not_ready'}});
  expect((await publish(req({new_video_asset_id:'22222222-2222-4222-8222-222222222222'}),ctx)).status).toBe(409);
 });
 it('returns retryable failure for database errors, not a successful duplicate',async()=>{
  mocks.from.mockReturnValue(chain({data:null,error:{code:'08006'}}));
  expect((await webhook(req({id:'evt',type:'video.asset.ready'}))).status).toBe(503);
 });
 it('skips only events that were actually processed',async()=>{
  mocks.from.mockReturnValueOnce(chain({error:{code:'23505'}})).mockReturnValueOnce(chain({data:{id:'local',processing_status:'processed'},error:null}));
  expect((await webhook(req({id:'evt',type:'video.asset.ready'}))).status).toBe(200);
  expect(mocks.sync).not.toHaveBeenCalled();
 });
 it('reprocesses failed events on redelivery',async()=>{
  mocks.from.mockReturnValueOnce(chain({error:{code:'23505'}}))
   .mockReturnValueOnce(chain({data:{id:'local',processing_status:'failed'},error:null}))
   .mockReturnValueOnce(chain({data:{id:'asset'},error:null}))
   .mockReturnValue(chain({error:null}));
  expect((await webhook(req({id:'evt',type:'video.asset.ready',data:{id:'mux-asset'}}))).status).toBe(200);
  expect(mocks.sync).toHaveBeenCalledWith('asset');
 });
});
