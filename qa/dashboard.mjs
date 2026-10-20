import assert from 'node:assert/strict';
import fs from 'node:fs';
import seedDashboard from './dashboard-seed.mjs';

export default async function(q) {
  await seedDashboard(q);
  const f=q.dashboardFixture, p=q.page;
  p.setDefaultTimeout(45000);p.setDefaultNavigationTimeout(60000);
  const endpoint=`/teams/${f.team.id}/dashboard`;
  const get=period=>q.call('GET',endpoint+'?period='+period);
  const choose=async(from,to)=>{if(await p.locator('header').getByRole('button',{name:new RegExp(to)}).count())return;await p.locator('header').getByRole('button',{name:new RegExp(from)}).click();await p.getByRole('button',{name:new RegExp(to)}).click();};
  const metric=label=>p.getByRole('region',{name:'Le bilan de l’équipe',exact:true}).locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('dd > span');
  const expected=period=>{
    const now=new Date();let from=period==='SEASON'?f.season:period==='LAST_30_DAYS'?new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-29)):new Date(0);
    const matches=f.fixtures.filter(m=>m.status==='FINISHED'&&new Date(m.match_date)<=now&&new Date(m.match_date)>=from);
    return {matches:matches.length,wins:matches.filter(m=>m.scored>m.conceded).length,draws:matches.filter(m=>m.scored===m.conceded).length,losses:matches.filter(m=>m.scored<m.conceded).length,scored:matches.reduce((n,m)=>n+m.scored,0),conceded:matches.reduce((n,m)=>n+m.conceded,0),assists:matches.reduce((n,m)=>n+m.scored,0)};
  };
  for(const period of ['ALL','SEASON','LAST_30_DAYS']){
    const d=await get(period);assert.deepEqual(d.totals,expected(period));
    assert.deepEqual(d.roster,{total:20,available:16,injured:3,suspended:1});
    assert.equal(d.live.id,f.live.id);assert.equal(d.next.id,f.next.id);assert.equal(d.overdue,1);
    assert.deepEqual(d.next.attendance,{present:10,absent:1,uncertain:1,unknown:8});
    const overview=await q.call('GET',`/players/overview?teamId=${f.team.id}&period=${period}`);
    assert.equal(d.totals.scored,overview.players.reduce((n,x)=>n+x.stats.goals,0));
    assert.equal(d.totals.assists,overview.players.reduce((n,x)=>n+x.stats.assists,0));
    assert.equal(d.attendance.rate,89);assert.ok(d.scorers.some(x=>x.archived));
  }
  for(const [url,token,status] of [[endpoint,q.outsiderToken,403],[endpoint,null,401],[endpoint+'?period=INVALID',q.token,400],['/teams/not-a-uuid/dashboard',q.token,400]]){
    const r=await fetch(q.apiBase+url,{headers:token?{Authorization:'Bearer '+token}:{}});assert.equal(r.status,status,url);
  }
  console.log('PASS dashboard API: totals, periods, archived history, roster parity, permissions, validation');
  await p.goto(q.base+'/dashboard');
  await choose('Seniors QA','Seniors Démo');
  await p.getByRole('heading',{name:'Match en cours',exact:true}).waitFor();
  assert.equal(await metric('Matchs joués').innerText(),String(expected('SEASON').matches));
  await p.getByRole('link',{name:'Reprendre le direct',exact:true}).click();
  await p.waitForURL('**/dashboard/direct?matchId='+f.live.id);
  await p.getByRole('button',{name:'But pour nous',exact:true}).waitFor();
  await p.goto(q.base+'/dashboard');await p.getByRole('heading',{name:'Match en cours',exact:true}).waitFor();
  for(const [width,height] of [[375,812],[768,1024],[1280,900]]){
    await p.setViewportSize({width,height});await p.locator('main').evaluate(e=>e.scrollTop=0);
    const dims=await p.evaluate(()=>({width:innerWidth,body:document.body.scrollWidth,main:document.querySelector('main').clientWidth,scroll:document.querySelector('main').scrollWidth}));
    assert.ok(dims.body<=width&&dims.scroll<=dims.main+1,JSON.stringify(dims));
    await p.screenshot({path:q.out+`/dashboard-live-${width}.png`});
    await p.getByRole('heading',{name:'Derniers résultats',exact:true}).scrollIntoViewIfNeeded();
    await p.screenshot({path:q.out+`/dashboard-results-${width}.png`});
    await p.getByRole('heading',{name:'Les contributions du groupe',exact:true}).scrollIntoViewIfNeeded();
    await p.screenshot({path:q.out+`/dashboard-contributions-${width}.png`});
    const tiny=await p.locator('main').locator('button,a,select').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<43.5).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));
    assert.deepEqual(tiny,[],'Touch target too small');
    console.log('PASS dashboard viewport '+width);
  }
  await p.setViewportSize({width:1280,height:900});
  for(const period of ['ALL','LAST_30_DAYS','SEASON']){
    await p.getByLabel('Période du bilan',{exact:true}).selectOption(period);
    await p.waitForFunction(()=>!document.body.innerText.includes('Actualisation en cours…'));
    await metric('Matchs joués').waitFor();
    assert.equal(await metric('Matchs joués').innerText(),String(expected(period).matches));
    assert.equal(await metric('Buts marqués').innerText(),String(expected(period).scored));
  }
  // Delayed response must not overwrite a more recent period selection.
  let release,seen;const gate=new Promise(r=>release=r),noticed=new Promise(r=>seen=r);
  const slow=async route=>{const response=await route.fetch();seen();await gate;await route.fulfill({response});};
  await p.route('**'+endpoint+'?period=ALL',slow);
  await p.getByLabel('Période du bilan',{exact:true}).selectOption('ALL');await noticed;
  await p.getByLabel('Période du bilan',{exact:true}).selectOption('LAST_30_DAYS');
  await metric('Matchs joués').waitFor();const late=p.waitForResponse(r=>r.url().includes(endpoint+'?period=ALL'));release();await late;
  await p.unroute('**'+endpoint+'?period=ALL',slow);
  assert.equal(await p.getByLabel('Période du bilan',{exact:true}).inputValue(),'LAST_30_DAYS');
  assert.equal(await metric('Matchs joués').innerText(),String(expected('LAST_30_DAYS').matches));
  // Error preserves last successful data and offers retry.
  const unavailable=route=>route.fulfill({status:503,contentType:'application/json',body:'{}'});
  await p.route('**'+endpoint+'?*',unavailable);
  await p.getByRole('button',{name:'Actualiser la vue d’équipe',exact:true}).click();
  await p.getByRole('alert').filter({hasText:'Impossible de charger'}).waitFor();
  assert.equal(await metric('Matchs joués').innerText(),String(expected('LAST_30_DAYS').matches));
  await p.unroute('**'+endpoint+'?*',unavailable);
  await p.getByRole('button',{name:'Réessayer',exact:true}).click();
  await p.locator('main').getByRole('alert').waitFor({state:'hidden'});
  // Finishing a real match updates the dashboard and reveals the upcoming fixture.
  await p.getByRole('link',{name:'Reprendre le direct',exact:true}).click();
  await p.getByRole('button',{name:'Terminer',exact:true}).click();await p.getByRole('button',{name:'Terminer le match',exact:true}).click();
  await p.waitForURL('**/dashboard/matchs/'+f.live.id);f.live.status='FINISHED';
  await p.goto(q.base+'/dashboard');await p.getByRole('heading',{name:'Prochain rendez-vous',exact:true}).waitFor();
  assert.equal(await metric('Matchs joués').innerText(),String(expected('SEASON').matches));
  assert.equal((await get('SEASON')).live,null);
  await p.setViewportSize({width:375,height:812});
  await p.screenshot({path:q.out+'/dashboard-upcoming-375.png'});
  await p.getByRole('link',{name:'Préparer le match',exact:true}).click();await p.waitForURL('**/dashboard/matchs/'+f.next.id);
  await p.getByRole('heading',{name:'Qui sera là ?',exact:true}).waitFor();
  await p.goto(q.base+'/dashboard');await p.getByRole('heading',{name:'Prochain rendez-vous',exact:true}).waitFor();
  // Accessible create modal; a failed save retains inputs and retry creates one match.
  await p.getByRole('button',{name:'Nouveau match',exact:true}).click();
  await p.getByLabel('Adversaire',{exact:true}).fill('Match créé depuis le dashboard');
  await p.getByLabel('Date',{exact:true}).fill(new Date(Date.now()+20*86400000).toISOString().slice(0,10));
  const fail=route=>route.request().method()==='POST'?route.abort('failed'):route.continue();
  await p.route('**/api/matches',fail);await p.getByRole('button',{name:'Créer le match',exact:true}).click();await p.getByRole('dialog').getByRole('alert').waitFor();
  assert.equal(await p.getByLabel('Adversaire',{exact:true}).inputValue(),'Match créé depuis le dashboard');
  await p.setViewportSize({width:375,height:420});await p.getByRole('button',{name:'Créer le match',exact:true}).scrollIntoViewIfNeeded();
  const box=await p.getByRole('button',{name:'Créer le match',exact:true}).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=420);
  await p.screenshot({path:q.out+'/dashboard-create-small-height.png'});
  await p.unroute('**/api/matches',fail);await p.getByRole('button',{name:'Créer le match',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});
  const made=await q.call('GET',`/matches?teamId=${f.team.id}&limit=100`);assert.equal(made.data.filter(m=>m.opponent==='Match créé depuis le dashboard').length,1);
  await p.setViewportSize({width:1280,height:900});await p.getByRole('button',{name:'Nouveau match',exact:true}).click();
  for(let i=0;i<15;i++){await p.keyboard.press('Tab');assert.ok(await p.evaluate(()=>!document.hasFocus()||Boolean(document.activeElement?.closest('dialog'))));}
  await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(await p.locator(':focus').innerText(),'Nouveau match');
  // Second team has neither the first team's match nor its statistics.
  await choose('Seniors Démo','U17 QA');
  await p.getByRole('heading',{name:'Le prochain match commence ici.',exact:true}).waitFor();
  await p.getByRole('heading',{name:'Le bilan se construit au fil des matchs.',exact:true}).waitFor();
  assert.equal(await p.getByText('FC Gouvieux',{exact:true}).count(),0);
  await p.screenshot({path:q.out+'/dashboard-empty.png'});
  await p.getByRole('link',{name:'Ajouter mes joueurs',exact:true}).click();await p.waitForURL('**/dashboard/joueurs');await p.getByRole('heading',{name:'À vous de composer l’effectif'}).waitFor();
  await p.goto(q.base+'/dashboard');await choose('U17 QA','Seniors QA');
  assert.deepEqual(q.errors,[]);
  fs.writeFileSync(q.out+'/dashboard-evidence.json',JSON.stringify({team:f.team.name,players:22,seededMatches:13,viewports:[375,768,1280],data:await get('SEASON')},null,2));
  q.results.push({scenario:'Dashboard équipe',status:'PASS',checks:['totaux API/UI et parite effectif','3 periodes','scores exterieur','historique archive','autorisation et validation','responsive 375/768/1280','cibles tactiles','direct et cloture','prochain match et presences','creation reseau/reessai','dialogue clavier/petite hauteur','ancienne reponse ignoree','erreur/reessai lecture','equipe vide et isolation']});
  console.log('PASS DASHBOARD: API, UI, data, responsive, forms, navigation and network cases');
}
