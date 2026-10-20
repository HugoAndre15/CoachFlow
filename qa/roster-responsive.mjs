import assert from 'node:assert/strict';
import fs from 'node:fs';
export default async function(q){
 const p=q.page;
 q.layouts=[];
 for(const [width,height] of [[375,812],[768,1024],[1280,900]]) {
  await p.setViewportSize({width,height});await p.goto(q.base+'/dashboard/joueurs');
  await p.getByRole('heading',{name:'L’effectif',exact:true}).waitFor();
  await p.getByText('1 match terminé sur la période',{exact:true}).waitFor();
  const opens=()=>p.getByRole('button',{name:/Ouvrir la fiche/});
  const initial=await p.evaluate(()=>({viewport:innerWidth,body:document.body.scrollWidth,main:document.querySelector('main').clientWidth,mainScroll:document.querySelector('main').scrollWidth,font:getComputedStyle(document.body).fontFamily}));
  assert.ok(initial.body<=width,`body overflow ${width}: ${JSON.stringify(initial)}`);assert.ok(initial.mainScroll<=initial.main+1,`main overflow ${width}`);
  if(width<768){assert.equal(await p.getByRole('list',{name:'Liste des joueurs'}).isVisible(),true);assert.equal(await p.getByRole('table').isVisible(),false);}
  else{assert.equal(await p.getByRole('table').isVisible(),true);}
  await p.getByLabel('Rechercher un joueur par nom ou numéro').fill('le emile 8');
  await p.getByText('1 joueur affiché',{exact:true}).waitFor();assert.match(await opens().innerText(),/Émile Le Goff/);
  await p.getByRole('button',{name:'Effacer la recherche',exact:true}).click();
  await p.getByLabel('Filtrer par poste').selectOption('DEFENDER');await p.getByLabel('Filtrer par disponibilité').selectOption('INJURED');
  await p.getByText('1 joueur affiché',{exact:true}).waitFor();assert.match(await opens().innerText(),/Jean-Baptiste/);
  await opens().click();let rect=await p.getByRole('dialog').boundingBox();assert.ok(rect.x>=-1&&rect.x+rect.width<=width+1);assert.ok(rect.height<=height+1);
  await p.getByRole('dialog').screenshot({path:q.out+`/long-name-${width}.png`});
  await p.getByRole('button',{name:'Fermer',exact:true}).click();
  await p.getByRole('button',{name:'Effacer les filtres',exact:true}).click();
  await p.getByLabel('Trier par',{exact:true}).selectOption('goals');
  assert.match(await opens().first().innerText(),/Lucas Test/);
  await p.getByLabel('Rechercher un joueur par nom ou numéro').fill('Joueur introuvable');await p.getByRole('heading',{name:'Aucun joueur dans cette sélection'}).waitFor();
  await p.getByRole('button',{name:'Voir l’effectif actuel',exact:true}).click();await opens().first().waitFor();
  await p.locator('main').evaluate(e=>e.scrollTop=0);await p.screenshot({path:q.out+`/roster-${width}.png`});
  if(width===768){
   const region=p.getByRole('region',{name:'Tableau des joueurs, défilement horizontal si nécessaire'});
   const identity=p.locator('tbody th').first();const left=(await identity.boundingBox()).x;
   await region.evaluate(e=>e.scrollLeft=300);assert.ok(Math.abs((await identity.boundingBox()).x-left)<=1);
   assert.ok(await region.evaluate(e=>e.scrollWidth>e.clientWidth));await p.screenshot({path:q.out+'/tablet-scroll.png'});
   await region.evaluate(e=>e.scrollLeft=0);
  }
  await opens().filter({hasText:'Lucas Test'}).click();
  assert.equal(await p.getByRole('dialog').locator('dt').filter({hasText:/^Buts$/}).locator('..').locator('dd').innerText(),'1');
  await p.getByText('Détail des buts',{exact:true}).click();
  await p.getByText('Attaque · centre',{exact:true}).scrollIntoViewIfNeeded();
  assert.equal(await p.getByText('Tête',{exact:true}).count(),1);
  await p.getByRole('dialog').screenshot({path:q.out+`/player-details-${width}.png`});
  await p.getByRole('button',{name:'Modifier la fiche',exact:true}).click();
  await p.locator('#player-first-name').fill('Lucas');
  await p.getByRole('dialog').screenshot({path:q.out+`/player-form-${width}.png`});
  const controls=await p.getByRole('dialog').locator('input,select,button').evaluateAll(es=>es.map(e=>({tag:e.tagName,height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontSize})));assert.ok(controls.every(c=>c.height>=43.9));
  if(width===375){await p.setViewportSize({width:375,height:420});await p.locator('#player-last-name').fill('Test');await p.getByRole('button',{name:'Enregistrer',exact:true}).scrollIntoViewIfNeeded();
   const b=await p.getByRole('button',{name:'Enregistrer',exact:true}).boundingBox();assert.ok(b.y>=0&&b.y+b.height<=420);await p.screenshot({path:q.out+'/mobile-reduced-height-form.png'});await p.setViewportSize({width,height});}
  await p.getByRole('button',{name:'Annuler',exact:true}).click();
  q.layouts.push({width,height,...initial,checks:'search, filters, empty state, sort, long names, drawer, form, overflow OK'});
  console.log('PASS viewport '+width+'x'+height);
 }
 fs.writeFileSync(q.out+'/layouts.json',JSON.stringify(q.layouts,null,2));
 q.results.push({scenario:'Lecture et responsive',status:'PASS',viewports:q.layouts.map(x=>x.width),checks:['recherche accents/numero','filtres combines','tri buts','etat vide','noms longs','tablette scroll identite fixe','fiche et formulaire mobile','zone/corps','champs tactiles 44px','petite hauteur']});
}
