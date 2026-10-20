import assert from 'node:assert/strict';
export default async function(q){
  q.call=async(method,url,body,token=q.token)=>{
    const res=await fetch(q.apiBase+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await res.json().catch(()=>null);assert.ok(res.ok,`${method} ${url}: ${res.status} ${JSON.stringify(data)}`);return data;
  };
  const auth=await q.call('POST','/auth/register',{email:'coach.qa@example.com',password:'CoachFlowQA2026!',first_name:'Coach',last_name:'Recette'});
  q.token=auth.access_token;q.user=auth.user;
  q.club=await q.call('POST','/clubs',{name:'FC Recette CoachFlow'});
  q.team=await q.call('POST','/teams',{name:'Seniors QA',category:'Seniors',club_id:q.club.id});
  q.teamB=await q.call('POST','/teams',{name:'U17 QA',category:'U17',club_id:q.club.id});
  q.players={};
  const specs=[['emile','Émile','Le Goff','MIDFIELDER',8,'ACTIVE'],['noah','Noah','Entrant','FORWARD',12,'ACTIVE'],['hugo','Hugo','Banc','DEFENDER',14,'ACTIVE'],['adam','Adam','Absent','GOALKEEPER',1,'ACTIVE'],['matteo','Mattéo','Incertain','MIDFIELDER',6,'ACTIVE'],['unknown','Paul','Non renseigné','DEFENDER',4,'ACTIVE'],['long','Jean-Baptiste','de La Roche-Saint-André de Beauregard','DEFENDER',22,'INJURED'],['suspended','Antoine','Suspendu','FORWARD',10,'SUSPENDED']];
  for(const [key,first_name,last_name,position,jersey_number,status] of specs)q.players[key]=await q.call('POST','/players',{first_name,last_name,position,jersey_number,status,team_id:q.team.id,strong_foot:'RIGHT'});
  const outsider=await q.call('POST','/auth/register',{email:'outside.qa@example.com',password:'CoachFlowQA2026!',first_name:'Outside',last_name:'QA'});
  q.outsiderToken=outsider.access_token;
  const denied=await fetch(q.apiBase+'/players/overview?teamId='+q.team.id,{headers:{Authorization:'Bearer '+outsider.access_token}});assert.equal(denied.status,403);
  q.context=await q.browser.newContext({viewport:{width:1280,height:900},locale:'fr-FR',timezoneId:'Europe/Paris',colorScheme:'dark'});
  await q.context.tracing.start({screenshots:true,snapshots:true,sources:true});
  q.page=await q.context.newPage();q.page.setDefaultTimeout(45000);q.page.setDefaultNavigationTimeout(60000);q.errors=[];q.failed=[];
  q.page.on('pageerror',e=>q.errors.push(e.message));q.page.on('requestfailed',r=>q.failed.push({url:r.url(),error:r.failure()?.errorText}));
  await q.page.goto(q.base+'/login?returnUrl=%2Fdashboard%2Fjoueurs');
  await q.page.locator('input[type=email]').fill('coach.qa@example.com');await q.page.locator('input[type=password]').fill('CoachFlowQA2026!');
  await q.page.getByRole('button',{name:'Connexion',exact:true}).click();
  await q.page.getByRole('heading',{name:'L’effectif',exact:true}).waitFor();
  await q.page.getByRole('button',{name:/Ouvrir la fiche de Émile Le Goff/}).waitFor();
  await q.page.screenshot({path:q.out+'/initial-desktop.png'});
  console.log('SEED_OK: 2 teams, 8 synthetic players, authenticated UI; outsider rejected 403');
}
