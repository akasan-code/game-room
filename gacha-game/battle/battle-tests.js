
global.window = global;
window.OverlordBattleData = {
  TYPES: {
    attacker:{id:'attacker',name:'アタッカー',strongAgainst:['magic']},
    tank:{id:'tank',name:'タンク',strongAgainst:['attacker']},
    magic:{id:'magic',name:'マジックキャスター',strongAgainst:['tank']}
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

console.log('battle tests: OK');
