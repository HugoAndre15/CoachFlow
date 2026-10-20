import assert from 'node:assert/strict';
export default async function(q){
 const p=q.page;
 const open=()=>p.getByRole('button',{name:'Ouvrir la fiche de Lucas Test',exact:true}).click();
 const saved=()=>p.getByRole('dialog').waitFor({state:'hidden'});
 const getLucas=async()=>{const r=await q.call('GET','/players/overview?teamId='+q.team.id+'&period=ALL');return r.players.find(x=>x.first_name==='Lucas'&&x.last_name==='Test');};
 if(await p.getByRole('dialog').isVisible()){await p.getByRole('button',{name:'Fermer',exact:true}).click();await saved();}
 let row;
 if(!q.players.lucas){
 await p.getByRole('button',{name:'Ajouter un joueur',exact:true}).click();
 await p.getByLabel('Prénom').fill('Lucas');
 await p.locator('#player-last-name').fill('Test');
 await p.getByRole('button',{name:'Ajouter le joueur',exact:true}).click();await saved();
 q.players.lucas=await getLucas();assert.ok(q.players.lucas);assert.equal(q.players.lucas.jersey_number,null);
 console.log('PASS creation minimale via UI');
 await open();await p.getByRole('button',{name:'Modifier la fiche',exact:true}).click();
 await p.locator('#player-position').selectOption('FORWARD');await p.locator('#player-number').fill('9');await p.locator('#player-foot').selectOption('LEFT');
 await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await saved();
 row=await getLucas();assert.equal(row.position,'FORWARD');assert.equal(row.jersey_number,9);assert.equal(row.strong_foot,'LEFT');
 await open();await p.getByRole('button',{name:'Modifier la fiche',exact:true}).click();
 await p.locator('#player-number').fill('');await p.locator('#player-foot').selectOption('');
 await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await saved();await p.reload();await open();
 assert.match(await p.getByRole('dialog').innerText(),/Pied : non renseigné/);
 row=await getLucas();assert.equal(row.jersey_number,null);assert.equal(row.strong_foot,null);
 console.log('PASS modification + effacement numero/pied + rechargement');
 }else{row=await getLucas();await open();}
 await p.keyboard.press('Escape');await saved();
 assert.match(await p.locator(':focus').getAttribute('aria-label'),/Lucas Test/);
 await open();for(let i=0;i<18;i++){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!document.hasFocus()||Boolean(document.activeElement?.closest('dialog'))),true);}
 await p.keyboard.press('Escape');await saved();
 console.log('PASS Echap, focus retourne au joueur, Tab reste dans le dialogue');
 await open();await p.getByRole('button',{name:'Modifier la fiche',exact:true}).click();await p.locator('#player-number').fill('19');
 const route=async r=>r.request().method()==='PATCH'?r.abort('failed'):r.continue();
 await p.route('**/api/players/'+row.id,route);
 await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await p.getByRole('dialog').getByRole('alert').waitFor();
 assert.equal(await p.locator('#player-number').inputValue(),'19');assert.equal((await getLucas()).jersey_number,null);
 await p.screenshot({path:q.out+'/save-network-error.png'});
 await p.unroute('**/api/players/'+row.id,route);await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await saved();
 assert.equal((await getLucas()).jersey_number,19);
 console.log('PASS echec reseau conserve saisie et reessai persiste');
 await open();await p.getByRole('button',{name:'Archiver',exact:true}).click();await p.getByRole('dialog',{name:'Archiver ce joueur ?'}).getByRole('button',{name:'Archiver',exact:true}).click();await saved();
 await p.getByRole('button',{name:'Ouvrir la fiche de Lucas Test',exact:true}).waitFor({state:'hidden'});
 await p.getByLabel('Filtrer par disponibilité').selectOption('RETIRED');await open();
 await p.getByRole('button',{name:'Modifier / réintégrer',exact:true}).click();await p.getByLabel('Disponibilité',{exact:true}).selectOption('ACTIVE');
 await p.getByRole('button',{name:'Enregistrer',exact:true}).click();await saved();await open();
 assert.equal((await getLucas()).status,'ACTIVE');await p.keyboard.press('Escape');await saved();
 q.results.push({scenario:'Gestion joueur',status:'PASS',checks:['creation minimale','edition','effacement champs optionnels persiste','rechargement','archivage/reintegration','erreur reseau/reessai','Tab/Echap/focus']});
 console.log('PASS archivage et reintegration');
}
