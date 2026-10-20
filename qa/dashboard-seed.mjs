/** Reusable, deterministic scenarios through the real API. No production credentials. */
export default async function(q) {
  if(q.dashboardFixture)return;
  const team=await q.call('POST','/teams',{name:'Seniors Démo',category:'Seniors',club_id:q.club.id});
  const names=[['Lucas','Martin'],['Émile','Le Goff'],['Noah','Bernard'],['Hugo','Dubois'],['Adam','Robert'],['Léo','Petit'],['Louis','Durand'],['Gabriel','Moreau'],['Arthur','Laurent'],['Jules','Lefebvre'],['Raphaël','Michel'],['Maël','Garcia'],['Nathan','Roux'],['Paul','Fournier'],['Tom','Girard'],['Sacha','André'],['Antoine','Leroy'],['Mathis','Garnier'],['Jean-Baptiste','de La Roche-Saint-André de Beauregard'],['Alexandre','Chevalier'],['Alexis','Ancien'],['Simon','Archive']];
  const players=[];
  for(let i=0;i<names.length;i++)players.push(await q.call('POST','/players',{team_id:team.id,first_name:names[i][0],last_name:names[i][1],jersey_number:i+1,position:i===0?'GOALKEEPER':i<8?'DEFENDER':i<15?'MIDFIELDER':'FORWARD'}));
  const now=new Date();const day=86400000;const season=new Date(Date.UTC(now.getUTCFullYear()-(now.getUTCMonth()<6?1:0),6,1));
  const fixtures=[];
  const make=async(days,opponent,scored=0,conceded=0,status='FINISHED',away=false)=>{
    const date=days instanceof Date?days:new Date(+now+days*day);
    const m=await q.call('POST','/matches',{team_id:team.id,opponent,location:away?'AWAY':'HOME',match_date:date.toISOString()});
    if(status!=='UPCOMING'){
      await q.call('POST',`/matches/${m.id}/players`,{players:players.slice(0,21).map((p,i)=>({player_id:p.id,status:i<10||i===20?'STARTER':'SUBSTITUTE',presence:i<16||i===20?'PRESENT':i<18?'ABSENT':'UNCERTAIN'}))});
      await q.call('PATCH',`/matches/${m.id}/status`,{status:'LIVE'});
      for(let i=0;i<scored;i++){
        const goal=await q.call('POST',`/matches/${m.id}/events`,{event_type:'GOAL',player_id:players[i===2?20:i%2].id,minute:10+i*7,zone:'ATT_CENTER',body_part:'RIGHT_FOOT'});
        await q.call('POST',`/matches/${m.id}/events`,{event_type:'ASSIST',player_id:players[2].id,minute:10+i*7,related_event_id:goal.id});
      }
      for(let i=0;i<conceded;i++)await q.call('POST',`/matches/${m.id}/opponent-events`,{event_type:'GOAL',minute:14+i*9});
      if(status==='FINISHED')await q.call('PATCH',`/matches/${m.id}/status`,{status:'FINISHED'});
    }
    const entry={...m,status,scored,conceded};fixtures.push(entry);return entry;
  };
  await make(-2,'US Chantilly',3,1);
  await make(-8,'AS Senlis',1,1,'FINISHED',true);
  await make(-15,'FC Compiègne',0,2,'FINISHED',true);
  await make(-22,'US Pont-Sainte-Maxence',2,0);
  await make(-40,'FC Creil',2,1);
  await make(-50,'AS Lamorlaye',0,0);
  await make(-60,'US Montataire',1,2,'FINISHED',true);
  await make(new Date(+season-45*day),'Ancienne saison',4,1);
  await make(9,'Futur terminé à exclure',5,0);
  const overdue=await make(-1,'Feuille à vérifier',0,0,'UPCOMING');
  const next=await make(4,'Union Sportive de Saint-Maximin et des Trois Forêts',0,0,'UPCOMING',true);
  await q.call('POST',`/matches/${next.id}/players`,{players:players.slice(0,12).map((p,i)=>({player_id:p.id,presence:i<10?'PRESENT':i===10?'ABSENT':'UNCERTAIN',status:i<10?'STARTER':'SUBSTITUTE'}))});
  await make(12,'AS Précy-sur-Oise',0,0,'UPCOMING');
  const live=await make(-0.1,'FC Gouvieux',1,0,'LIVE',true);
  for(const [index,status] of [[16,'INJURED'],[17,'INJURED'],[18,'INJURED'],[19,'SUSPENDED'],[20,'RETIRED'],[21,'RETIRED']])await q.call('PATCH',`/players/${players[index].id}`,{status});
  q.dashboardFixture={team,players,fixtures,live,next,overdue,season,now};
  console.log('DASHBOARD_SEED: 22 players, 13 matches, all statuses, historical archive and second team isolation');
}
