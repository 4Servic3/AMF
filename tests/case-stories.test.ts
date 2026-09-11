import { beforeEach, describe, expect, it, vi } from 'vitest'
import { caseStoryInput } from '@/lib/case-stories'

const mocks = vi.hoisted(() => ({single:vi.fn(),rpc:vi.fn(),upload:vi.fn(),asset:vi.fn()}))
vi.mock('server-only',()=>({}))
vi.mock('@/lib/supabase/service-role',()=>({createServiceRoleClient:()=>({from:()=>({select:()=>({eq:()=>({single:mocks.single})})}),rpc:mocks.rpc})}))
vi.mock('@/lib/mux/client',()=>({getMuxClient:()=>({video:{uploads:{retrieve:mocks.upload},assets:{retrieve:mocks.asset}}})}))
import { syncCaseStory } from '@/lib/mux/case-stories'

const input = {caseId:null,caseTitle:'Caso',caption:'Story',fileName:'video.mp4',fileType:'video/mp4',fileSize:1024}
describe('case stories validation and publication',()=>{
  beforeEach(()=>vi.resetAllMocks())
  it('rejects missing category and unsupported/oversize image',()=>{
    expect(caseStoryInput.safeParse({...input,caseTitle:''}).success).toBe(false)
    expect(caseStoryInput.safeParse({...input,fileType:'image/svg+xml'}).success).toBe(false)
    expect(caseStoryInput.safeParse({...input,fileType:'image/png',fileSize:11*1024**2}).success).toBe(false)
    expect(caseStoryInput.safeParse({...input,fileType:'image/jpeg'}).success).toBe(true)
  })
  it('does not revive an archived story',async()=>{
    mocks.single.mockResolvedValue({data:{status:'archived'}})
    expect(await syncCaseStory('id')).toBe('archived')
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('keeps pending uploads unpublished',async()=>{
    mocks.single.mockResolvedValue({data:{status:'processing',mux_upload_id:'upload',media_type:'video'}})
    mocks.upload.mockResolvedValue({status:'waiting'})
    expect(await syncCaseStory('id')).toBe('processing')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('publishes only signed ready video',async()=>{
    mocks.single.mockResolvedValue({data:{status:'processing',mux_upload_id:'upload',media_type:'video'}})
    mocks.upload.mockResolvedValue({status:'asset_created',asset_id:'asset'})
    mocks.asset.mockResolvedValue({id:'asset',status:'ready',duration:12.2,playback_ids:[{id:'public',policy:'public'},{id:'signed',policy:'signed'}]})
    mocks.rpc.mockResolvedValue({error:null})
    expect(await syncCaseStory('id')).toBe('published')
    expect(mocks.rpc).toHaveBeenCalledWith('publish_case_story',{p_story:'id',p_asset:'asset',p_playback:'signed',p_duration:13})
  })
  it('rejects a ready asset with only public playback',async()=>{
    mocks.single.mockResolvedValue({data:{status:'processing',mux_upload_id:'upload',media_type:'video'}})
    mocks.upload.mockResolvedValue({asset_id:'asset'})
    mocks.asset.mockResolvedValue({status:'ready',playback_ids:[{policy:'public',id:'public'}]})
    await expect(syncCaseStory('id')).rejects.toThrow('signed_playback_missing')
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('does not publish image before database verifies stored bytes',async()=>{
    mocks.single.mockResolvedValue({data:{status:'processing',media_type:'image'}})
    mocks.rpc.mockResolvedValue({error:{message:'upload_incomplete'}})
    expect(await syncCaseStory('id')).toBe('processing')
    expect(mocks.upload).not.toHaveBeenCalled()
  })
  it('publishes a verified image without Mux',async()=>{
    mocks.single.mockResolvedValue({data:{status:'processing',media_type:'image'}})
    mocks.rpc.mockResolvedValue({error:null})
    expect(await syncCaseStory('id')).toBe('published')
    expect(mocks.rpc).toHaveBeenCalledWith('publish_case_story_image',{p_story:'id'})
    expect(mocks.upload).not.toHaveBeenCalled()
  })
})
