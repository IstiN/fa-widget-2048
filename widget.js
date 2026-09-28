// 2048 — swipe-first mobile game with animation, localization, and Fa theme support.
(function () {
  var tiles = [], score = 0, best = 0, gameOver = false, won = false;
  var nextId = 1, panStart = null;
  var size = 320, gap = 6, cell = (size - gap * 5) / 4;
  var tileColors = {2:'#E2E8F0',4:'#CBD5E1',8:'#FBBF24',16:'#FB923C',32:'#F97316',64:'#EF4444',128:'#EAB308',256:'#A3E635',512:'#22C55E',1024:'#06B6D4',2048:'#8B5CF6'};
  var T = {
    en: {title:'2048', subtitle:'Merge matching tiles', score:'SCORE', best:'BEST', swipe:'Swipe the board in any direction', win:'🎉 You reached 2048! Keep going for a higher score.', over:'Game over — start a new game', newGame:'NEW GAME'},
    ru: {title:'2048 — Игра', subtitle:'Объединяй одинаковые плитки', score:'СЧЁТ', best:'РЕКОРД', swipe:'Свайпай по полю в любую сторону', win:'🎉 2048 собрана! Продолжай за рекорд.', over:'Игра окончена — начни заново', newGame:'НОВАЯ ИГРА'},
    es: {title:'2048 — Juego', subtitle:'Combina fichas iguales', score:'PUNTOS', best:'MEJOR', swipe:'Desliza el tablero en cualquier dirección', win:'🎉 ¡Has llegado a 2048! Sigue jugando.', over:'Fin de la partida — empieza de nuevo', newGame:'NUEVA PARTIDA'}
  };
  function tr(key) { var language = (jsr.locale || 'en').substring(0, 2); return (T[language] || T.en)[key] || T.en[key]; }
  function theme() { return jsr.theme; }

  function at(r, c) { var i; for (i = 0; i < tiles.length; i++) if (tiles[i].r === r && tiles[i].c === c) return tiles[i]; return null; }
  function emptyCells() { var out = [], r, c; for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) if (!at(r, c)) out.push([r, c]); return out; }
  function spawn() {
    var free = emptyCells(), p, tile;
    if (!free.length) return;
    p = free[Math.floor(Math.random() * free.length)];
    tile = {id:nextId++, r:p[0], c:p[1], value:Math.random() < 0.9 ? 2 : 4, fresh:true};
    tiles.push(tile);
    setTimeout(function () { tile.fresh = false; render(); }, 20);
  }
  function reset() { tiles = []; score = 0; gameOver = false; won = false; nextId = 1; spawn(); spawn(); render(); }
  function canMove() {
    var r, c, tile;
    if (emptyCells().length) return true;
    for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) {
      tile = at(r, c);
      if (c < 3 && tile.value === at(r, c + 1).value) return true;
      if (r < 3 && tile.value === at(r + 1, c).value) return true;
    }
    return false;
  }
  function lineFor(direction, fixed) {
    var list = [], i, tile;
    for (i = 0; i < 4; i++) { tile = (direction === 'left' || direction === 'right') ? at(fixed, i) : at(i, fixed); if (tile) list.push(tile); }
    if (direction === 'right' || direction === 'down') list.reverse();
    return list;
  }
  function move(direction) {
    var horizontal = direction === 'left' || direction === 'right';
    var reverse = direction === 'right' || direction === 'down';
    var fixed, line, target, i, tile, previous, changed = false, gained = 0, removed = [];
    if (gameOver) return;
    for (fixed = 0; fixed < 4; fixed++) {
      line = lineFor(direction, fixed); target = 0; previous = null;
      for (i = 0; i < line.length; i++) {
        tile = line[i];
        if (previous && previous.value === tile.value && !previous.merged) {
          previous.value *= 2; previous.merged = true; gained += previous.value; removed.push(tile); changed = true;
        } else {
          if (horizontal) { if (tile.c !== (reverse ? 3 - target : target)) changed = true; tile.c = reverse ? 3 - target : target; }
          else { if (tile.r !== (reverse ? 3 - target : target)) changed = true; tile.r = reverse ? 3 - target : target; }
          previous = tile; target++;
        }
      }
    }
    if (!changed && !removed.length) return;
    tiles = tiles.filter(function (tile) { return removed.indexOf(tile) < 0; });
    for (i = 0; i < tiles.length; i++) delete tiles[i].merged;
    score += gained; if (score > best) best = score;
    render();
    setTimeout(function () { spawn(); if (tiles.some(function (tile) { return tile.value >= 2048; })) won = true; gameOver = !canMove(); render(); }, 145);
  }
  function tileNode(tile) {
    var color = tileColors[tile.value] || theme().accent2;
    var darkText = tile.value === 2 || tile.value === 4;
    return {type:'animatedPositioned', key:'position-'+tile.id, left:gap + tile.c * (cell + gap), top:gap + tile.r * (cell + gap), width:cell, height:cell, duration:130, curve:'fastOutSlowIn', child:
      {type:'animatedContainer', key:'scale-'+tile.id, duration:130, curve:'fastOutSlowIn', transform:{scale:tile.fresh ? 0.68 : 1}, decoration:{color:color, borderRadius:12}, child:
        {type:'center', child:{type:'text', data:String(tile.value), style:{color:darkText ? '#172033' : '#FFFFFF', fontSize:tile.value >= 1000 ? 21 : tile.value >= 100 ? 25 : 31, fontWeight:'w800'}}}
      }
    };
  }
  function boardView() {
    var colors = theme(), children = [{type:'container', width:size, height:size, decoration:{color:colors.surfaceAlt, borderRadius:18, borderColor:colors.border, borderWidth:1}}], i;
    for (i = 0; i < tiles.length; i++) children.push(tileNode(tiles[i]));
    children.push({type:'gestureDetector', onPanStart:'pan_start', onPanEnd:'pan_end', child:{type:'container', width:size, height:size}});
    return {type:'stack', children:children};
  }
  function scoreBox(label, value) {
    var colors = theme();
    return {type:'container', margin:[0,0,0,14], padding:[8,13,8,13], decoration:{color:colors.surfaceAlt, borderRadius:10, borderColor:colors.border, borderWidth:1}, child:{type:'column', children:[
      {type:'text', data:label, style:{color:colors.muted, fontSize:9, fontWeight:'w700'}},
      {type:'text', data:String(value), style:{color:colors.text, fontSize:17, fontWeight:'w800'}}
    ]}};
  }
  function exportState() {
    var board = [], r, c, tile, maxTile = 0;
    for (r = 0; r < 4; r++) { board.push([]); for (c = 0; c < 4; c++) { tile = at(r, c); board[r].push(tile ? tile.value : 0); if (tile && tile.value > maxTile) maxTile = tile.value; } }
    jsr.exportState({score:score, best:best, maxTile:maxTile, status:gameOver ? 'over' : won ? 'won' : 'playing', emptyCells:emptyCells().length, board:board});
  }
  function render() {
    var colors = theme();
    exportState();
    var message = gameOver ? tr('over') : won ? tr('win') : tr('swipe');
    var messageColor = gameOver ? colors.error : won ? colors.accent2 : colors.muted;
    jsr.render({type:'container', decoration:{color:colors.background}, child:{type:'scroll', child:{type:'padding', padding:[20,16,28,16], child:{type:'column', crossAxisAlignment:'center', children:[
      {type:'row', crossAxisAlignment:'center', children:[
        {type:'column', crossAxisAlignment:'start', children:[{type:'text', data:tr('title'), style:{color:colors.text, fontSize:38, fontWeight:'w900'}},{type:'text', data:tr('subtitle'), style:{color:colors.muted, fontSize:12}}]},
        {type:'expanded', child:{type:'sizedBox'}}, scoreBox(tr('score'), score), {type:'sizedBox', width:12}, scoreBox(tr('best'), best)
      ]},
      {type:'sizedBox', height:22}, boardView(), {type:'sizedBox', height:16},
      {type:'text', data:message, style:{color:messageColor, fontSize:13, fontWeight:'w600'}}, {type:'sizedBox', height:18},
      {type:'inkWell', onTap:'new_game', borderRadius:18, child:{type:'container', padding:[28,12,28,12], decoration:{color:colors.accent2, borderRadius:18}, child:{type:'text', data:tr('newGame'), style:{color:colors.onAccent, fontSize:14, fontWeight:'w800'}}}}
    ]}}}});
  }
  jsr.onEvent(function (action, payload) {
    var dx, dy;
    if (action === 'new_game') { reset(); return; }
    if (action === 'pan_start') { panStart = payload || {x:0,y:0}; return; }
    if (action !== 'pan_end' || !panStart) return;
    dx = payload.velocityX || 0; dy = payload.velocityY || 0; panStart = null;
    if (Math.abs(dx) < 80 && Math.abs(dy) < 80) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left'); else move(dy > 0 ? 'down' : 'up');
  });
  jsr._onThemeChange = function () { render(); };
  jsr.setTitle(tr('title'));
  reset();
})();
;
