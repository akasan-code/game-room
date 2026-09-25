require('./element-puzzle-core.js');

const C = global.ElementPuzzleCore;
function assert(cond, label) {
  if (!cond) throw new Error(label);
}

const size = 7;
const noMatch = [
  'element','crystal','rune','gem','arcane','element','crystal',
  'crystal','rune','gem','arcane','element','crystal','rune',
  'rune','gem','arcane','element','crystal','rune','gem',
  'gem','arcane','element','crystal','rune','gem','arcane',
  'arcane','element','crystal','rune','gem','arcane','element',
  'element','crystal','rune','gem','arcane','element','crystal',
  'crystal','rune','gem','arcane','element','crystal','rune'
];

assert(C.findMatches(noMatch, size).size === 0, 'base board should have no matches');

const rowMatch = [...noMatch];
rowMatch[0] = 'element';
rowMatch[1] = 'element';
rowMatch[2] = 'element';
assert(C.findMatches(rowMatch, size).has(0), 'horizontal match');

const colMatch = [...noMatch];
colMatch[0] = 'gem';
colMatch[7] = 'gem';
colMatch[14] = 'gem';
assert(C.findMatches(colMatch, size).has(14), 'vertical match');

assert(C.isAdjacent(0,1,size), 'horizontal adjacent');
assert(C.isAdjacent(0,7,size), 'vertical adjacent');
assert(!C.isAdjacent(0,8,size), 'diagonal not adjacent');

for (let i = 0; i < 40; i++) {
  const board = C.generateInitialBoard();
  assert(C.findMatches(board).size === 0, 'initial board has no auto match');
  assert(C.hasLegalMove(board), 'initial board has legal move');
}

assert(C.scoreForRemoval(3, 1) === 300, 'score chain 1');
assert(C.scoreForRemoval(3, 3) === 900, 'score chain 3');

console.log('element puzzle tests: OK');
