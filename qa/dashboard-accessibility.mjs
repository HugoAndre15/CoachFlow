import assert from 'node:assert/strict';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
export default async function(q){
 const p=q.page;
 await p.goto(q.base+'/dashboard');
 await p.locator('header').getByRole('button',{name:/Seniors (QA|Démo)/}).waitFor();
 const current=await p.locator('header').getByRole('button',{name:/Seniors QA/}).count();
 if(current){await p.locator('header').getByRole('button',{name:/Seniors QA/}).click();await p.getByRole('button',{name:/Seniors Démo/}).click();}
 await p.getByRole('heading',{name:'Prochain rendez-vous',exact:true}).waitFor();
 await p.getByRole('heading',{name:'Derniers résultats',exact:true}).waitFor();
 const reports=[];
 for(const width of [375,768,1280]){
  await p.setViewportSize({width,height:900});
  const result=await new AxeBuilder({page:p}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  reports.push({width,violations:result.violations});
 }
 await p.getByRole('button',{name:'Nouveau match',exact:true}).click();
 const form=await new AxeBuilder({page:p}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 reports.push({form:true,violations:form.violations});
 await p.keyboard.press('Escape');
 fs.writeFileSync(q.out+'/dashboard-accessibility.json',JSON.stringify(reports,null,2));
 const issues=reports.flatMap(x=>x.violations.map(v=>({width:x.width,form:x.form,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
 console.log('ACCESSIBILITY '+JSON.stringify(issues));
 assert.deepEqual(issues,[]);
 await p.locator('header').getByRole('button',{name:/Seniors Démo/}).click();await p.getByRole('button',{name:/Seniors QA/}).click();
 q.results.push({scenario:'Accessibilité dashboard',status:'PASS',checks:['axe WCAG A/AA dashboard 375/768/1280','dialogue creation']});
}
