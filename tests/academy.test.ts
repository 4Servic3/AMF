import { describe, expect, it } from "vitest";
import { courseCompletion, courseIsAccessible, type AcademyEntitlement } from "@/lib/academy-progress";
import { buildAcademyPaths, type AcademyTarget, type AcademyStepRow } from "@/lib/academy-model";
const now = Date.parse("2026-09-21");
const course = { id: "c", status: "published", all_students: false };
const grant: AcademyEntitlement = { resource_id: "c", resource_type: "course", status: "active", starts_at: "2026-01-01", expires_at: null };
describe("Academy access and progress", () => {
  it("requires a valid course grant or published all_students", () => {
    expect(courseIsAccessible(course, [], now)).toBe(false);
    expect(courseIsAccessible(course, [grant], now)).toBe(true);
    expect(courseIsAccessible({...course, all_students: true}, [], now)).toBe(true);
    expect(courseIsAccessible({...course, status:"draft", all_students:true}, [grant], now)).toBe(false);
  });
  it.each([{status:"revoked"},{resource_type:"case"},{starts_at:"2027-01-01"},{expires_at:"2026-09-21"},{starts_at:null}])("rejects invalid grant %j", patch => {
    expect(courseIsAccessible(course,[{...grant,...patch}],now)).toBe(false);
  });
  it("counts all published lessons and excludes hidden modules and unrelated progress", () => {
    const modules = [{id:"m",course_id:"c",status:"published"},{id:"draft",course_id:"c",status:"draft"}];
    const lessons = [{id:"a",module_id:"m",status:"published"},{id:"b",module_id:"m",status:"published"},{id:"x",module_id:"draft",status:"published"}];
    const progress = ["a","x"].map(lesson_id => ({lesson_id,is_completed:true,progress_percent:100}));
    expect(courseCompletion("c",modules,lessons,progress)).toEqual({total:2,completed:1,percent:50});
    expect(courseCompletion("empty",modules,lessons,progress)).toEqual({total:0,completed:0,percent:0});
  });
});
const paths = [{id:"p",title:"Trilha",description:null,status:"published"}];
const phases = [{id:"f",path_id:"p",title:"Fase",position:0}];
const step = (id:string):AcademyStepRow => ({id,phase_id:"f",position:id==="a"?0:1,step_type:"course",target_id:id,title_override:null,status:"published"});
const target = (id:string,completed=false):AcademyTarget => ({id,type:"course",title:id,href:"/app/cursos/"+id,percent:completed?100:0,completed,detail:""});
const pre = {step_id:"b",prerequisite_step_id:"a"};
describe("Academy real prerequisites", () => {
  it("omits drafts and inaccessible targets", () => {
    expect(buildAcademyPaths([{...paths[0],status:"draft"}],phases,[],[],[])).toEqual([]);
    const result=buildAcademyPaths(paths,phases,[step("a"),step("hidden"),{...step("draft"),status:"draft"}],[],[target("a"),target("draft")]);
    expect(result[0].phases[0].steps.map(s=>s.stepId)).toEqual(["a"]);
  });
  it("unlocks after completion and derives actual overall progress", () => {
    const run=(completed:boolean)=>buildAcademyPaths(paths,phases,[step("a"),step("b")],[pre],[target("a",completed),target("b")])[0];
    expect(run(false).phases[0].steps[1].locked).toBe(true);
    expect(run(true).phases[0].steps[1].locked).toBe(false);
    expect(run(true).percent).toBe(50);
  });
  it("fails closed on inaccessible or missing prerequisites without leaking titles", () => {
    const result=buildAcademyPaths(paths,phases,[step("b")],[pre],[target("b",true)])[0];
    expect(result.phases[0].steps[0]).toMatchObject({locked:true,completed:false});
    expect(result.percent).toBe(0);
  });
  it("blocks cycles even when target contents were completed", () => {
    const result=buildAcademyPaths(paths,phases,[step("b"),step("a")],[pre,{step_id:"a",prerequisite_step_id:"b"}],[target("a",true),target("b",true)])[0];
    expect(result.phases[0].steps.map(s=>[s.stepId,s.locked])).toEqual([["a",true],["b",true]]);
  });
  it("does not invent case completion", () => {
    const result=buildAcademyPaths(paths,phases,[{...step("a"),step_type:"case"},step("b")],[pre],[{...target("a"),type:"case"},target("b")])[0];
    expect(result.completed).toBe(0);
    expect(result.phases[0].steps[1].locked).toBe(true);
  });
});
