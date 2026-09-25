
global.window = global;
window.OverlordBattleData = {
  TYPES: {
    attacker:{id:'attacker',name:'アタッカー',strongAgainst:['magic']},
    tank:{id:'tank',name:'タンク',strongAgainst:['attacker']},
    magic:{id:'magic',name:'マジックキャスター',strongAgainst:['tank']},
    noncombatant:{id:'noncombatant',name:'非戦闘員',strongAgainst:[]}
  }
};
require('./battle-logic.js');

const { resolveBattle } = window.OverlordBattleLogic;
const eq = (a,b,label) => { if(a!==b) throw new Error(`${label}: ${a} !== ${b}`); };

const momonga = {
  battleType:'magic',
  battleTags:['supreme_41'],
  battleAbility:'guild_master'
};
const touchme = {
  battleType:'attacker', // test fixture only
  battleTags:['supreme_41'],
  battleAbility:'world_champion'
};

eq(resolveBattle({battleType:'attacker'},{battleType:'magic'}).resultA,'WIN','attacker > magic');
eq(resolveBattle({battleType:'magic'},{battleType:'tank'}).resultA,'WIN','magic > tank');
eq(resolveBattle({battleType:'tank'},{battleType:'attacker'}).resultA,'WIN','tank > attacker');
eq(resolveBattle({battleType:'attacker'},{battleType:'attacker'}).resultA,'DRAW','same type');
eq(resolveBattle(touchme,{battleType:'tank'}).resultA,'WIN','touchme');
eq(resolveBattle(momonga,touchme).resultA,'DRAW','momonga vs touchme');
eq(resolveBattle(touchme,momonga).resultA,'DRAW','touchme vs momonga');


const noncombatant = { battleType:'noncombatant' };

eq(resolveBattle(noncombatant,{battleType:'attacker'}).resultA,'LOSE','noncombatant < attacker');
eq(resolveBattle(noncombatant,{battleType:'tank'}).resultA,'LOSE','noncombatant < tank');
eq(resolveBattle(noncombatant,{battleType:'magic'}).resultA,'LOSE','noncombatant < magic');
eq(resolveBattle(noncombatant,noncombatant).resultA,'DRAW','noncombatant draw');

eq(resolveBattle(noncombatant,touchme).resultA,'WIN','noncombatant beats touchme');
eq(resolveBattle(touchme,noncombatant).resultA,'LOSE','touchme loses to noncombatant');

console.log('battle tests: OK');
