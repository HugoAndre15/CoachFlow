import assert from 'node:assert/strict';
import fs from 'node:fs';
export default async function(q){
  assert.deepEqual(q.errors,[], 'Uncaught browser errors');
  await q.page.setViewportSize({width:375,height:812});
  await q.page.goto(q.base+'/dashboard/joueurs');
  await q.page.getByLabel('Période',{exact:true}).selectOption('LAST_30_DAYS');
  await q.page.getByText('2 matchs terminés sur la période',{exact:true}).waitFor();
  await q.page.getByLabel('Trier par',{exact:true}).selectOption('goals');
  await q.page.getByRole('button',{name:/Ouvrir la fiche/}).first().scrollIntoViewIfNeeded();
  await q.page.screenshot({path:q.out+'/mobile-cards.png',timeout:45000});
  // Check computed cursors across the main screens, including disabled controls.
  const publicContext=await q.browser.newContext();
  const publicPage=await publicContext.newPage();
  for(const route of ['/','/login','/register','/dashboard','/dashboard/joueurs','/dashboard/matchs','/dashboard/teams','/dashboard/clubs']) {
    const page=route.startsWith('/dashboard')?q.page:publicPage;
    await page.goto(q.base+route);
    await page.getByRole('button').first().waitFor({state:'visible'});
    const failures=await page.locator('button,[role="button"],input[type="submit"],input[type="button"],input[type="reset"]').evaluateAll(nodes=>nodes.filter(e=>e.getBoundingClientRect().height>0).flatMap(e=>{
      const disabled=e.matches(':disabled')||e.getAttribute('aria-disabled')==='true';
      const cursor=getComputedStyle(e).cursor;
      return cursor===(disabled?'not-allowed':'pointer')?[]:[{text:e.textContent,cursor,disabled}];
    }));
    assert.deepEqual(failures,[],`Button cursors on ${route}`);
  }
  await publicContext.close();
  const summary={testedAt:new Date().toISOString(),browser:await q.browser.version(),uncaughtErrors:q.errors,failedRequests:q.failed,results:q.results,layouts:q.layouts};
  fs.writeFileSync(q.out+'/summary.json',JSON.stringify(summary,null,2));
  await q.context.tracing.stop({path:q.out+'/trace.zip'});
  console.log('FINAL_CHECK '+JSON.stringify({uncaughtErrors:q.errors,failedRequests:q.failed,scenarios:q.results.length}));
}
