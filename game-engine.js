/* ═══════════════════════════════════════════════════════════
   Server-side Game Engine
   Authoritative match state – clients cannot cheat.
   ═══════════════════════════════════════════════════════════ */

/* ── Full card catalog (mirrors public/js/cards.js) ──── */

const CARDS = [
    { id: 1,  name: "Moss Creeper",  level: 1,  values: [5, 3, 1, 1] },
    { id: 2,  name: "Stinger",       level: 1,  values: [1, 5, 3, 1] },
    { id: 3,  name: "Dusk Wing",     level: 1,  values: [6, 1, 1, 2] },
    { id: 4,  name: "Slime",         level: 1,  values: [2, 3, 4, 1] },
    { id: 5,  name: "Wind Moth",     level: 2,  values: [2, 4, 1, 4] },
    { id: 6,  name: "Imp",           level: 2,  values: [1, 1, 5, 4] },
    { id: 7,  name: "Shade",         level: 2,  values: [2, 1, 6, 1] },
    { id: 8,  name: "Grub",          level: 2,  values: [4, 3, 2, 4] },
    { id: 9,  name: "Basilisk",      level: 3,  values: [2, 6, 1, 2] },
    { id: 10, name: "Root Fiend",    level: 3,  values: [7, 1, 1, 3] },
    { id: 11, name: "Sprite",        level: 3,  values: [6, 3, 2, 2] },
    { id: 12, name: "Horn Beast",    level: 3,  values: [5, 4, 3, 3] },
    { id: 13, name: "Frost Eye",     level: 4,  values: [6, 3, 1, 4] },
    { id: 14, name: "Hollow Knight", level: 4,  values: [3, 3, 4, 5] },
    { id: 15, name: "Sky Talon",     level: 4,  values: [5, 5, 3, 2] },
    { id: 16, name: "Viper",         level: 4,  values: [5, 5, 1, 3] },
    { id: 17, name: "Shadow Creep",  level: 5,  values: [5, 2, 5, 2] },
    { id: 18, name: "Rock Drake",    level: 5,  values: [4, 2, 4, 5] },
    { id: 19, name: "Sea Jelly",     level: 5,  values: [3, 7, 2, 1] },
    { id: 20, name: "Mantis Lord",   level: 5,  values: [5, 3, 2, 5] },
    { id: 21, name: "Cursed Armor",  level: 6,  values: [6, 2, 6, 3] },
    { id: 22, name: "Iron Shell",    level: 6,  values: [6, 6, 3, 1] },
    { id: 23, name: "Tri-Maw",       level: 6,  values: [3, 5, 5, 5] },
    { id: 24, name: "Sand Lurker",   level: 6,  values: [7, 3, 5, 1] },
    { id: 25, name: "Ice Lion",      level: 7,  values: [7, 3, 1, 5] },
    { id: 26, name: "Thornwood",     level: 7,  values: [5, 3, 6, 3] },
    { id: 27, name: "Reaper Claw",   level: 7,  values: [4, 2, 4, 7] },
    { id: 28, name: "Colossus",      level: 7,  values: [6, 5, 5, 6] },
    { id: 29, name: "Azure Dragon",  level: 8,  values: [6, 3, 2, 7] },
    { id: 30, name: "Pit Wyrm",      level: 8,  values: [7, 5, 2, 3] },
    { id: 31, name: "Chimera",       level: 8,  values: [7, 3, 6, 2] },
    { id: 32, name: "Crimson Drake", level: 8,  values: [7, 4, 2, 7] },
    { id: 33, name: "Dire Beast",    level: 9,  values: [3, 6, 5, 7] },
    { id: 34, name: "Void Stalker",  level: 9,  values: [5, 6, 4, 7] },
    { id: 35, name: "Lantern King",  level: 9,  values: [4, 4, 6, 7] },
    { id: 36, name: "Twin Generals", level: 9,  values: [6, 7, 6, 2] },
    { id: 37, name: "Storm Dragon",  level: 10, values: [10, 6, 8, 2] },
    { id: 38, name: "Shadow Lord",   level: 10, values: [5, 3, 10, 8] },
    { id: 39, name: "Flame Titan",   level: 10, values: [9, 8, 2, 6] },
    { id: 40, name: "Sea Witch",     level: 10, values: [8, 2, 9, 6] },
];

const CARD_MAP = {};
for (const c of CARDS) CARD_MAP[c.id] = c;

/* ── Adjacency & edge maps ───────────────────── */

const ADJACENCY = [
    { right: 1, bottom: 3 },
    { left: 0, right: 2, bottom: 4 },
    { left: 1, bottom: 5 },
    { top: 0, right: 4, bottom: 6 },
    { top: 1, left: 3, right: 5, bottom: 7 },
    { top: 2, left: 4, bottom: 8 },
    { top: 3, right: 7 },
    { top: 4, left: 6, right: 8 },
    { top: 5, left: 7 },
];

const EDGE = {
    top:    { atk: 0, def: 2 },
    right:  { atk: 1, def: 3 },
    bottom: { atk: 2, def: 0 },
    left:   { atk: 3, def: 1 },
};

/* ── GameEngine class ────────────────────────── */

class GameEngine {
    /**
     * @param {string} matchId
     * @param {string} socketA  – socket ID of player A
     * @param {string} socketB  – socket ID of player B
     * @param {{ userId: number, username: string }} infoA
     * @param {{ userId: number, username: string }} infoB
     */
    constructor(matchId, socketA, socketB, infoA, infoB) {
        this.matchId = matchId;
        this.sockets = [socketA, socketB];

        this.players = {
            [socketA]: { userId: infoA.userId, username: infoA.username, deck: null, hand: [] },
            [socketB]: { userId: infoB.userId, username: infoB.username, deck: null, hand: [] },
        };

        this.board       = new Array(9).fill(null);   // null | { card, owner: socketId }
        this.phase       = 'deckSelect';               // deckSelect → playing → cardClaim → done
        this.currentTurn = null;
        this.result      = null;                       // 'A' | 'B' | 'draw'
        this.lastPlacement = null;                      // { placedAt, flipped[] }
    }

    /* ── Deck selection ──────────────────────── */

    setDeck(socketId, cardIds) {
        this.players[socketId].deck = cardIds;
    }

    bothDecksReady() {
        return this.sockets.every(s => this.players[s].deck !== null);
    }

    startGame() {
        for (const sid of this.sockets) {
            const p = this.players[sid];
            p.hand = p.deck.map(cid => {
                const def = CARD_MAP[cid];
                if (!def) throw new Error('Unknown card ' + cid);
                return { id: def.id, name: def.name, level: def.level, values: [...def.values] };
            });
        }
        this.currentTurn = this.sockets[Math.random() < 0.5 ? 0 : 1];
        this.phase = 'playing';
    }

    /* ── Gameplay ─────────────────────────────── */

    getCurrentTurnSocket() {
        return this.currentTurn;
    }

    placeCard(socketId, handIndex, boardPos) {
        if (this.phase !== 'playing')           return { placed: false, flipped: [] };
        if (this.currentTurn !== socketId)      return { placed: false, flipped: [] };
        if (this.board[boardPos] !== null)       return { placed: false, flipped: [] };

        const hand = this.players[socketId].hand;
        if (handIndex < 0 || handIndex >= hand.length) return { placed: false, flipped: [] };

        const card = hand.splice(handIndex, 1)[0];
        this.board[boardPos] = { card, owner: socketId };

        const flipped = this._resolveFlips(boardPos);
        this.lastPlacement = { placedAt: boardPos, flipped: flipped };

        // Switch turn
        this.currentTurn = (this.currentTurn === this.sockets[0])
            ? this.sockets[1] : this.sockets[0];

        // Check game over
        if (this.board.every(c => c !== null)) {
            const scores = this._getScores();
            const sA = scores[this.sockets[0]];
            const sB = scores[this.sockets[1]];

            if (sA > sB)      this.result = this.sockets[0];
            else if (sB > sA) this.result = this.sockets[1];
            else               this.result = 'draw';

            this.phase = (this.result === 'draw') ? 'done' : 'cardClaim';
        }

        return { placed: true, flipped };
    }

    _resolveFlips(pos) {
        const placed  = this.board[pos];
        const adj     = ADJACENCY[pos];
        const flipped = [];

        for (const dir in adj) {
            const nIdx     = adj[dir];
            const neighbor = this.board[nIdx];
            if (!neighbor)                        continue;
            if (neighbor.owner === placed.owner)  continue;

            const edge   = EDGE[dir];
            const atkVal = placed.card.values[edge.atk];
            const defVal = neighbor.card.values[edge.def];

            if (atkVal > defVal) {
                neighbor.owner = placed.owner;
                flipped.push(nIdx);
            }
        }
        return flipped;
    }

    /* ── Scoring ─────────────────────────────── */

    _getScores() {
        const scores = {};
        for (const s of this.sockets) {
            scores[s] = this.players[s].hand.length;
        }
        for (let i = 0; i < 9; i++) {
            const cell = this.board[i];
            if (cell) scores[cell.owner] = (scores[cell.owner] || 0) + 1;
        }
        return scores;
    }

    /* ── State for client ────────────────────── */

    getStateFor(socketId) {
        const opponentId = this.getOpponentSocket(socketId);
        const scores     = this._getScores();

        return {
            phase:       this.phase,
            board:       this.board.map(cell => {
                if (!cell) return null;
                return {
                    card:    cell.card,
                    isOwner: cell.owner === socketId,
                };
            }),
            myHand:         this.players[socketId].hand,
            opponentCards:  this.players[opponentId].hand.length,
            myScore:        scores[socketId]   || 0,
            opScore:        scores[opponentId] || 0,
            isMyTurn:       this.currentTurn === socketId,
            opponentName:   this.players[opponentId].username,
            result:         this.result,
            lastPlacement:  this.lastPlacement,
        };
    }

    /* ── Result helpers ──────────────────────── */

    getResult() {
        return this.result;
    }

    getResultFor(socketId) {
        if (this.result === 'draw') return 'draw';
        return this.result === socketId ? 'win' : 'lose';
    }

    getWinnerSocketId() {
        if (this.result === 'draw') return null;
        return this.result;
    }

    getLoserSocketId() {
        if (this.result === 'draw') return null;
        return this.sockets.find(s => s !== this.result);
    }

    /**
     * Return the 5 cards that were in this player's deck (placed on board).
     * Used for the card-claim phase.
     */
    getPlayerCards(socketId) {
        const cards = [];
        for (let i = 0; i < 9; i++) {
            const cell = this.board[i];
            if (!cell) continue;
            // We need to figure out who originally placed this card.
            // Since cards transfer ownership when flipped, we track the original
            // deck instead: just return the deck list.
        }
        // Safer: return the deck IDs → full card objects
        const deckIds = this.players[socketId].deck;
        return deckIds.map(cid => CARD_MAP[cid]).filter(Boolean);
    }

    getOpponentSocket(socketId) {
        return this.sockets.find(s => s !== socketId);
    }

    getPlayerSockets() {
        return [...this.sockets];
    }
}

module.exports = GameEngine;
module.exports.CARDS = CARDS;
module.exports.CARD_MAP = CARD_MAP;
