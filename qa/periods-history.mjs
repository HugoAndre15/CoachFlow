import assert from 'node:assert/strict';
export default async function(q){
 const p=q.page;await p.setViewportSize({width:1280,height:900});
 const makeMatch=async(date,label)=>{
  const m=await q.call('POST','/matches',{team_id:q.team.id,opponent:label,location:'HOME',match_date:date.toISOString()});
  await q.call('POST',`/matches/${m.id}/players`,{players:['emile','hugo'].map(k=>({player_id:q.players[k].id,presence:'PRESENT',status:'STARTER'}))});
  await q.call('PATCH',`/matches/${m.id}/status`,{status:'LIVE'});
  await q.call('POST',`/matches/${m.id}/events`,{player_id:q.players.emile.id,event_type:'GOAL',minute:10});
  await q.call('PATCH',`/matches/${m.id}/status`,{status:'FINISHED'});return m;
 };
 const now=new Date();const season=new Date(Date.UTC(now.getUTCFullYear()-(now.getUTCMonth()<6?1:0),6,1));
 const older=new Date(Date.now()-40*86400000);
 await makeMatch(older,'Historique ancien');await makeMatch(new Date(+season-45*86400000),'Saison precedente');await makeMatch(new Date(Date.now()+7*86400000),'Futur termine exclu');
 const seasonGoals=older>=season?1:0;
 const seasonCount=(new Date(q.match.match_date)>=season?1:0)+seasonGoals;
 await p.goto(q.base+'/dashboard/joueurs');
 for(const [period,count,goals] of [['ALL',3,2],['SEASON',seasonCount,seasonGoals],['LAST_30_DAYS',1,0]]){
  await p.getByLabel('Période',{exact:true}).selectOption(period);
  const ov=await q.call('GET',`/players/overview?teamId=${q.team.id}&period=${period}`);
  assert.equal(ov.meta.completed_matches,count);assert.equal(ov.players.find(x=>x.id===q.players.emile.id).stats.goals,goals);
  await p.getByText(`${count} match${count>1?'s':''} terminé${count>1?'s':''} sur la période`,{exact:true}).waitFor();
 }
 console.log('PASS periodes: 3 tous / '+seasonCount+' saison / 1 recent ; match futur exclu');
 let release,noticed;const gate=new Promise(r=>release=r);const got=new Promise(r=>noticed=r);
 const handler=async route=>{const response=await route.fetch();noticed();await gate;await route.fulfill({response});};
 await p.route('**/api/players/overview?*period=SEASON',handler);
 await p.getByLabel('Période',{exact:true}).selectOption('SEASON');await got;
 await p.getByLabel('Période',{exact:true}).selectOption('LAST_30_DAYS');await p.getByText('1 match terminé sur la période',{exact:true}).waitFor();
 const late=p.waitForResponse(r=>r.url().includes('period=SEASON'));release();await late;await p.unroute('**/api/players/overview?*period=SEASON',handler);
 assert.equal(await p.getByLabel('Période',{exact:true}).inputValue(),'LAST_30_DAYS');assert.equal(await p.getByText('1 match terminé sur la période',{exact:true}).isVisible(),true);
 console.log('PASS reponse ancienne periode ignoree');
 await p.getByLabel('Période',{exact:true}).selectOption('ALL');await p.getByText('3 matchs terminés sur la période',{exact:true}).waitFor();
 const before=(await q.call('GET',`/players/overview?teamId=${q.team.id}&period=ALL`)).players.find(x=>x.id===q.players.lucas.id).stats;
 await p.getByRole('button',{name:'Ouvrir la fiche de Lucas Test',exact:true}).click();await p.getByRole('button',{name:'Archiver',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Archiver',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});
 await p.getByLabel('Filtrer par disponibilité').selectOption('RETIRED');await p.getByRole('button',{name:'Ouvrir la fiche de Lucas Test',exact:true}).click();
 const archived=(await q.call('GET',`/players/overview?teamId=${q.team.id}&period=ALL`)).players.find(x=>x.id===q.players.lucas.id);
 assert.equal(archived.status,'RETIRED');assert.deepEqual(archived.stats,before);
 await p.getByRole('button',{name:'Modifier / réintégrer',exact:true}).click();await p.getByLabel('Disponibilité',{exact:true}).selectOption('ACTIVE');await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});
 const restored=(await q.call('GET',`/players/overview?teamId=${q.team.id}&period=ALL`)).players.find(x=>x.id===q.players.lucas.id);assert.deepEqual(restored.stats,before);
 await p.locator('header').getByRole('button',{name:/Seniors QA/}).click();await p.getByRole('button',{name:/U17 QA/}).click();
 await p.getByRole('heading',{name:'À vous de composer l’effectif'}).waitFor();assert.equal(await p.getByRole('button',{name:/Ouvrir la fiche/}).count(),0);
 assert.equal((await q.call('GET',`/players/overview?teamId=${q.teamB.id}&period=ALL`)).players.length,0);
 await p.locator('header').getByRole('button',{name:/U17 QA/}).click();await p.getByRole('button',{name:/Seniors QA/}).click();await p.getByRole('button',{name:'Ouvrir la fiche de Lucas Test',exact:true}).waitFor();
 q.results.push({scenario:'Periodes, historique, isolation',status:'PASS',checks:['tous/saison/30j','futur termine exclu','ancienne reponse ignoree','archivage conserve stats','reintegration conserve stats','equipe vide/isolation','403 externe']});
 console.log('PASS historique conserve apres archivage/reintegration et isolation 2 equipes');
}
