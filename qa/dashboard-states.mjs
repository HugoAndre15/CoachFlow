import assert from 'node:assert/strict';
export default async function(q){
 const email=`states.qa.${Date.now()}@example.com`;
 const account=await q.call('POST','/auth/register',{email,password:'CoachFlowQA2026!',first_name:'Etat',last_name:'Recette'});
 const context=await q.browser.newContext({viewport:{width:375,height:812},locale:'fr-FR'});
 const p=await context.newPage();p.setDefaultTimeout(45000);
 await p.goto(q.base+'/login?returnUrl=%2Fdashboard');
 await p.locator('input[type=email]').fill(email);await p.locator('input[type=password]').fill('CoachFlowQA2026!');
 await p.locator('input[type=password]').press('Enter');
 await p.getByRole('heading',{name:'Bienvenue sur CoachFlow',exact:true}).waitFor();
 assert.equal(await p.getByRole('button',{name:'Explorer le club',exact:true}).count(),0);
 const club=await q.call('POST','/clubs',{name:'Nouveau club QA'},account.access_token);
 await p.reload();await p.getByRole('heading',{name:'Place à votre première équipe',exact:true}).waitFor();
 const dims=await p.evaluate(()=>({body:document.body.scrollWidth,width:innerWidth}));assert.ok(dims.body<=dims.width);
 await p.getByRole('link',{name:'Créer mon équipe',exact:true}).click();await p.waitForURL('**/dashboard/teams');
 const team=await q.call('POST','/teams',{name:'Nouvelle équipe QA',category:'U15',club_id:club.id},account.access_token);
 await p.goto(q.base+'/dashboard');await p.getByRole('heading',{name:'Le prochain match commence ici.',exact:true}).waitFor();
 // A failed initial API read must display a retry, not a false empty season.
 const blocked=route=>route.fulfill({status:503,contentType:'application/json',body:'{}'});
 await p.route('**/teams/'+team.id+'/dashboard?*',blocked);await p.reload();
 await p.locator('main').getByRole('alert').waitFor();
 assert.equal(await p.getByRole('heading',{name:'Le bilan se construit au fil des matchs.',exact:true}).count(),0);
 await p.unroute('**/teams/'+team.id+'/dashboard?*',blocked);await p.getByRole('button',{name:'Réessayer',exact:true}).click();
 await p.getByRole('heading',{name:'Le bilan se construit au fil des matchs.',exact:true}).waitFor();
 // Club loading errors should not lead users to create a duplicate club.
 await p.route('**/api/users/me/clubs',blocked);await p.reload();
 await p.getByRole('heading',{name:'Retrouvons votre équipe',exact:true}).waitFor();
 assert.equal(await p.getByRole('button',{name:'Créer un club',exact:true}).count(),0);
 await p.unroute('**/api/users/me/clubs',blocked);await p.getByRole('button',{name:'Réessayer',exact:true}).click();
 await p.getByRole('heading',{name:'Le bilan de l’équipe',exact:true}).waitFor();
 await context.close();
 // Delay a prior team's response until after a team switch.
 const page=q.page;await page.goto(q.base+'/dashboard');
 await page.locator('header').getByRole('button',{name:/Seniors QA/}).click();await page.getByRole('button',{name:/Seniors Démo/}).click();
 await page.getByRole('heading',{name:'Prochain rendez-vous',exact:true}).waitFor();
 let release,seen;const gate=new Promise(r=>release=r),noticed=new Promise(r=>seen=r);
 const path='**/teams/'+q.dashboardFixture.team.id+'/dashboard?*';
 const slow=async route=>{const response=await route.fetch();seen();await gate;await route.fulfill({response});};
 await page.route(path,slow);await page.getByRole('button',{name:'Actualiser la vue d’équipe',exact:true}).click();await noticed;
 await page.locator('header').getByRole('button',{name:/Seniors Démo/}).click();await page.getByRole('button',{name:/U17 QA/}).click();
 await page.getByRole('heading',{name:'Le prochain match commence ici.',exact:true}).waitFor();
 const late=page.waitForResponse(r=>r.url().includes('/teams/'+q.dashboardFixture.team.id+'/dashboard'));release();await late;await page.unroute(path,slow);
 assert.equal(await page.getByText('FC Gouvieux',{exact:true}).count(),0);
 assert.equal(await page.getByRole('heading',{name:'Le bilan se construit au fil des matchs.',exact:true}).count(),1);
 await page.locator('header').getByRole('button',{name:/U17 QA/}).click();await page.getByRole('button',{name:/Seniors QA/}).click();
 q.results.push({scenario:'Dashboard démarrage et résilience',status:'PASS',checks:['sans club','sans equipe','nouvelle equipe','erreur initiale/reessai','erreur clubs/reessai','reponse ancienne equipe ignoree']});
 console.log('PASS dashboard onboarding, initial failures, retry and team response race');
}
