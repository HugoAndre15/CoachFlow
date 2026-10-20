import assert from 'node:assert/strict';
import fs from 'node:fs';
export default async function(q){
 const p=q.page;
 p.setDefaultTimeout(30000);p.setDefaultNavigationTimeout(60000);
 const resume=q.match&&(await q.call('GET','/matches/'+q.match.id)).status==='LIVE';
 if(!resume){
 const presenceRow=name=>p.getByText(name,{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
 if(!q.match){
 await p.goto(q.base+'/dashboard/matchs');
 await p.getByRole('button',{name:'Nouveau match',exact:true}).first().click();
 await p.getByPlaceholder('Ex: FC Barcelona').fill('FC Recette adverse');
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 await p.locator('input[type=date]').fill(yesterday);await p.locator('input[type=time]').fill('15:00');
 const made=p.waitForResponse(r=>r.url().endsWith('/api/matches')&&r.request().method()==='POST');
 await p.getByRole('button',{name:'Créer le match',exact:true}).click();q.match=await (await made).json();assert.ok(q.match.id);
 await p.getByRole('button',{name:'Préparer le match',exact:true}).click();
 await p.getByRole('heading',{name:'Qui sera là ?',exact:true}).waitFor();
 for(const name of ['Lucas Test','Émile Le Goff','Noah Entrant','Hugo Banc'])await presenceRow(name).getByRole('button',{name:'Présent',exact:true}).click();
 await presenceRow('Adam Absent').getByRole('button',{name:'Absent',exact:true}).click();
 await presenceRow('Mattéo Incertain').getByRole('button',{name:'Incertain',exact:true}).click();
 await p.screenshot({path:q.out+'/match-presences.png'});
 await p.getByRole('button',{name:'Passer à la composition'}).click();
 for(const name of ['Lucas Test','Émile Le Goff'])await presenceRow(name).getByRole('button',{name:'Titulaire',exact:true}).click();
 for(const name of ['Noah Entrant','Hugo Banc'])await presenceRow(name).getByRole('button',{name:'Remplaçant',exact:true}).click();
 await p.getByRole('button',{name:'Enregistrer',exact:true}).click();
 await p.getByText('Préparation enregistrée',{exact:true}).waitFor().catch(async()=>{
  const detail=await q.call('GET','/matches/'+q.match.id);assert.equal(detail.matchPlayers.filter(x=>x.presence==='PRESENT').length,4);
 });
 await p.reload();
 }else await p.goto(q.base+'/dashboard/matchs/'+q.match.id);
 await p.getByRole('button',{name:'Lancer le direct',exact:true}).click();
 await p.getByRole('alert').filter({hasText:/présences? à renseigner/}).waitFor();
 for(const [name,status] of [['Paul Non renseigné','Incertain'],['Jean-Baptiste de La Roche-Saint-André de Beauregard','Absent'],['Antoine Suspendu','Absent']])await presenceRow(name).getByRole('button',{name:status,exact:true}).click();
 await p.getByRole('button',{name:'Lancer le direct',exact:true}).click();
 await p.getByRole('button',{name:'But pour nous',exact:true}).waitFor();
 const state=await q.call('GET','/matches/'+q.match.id);assert.equal(state.status,'LIVE');
 const before=await q.call('GET','/players/overview?teamId='+q.team.id+'&period=ALL');assert.equal(before.meta.completed_matches,0);
 await p.evaluate(id=>localStorage.setItem('chrono_'+id,JSON.stringify({paused:true,elapsed:720})),q.match.id);await p.reload();
 await p.getByText('12:00',{exact:true}).waitFor();
 await p.getByRole('button',{name:'But pour nous',exact:true}).click();
 await p.getByRole('button',{name:/Lucas Test/}).click();
 await p.getByRole('button',{name:/Att\.\s*Centre/}).click();
 await p.locator('svg g').filter({has:p.getByText('Tête',{exact:true})}).click();
 await p.getByRole('heading',{name:'Passe décisive ?',exact:true}).waitFor();
 await p.getByRole('button',{name:/Émile Le Goff/}).click();
 await p.getByRole('button',{name:'Passer (pas de zone)',exact:true}).click();
 await p.getByRole('button',{name:'Passer',exact:true}).click();
 await p.getByRole('heading',{name:'Partie du corps',exact:true}).waitFor({state:'hidden'});
 await p.getByRole('button',{name:'Changement',exact:true}).click();
 await p.getByRole('button',{name:/Lucas Test/}).click();await p.getByRole('heading',{name:'Joueur entrant',exact:true}).waitFor();
 await p.getByRole('button',{name:/Noah Entrant/}).click();await p.getByRole('heading',{name:'Joueur entrant',exact:true}).waitFor({state:'hidden'});
 }else await p.goto(q.base+'/dashboard/direct?matchId='+q.match.id);
 await p.screenshot({path:q.out+'/match-live.png',timeout:45000});
 await p.getByRole('button',{name:'Terminer',exact:true}).click();await p.getByRole('button',{name:'Terminer le match',exact:true}).click();
 await p.waitForURL('**/dashboard/matchs/'+q.match.id);
 const detail=await q.call('GET','/matches/'+q.match.id);assert.equal(detail.status,'FINISHED');
 const goal=detail.matchEvents.find(x=>x.event_type==='GOAL');assert.equal(goal.minute,12);assert.equal(goal.zone,'ATT_CENTER');assert.equal(goal.body_part,'HEAD');
 assert.equal(detail.matchEvents.filter(x=>x.event_type==='ASSIST').length,1);assert.equal(detail.matchEvents.filter(x=>x.event_type==='SUBSTITUTION').length,1);
 await p.screenshot({path:q.out+'/match-finished.png'});
 await p.goto(q.base+'/dashboard/joueurs');await p.getByText('1 match terminé sur la période',{exact:true}).waitFor();
 q.overview=await q.call('GET','/players/overview?teamId='+q.team.id+'&period=ALL');
 const stats=key=>q.overview.players.find(x=>x.id===q.players[key].id).stats;
 for(const key of ['lucas','emile','noah'])assert.equal(stats(key).total_matches,1,key);
 assert.equal(stats('lucas').matches_as_starter,1);assert.equal(stats('lucas').goals,1);assert.equal(stats('emile').assists,1);
 assert.equal(stats('noah').matches_as_starter,0);assert.equal(stats('noah').matches_as_substitute,1);
 assert.equal(stats('hugo').total_matches,0);assert.equal(stats('hugo').unused_substitute,1);assert.equal(stats('hugo').attendance.present,1);
 assert.equal(stats('adam').attendance.rate,0);assert.equal(stats('adam').total_matches,0);assert.equal(stats('matteo').attendance.rate,null);assert.equal(stats('matteo').attendance.uncertain,1);
 for(const key of ['lucas','emile','noah','hugo'])assert.equal(stats(key).attendance.rate,100);
 fs.writeFileSync(q.out+'/match-overview.json',JSON.stringify(q.overview,null,2));
 for(const [key,checks] of [['lucas',{'Matchs joués':'1','Titularisations':'1','Buts':'1'}],['emile',{'Passes décisives':'1'}],['noah',{'Entrées en jeu':'1','Titularisations':'0'}],['hugo',{'Matchs joués':'0','Sur le banc, sans entrer':'1'}],['adam',{'Absent':'1'}],['matteo',{'Présence incertaine':'1'}]]) {
  const pl=q.players[key];await p.getByRole('button',{name:'Ouvrir la fiche de '+pl.first_name+' '+pl.last_name,exact:true}).click();
  for(const [label,wanted] of Object.entries(checks)){const got=await p.getByRole('dialog').locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('dd').innerText();assert.equal(got,wanted,key+' '+label);}
  await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});
 }
 q.results.push({scenario:'Match complet vers tableau joueurs',status:'PASS',checks:['creation UI','presences sauvegardees','composition sauvegardee','live exclu des stats','but minute 12 zone/corps','passe decisive','remplacement','fin match','chiffres API et fiches UI']});
 console.log('PASS MATCH: UI creation -> presences -> direct -> goal/assist/sub -> finish -> 6 player sheets validated');
}
