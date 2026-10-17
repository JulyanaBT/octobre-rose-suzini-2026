// Rotation engine adapted from JulyanaBT/portesouvertes2026.
// Preserves partner/opponent weights and 1500 candidate attempts.
export function generateRound(participants, matches, roundNumber) {
 const players = participants;
 const COURTS = ['Terrain BT 1', 'Terrain BT 2'];
 const MAX_PLAYERS_ON_COURT = 8;
 const activePlayers = () => players.filter(p => p.activity === 'bt' && p.present);
 const shuffle = a => { const r=[...a]; for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; };
function createStats(
  sourceMatches
) {
  const stats =
    new Map();
  players.forEach(
    player => {
      stats.set(
        player.id,
        {
          played: 0,
          bench: 0,
          partners:
            new Map(),
          opponents:
            new Map()
        }
      );
    }
  );
  const roundMap =
    new Map();
  sourceMatches.forEach(
    match => {
      const roundNumber =
        Number(
          match.roundNumber
        );
      if (
        !roundMap.has(
          roundNumber
        )
      ) {
        roundMap.set(
          roundNumber,
          []
        );
      }
      roundMap
        .get(roundNumber)
        .push(match);
    }
  );
  roundMap.forEach(
    roundMatches => {
      const bench =
        roundMatches.find(
          match =>
            Array.isArray(
              match.bench
            )
        )?.bench || [];
      bench.forEach(
        playerId => {
          if (
            stats.has(
              playerId
            )
          ) {
            stats.get(
              playerId
            ).bench++;
          }
        }
      );
    }
  );
  sourceMatches.forEach(
    match => {
      const teamA =
        Array.isArray(
          match.teamA
        )
          ? match.teamA
          : [];
      const teamB =
        Array.isArray(
          match.teamB
        )
          ? match.teamB
          : [];
      [
        ...teamA,
        ...teamB
      ].forEach(
        playerId => {
          if (
            stats.has(
              playerId
            )
          ) {
            stats.get(
              playerId
            ).played++;
          }
        }
      );
      if (
        teamA.length === 2
      ) {
        addPartner(
          stats,
          teamA[0],
          teamA[1]
        );
      }
      if (
        teamB.length === 2
      ) {
        addPartner(
          stats,
          teamB[0],
          teamB[1]
        );
      }
      teamA.forEach(
        playerA => {
          teamB.forEach(
            playerB => {
              addOpponent(
                stats,
                playerA,
                playerB
              );
              addOpponent(
                stats,
                playerB,
                playerA
              );
            }
          );
        }
      );
    }
  );
  return stats;
}
function addPartner(
  stats,
  playerA,
  playerB
) {
  if (
    !stats.has(playerA) ||
    !stats.has(playerB)
  ) {
    return;
  }
  const partnersA =
    stats.get(
      playerA
    ).partners;
  const partnersB =
    stats.get(
      playerB
    ).partners;
  partnersA.set(
    playerB,
    (
      partnersA.get(
        playerB
      ) || 0
    ) + 1
  );
  partnersB.set(
    playerA,
    (
      partnersB.get(
        playerA
      ) || 0
    ) + 1
  );
}
function addOpponent(
  stats,
  playerA,
  playerB
) {
  if (
    !stats.has(
      playerA
    )
  ) {
    return;
  }
  const opponents =
    stats.get(
      playerA
    ).opponents;
  opponents.set(
    playerB,
    (
      opponents.get(
        playerB
      ) || 0
    ) + 1
  );
}
/* ========================================
   SELECTION DES JOUEURS
======================================== */
function choosePlayers(
  activeList,
  sourceMatches
) {
  const stats =
    createStats(
      sourceMatches
    );
  const ranked =
    [...activeList]
      .sort(
        (a, b) => {
          const statsA =
            stats.get(a.id) || {};
          const statsB =
            stats.get(b.id) || {};
          /*
           * Priorité :
           *
           * 1. moins de matchs joués
           * 2. plus de passages au banc
           * 3. hasard
           */
          if (
            (statsA.played || 0) !==
            (statsB.played || 0)
          ) {
            return (
              (statsA.played || 0) -
              (statsB.played || 0)
            );
          }
          if (
            (statsA.bench || 0) !==
            (statsB.bench || 0)
          ) {
            return (
              (statsB.bench || 0) -
              (statsA.bench || 0)
            );
          }
          return (
            Math.random() -
            .5
          );
        }
      );
  const playingCount =
    Math.min(
      MAX_PLAYERS_ON_COURT,
      Math.floor(
        ranked.length / 4
      ) * 4
    );
  if (
    playingCount < 4
  ) {
    throw new Error(
      "Il faut au moins 4 joueurs actifs."
    );
  }
  return {
    selected:
      ranked.slice(
        0,
        playingCount
      ),
    bench:
      ranked
        .slice(
          playingCount
        )
        .map(
          player =>
            player.id
        )
  };
}
/* ========================================
   QUALITE D'UNE COMPOSITION
======================================== */
function arrangementScore(
  ids,
  sourceMatches
) {
  const stats =
    createStats(
      sourceMatches
    );
  let score = 0;
  for (
    let i = 0;
    i < ids.length;
    i += 4
  ) {
    const teamA = [
      ids[i],
      ids[i + 1]
    ];
    const teamB = [
      ids[i + 2],
      ids[i + 3]
    ];
    const partnerA =
      stats
        .get(teamA[0])
        ?.partners
        .get(teamA[1]) || 0;
    const partnerB =
      stats
        .get(teamB[0])
        ?.partners
        .get(teamB[1]) || 0;
    /*
     * Rejouer avec le même partenaire
     * est fortement pénalisé.
     */
    score +=
      partnerA * 1000;
    score +=
      partnerB * 1000;
    /*
     * Rejouer contre le même adversaire
     * est également pénalisé,
     * mais moins fortement.
     */
    teamA.forEach(
      playerA => {
        teamB.forEach(
          playerB => {
            score +=
              (
                stats
                  .get(playerA)
                  ?.opponents
                  .get(playerB) ||
                0
              ) * 120;
          }
        );
      }
    );
  }
  return score;
}
/* ========================================
   CREATION D'UN TOUR
======================================== */
function buildRound(
  roundNumber,
  sourceMatches
) {
  const activeList =
    activePlayers();
  const {
    selected,
    bench
  } =
    choosePlayers(
      activeList,
      sourceMatches
    );
  const selectedIds =
    selected.map(
      player =>
        player.id
    );
  let bestIds = null;
  let bestScore =
    Infinity;
  /*
   * On essaie beaucoup de combinaisons
   * et on garde la meilleure.
   */
  for (
    let attempt = 0;
    attempt < 1500;
    attempt++
  ) {
    const candidate =
      shuffle(
        selectedIds
      );
    const score =
      arrangementScore(
        candidate,
        sourceMatches
      );
    if (
      score < bestScore
    ) {
      bestScore =
        score;
      bestIds =
        candidate;
    }
  }
  const generated =
    [];
  for (
    let index = 0;
    index < bestIds.length / 4;
    index++
  ) {
    const base =
      index * 4;
    generated.push({
      roundNumber,
      matchIndex:
        index + 1,
      court:
        COURTS[index] ||
        `Terrain ${index + 1}`,
      teamA: [
        bestIds[base],
        bestIds[base + 1]
      ],
      teamB: [
        bestIds[base + 2],
        bestIds[base + 3]
      ],
      bench,
      scoreA:
        null,
      scoreB:
        null,
      status:
        "pending",
      winner:
        null
    });
  }
  return generated;
}
/* ========================================
   ENREGISTRER UN TOUR
======================================== */
return buildRound(roundNumber,matches);
}

export function ranking(players,matches) {
 const rows=new Map(players.map(p=>[p.id,{id:p.id,name:p.name,played:0,wins:0,turns:0,bonus:0,results:[]}]));
 const rounds=new Map();
 for(const m of matches){if(!rounds.has(m.roundNumber)) rounds.set(m.roundNumber,[]); rounds.get(m.roundNumber).push(m);}
 for(const ms of rounds.values()){
  const active=new Set(ms.flatMap(m=>[...m.teamA,...m.teamB]));
  for(const id of (ms.find(m=>m.bench?.length)?.bench||[])) active.add(id);
  for(const id of active){const r=rows.get(id);if(r){r.turns++;r.bonus+=2;}}
 }
 for(const m of matches){
  if(m.status!=='completed')continue;
  const a=m.scoreA,b=m.scoreB;
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a===b)continue;
  for(const [team,scored,conceded] of [[m.teamA,a,b],[m.teamB,b,a]]) for(const id of team){
   const r=rows.get(id);if(!r)continue;r.played++;r.wins+=Number(scored>conceded);
   r.results.push({points:scored>conceded?2:1,diff:scored-conceded,scored,conceded});
  }
 }
 return [...rows.values()].map(r=>{
  const best=r.results.sort((a,b)=>b.points-a.points||b.diff-a.diff||b.scored-a.scored).slice(0,10);
  return {...r,counted:best.length,points:best.reduce((n,v)=>n+v.points,0),scored:r.bonus+best.reduce((n,v)=>n+v.scored,0),diff:r.bonus+best.reduce((n,v)=>n+v.diff,0)};
 }).sort((a,b)=>b.points-a.points||b.diff-a.diff||b.scored-a.scored||a.name.localeCompare(b.name,'fr',{sensitivity:'base',numeric:true}));
}
export function assignedPending(id,matches) {
 return matches.some(m=>m.status!=='completed'&&[...m.teamA,...m.teamB].includes(id));
}
export function canChangeActivity(id,matches){return !assignedPending(id,matches);}
