/* ═══════════════════════════════════════════════════════════
   Game Logic – board state, turns, flipping, scoring
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.OWNER_PLAYER = 'player';
TT.OWNER_AI     = 'ai';

/*  Board layout (indices 0-8):
 *    0 | 1 | 2
 *    ---------
 *    3 | 4 | 5
 *    ---------
 *    6 | 7 | 8
 *
 *  Adjacency: for each cell, lists { direction: neighborIndex }
 */
TT.ADJACENCY = [
    /* 0 */ { right: 1, bottom: 3 },
    /* 1 */ { left: 0, right: 2, bottom: 4 },
    /* 2 */ { left: 1, bottom: 5 },
    /* 3 */ { top: 0, right: 4, bottom: 6 },
    /* 4 */ { top: 1, left: 3, right: 5, bottom: 7 },
    /* 5 */ { top: 2, left: 4, bottom: 8 },
    /* 6 */ { top: 3, right: 7 },
    /* 7 */ { top: 4, left: 6, right: 8 },
    /* 8 */ { top: 5, left: 7 }
];

/*  Edge index mapping per direction.
 *  Card values array: [top(0), right(1), bottom(2), left(3)]
 *  When attacking in a direction, compare attacker's edge with defender's opposite edge.
 */
TT.EDGE = {
    top:    { atk: 0, def: 2 },   // attacker top vs defender bottom
    right:  { atk: 1, def: 3 },   // attacker right vs defender left
    bottom: { atk: 2, def: 0 },   // attacker bottom vs defender top
    left:   { atk: 3, def: 1 }    // attacker left vs defender right
};

/* ─── Game class ─────────────────────────────── */

TT.Game = function () {
    this.board       = new Array(9).fill(null); // null | { card, owner }
    this.hands       = { player: [], ai: [] };
    this.currentTurn = TT.OWNER_PLAYER;
    this.phase       = 'playing'; // 'playing' | 'gameOver'
};

/** Set up a fresh game with two dealt hands */
TT.Game.prototype.init = function (playerHand, aiHand) {
    this.board = new Array(9).fill(null);
    this.hands = { player: playerHand, ai: aiHand };
    this.currentTurn = TT.OWNER_PLAYER;
    this.phase = 'playing';
};

/**
 * Place a card from the current player's hand onto the board.
 * @param {number} handIndex  – index within the active hand
 * @param {number} boardPos   – board cell 0-8
 * @returns {{ placed: boolean, flipped: number[] }}
 */
TT.Game.prototype.placeCard = function (handIndex, boardPos) {
    if (this.phase !== 'playing')           return { placed: false, flipped: [] };
    if (this.board[boardPos] !== null)       return { placed: false, flipped: [] };

    var hand = this.hands[this.currentTurn];
    if (handIndex < 0 || handIndex >= hand.length) return { placed: false, flipped: [] };

    var card = hand.splice(handIndex, 1)[0];
    this.board[boardPos] = { card: card, owner: this.currentTurn };

    var flipped = this._resolveFlips(boardPos);

    // Switch turn
    this.currentTurn = (this.currentTurn === TT.OWNER_PLAYER)
        ? TT.OWNER_AI : TT.OWNER_PLAYER;

    // Check game over (all 9 cells filled)
    if (this.board.every(function (c) { return c !== null; })) {
        this.phase = 'gameOver';
    }

    return { placed: true, flipped: flipped };
};

/** Resolve flips for the card just placed at pos. Returns flipped indices. */
TT.Game.prototype._resolveFlips = function (pos) {
    var placed  = this.board[pos];
    var adj     = TT.ADJACENCY[pos];
    var flipped = [];

    for (var dir in adj) {
        var nIdx     = adj[dir];
        var neighbor = this.board[nIdx];
        if (!neighbor)                        continue;
        if (neighbor.owner === placed.owner)  continue;

        var edge   = TT.EDGE[dir];
        var atkVal = placed.card.values[edge.atk];
        var defVal = neighbor.card.values[edge.def];

        if (atkVal > defVal) {
            neighbor.owner = placed.owner;
            flipped.push(nIdx);
        }
    }
    return flipped;
};

/** Scores = cards on board belonging to each player + cards still in hand */
TT.Game.prototype.getScores = function () {
    var p = this.hands.player.length;
    var a = this.hands.ai.length;
    for (var i = 0; i < 9; i++) {
        var cell = this.board[i];
        if (!cell) continue;
        if (cell.owner === TT.OWNER_PLAYER) p++; else a++;
    }
    return { player: p, ai: a };
};

/** 'win' | 'lose' | 'draw' | null */
TT.Game.prototype.getResult = function () {
    if (this.phase !== 'gameOver') return null;
    var s = this.getScores();
    if (s.player > s.ai) return 'win';
    if (s.ai > s.player) return 'lose';
    return 'draw';
};

/** List of empty board positions */
TT.Game.prototype.getEmptyPositions = function () {
    var empty = [];
    for (var i = 0; i < 9; i++) {
        if (this.board[i] === null) empty.push(i);
    }
    return empty;
};

/** Deep-clone the entire game state (for AI simulation) */
TT.Game.prototype.clone = function () {
    var g = new TT.Game();
    g.board = this.board.map(function (cell) {
        return cell
            ? { card: TT.cloneCard(cell.card), owner: cell.owner }
            : null;
    });
    g.hands = {
        player: this.hands.player.map(TT.cloneCard),
        ai:     this.hands.ai.map(TT.cloneCard)
    };
    g.currentTurn = this.currentTurn;
    g.phase       = this.phase;
    return g;
};
