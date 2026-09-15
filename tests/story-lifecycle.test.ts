import { describe,it,expect } from 'vitest'
import { storyIsRecent, portraitContain, STORY_HOME_LIFETIME_MS } from '@/lib/story-lifecycle'
describe('story lifetime and vertical framing',()=>{
 const now=Date.parse('2026-09-15T12:00:00Z')
 it('expires exactly 48h after publication',()=>{
  expect(storyIsRecent(new Date(now-STORY_HOME_LIFETIME_MS+1).toISOString(),now)).toBe(true)
  expect(storyIsRecent(new Date(now-STORY_HOME_LIFETIME_MS).toISOString(),now)).toBe(false)
 })
 it('does not revive missing, invalid or future timestamps',()=>{
  for(const date of [null,undefined,'bad',new Date(now+1).toISOString()]) expect(storyIsRecent(date,now)).toBe(false)
 })
 it('frames landscape media without cropping',()=>{
  expect(portraitContain(1920,1080)).toEqual({x:0,y:437.5,width:720,height:405})
 })
 it('keeps portrait and square media centered',()=>{
  expect(portraitContain(1080,1920)).toEqual({x:0,y:0,width:720,height:1280})
  expect(portraitContain(100,100)).toEqual({x:0,y:280,width:720,height:720})
  expect(()=>portraitContain(0,0)).toThrow()
 })
})
