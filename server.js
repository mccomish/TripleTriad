/* ═══════════════════════════════════════════════════════════
   Triple Triad – Express + Socket.io Server
   ═══════════════════════════════════════════════════════════ */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const session    = require('express-session');
const bcrypt     = require('bcryptjs');
const path       = require('path');
const db         = require('./db');
const GameEngine = require('./game-engine');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

/* ── Middleware ───────────────────────────────── */

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessionMiddleware = session({
    secret:            process.env.SESSION_SECRET || 'tt-change-me-in-prod',
    resave:            false,
    saveUninitialized: false,
    cookie:            { maxAge: 24 * 60 * 60 * 1000 },
});
app.use(sessionMiddleware);

// Share session with Socket.io
io.engine.use(sessionMiddleware);

/* ═════════════════════════════════════════════════
   REST – Auth
   ═════════════════════════════════════════════════ */

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3 || username.length > 20)
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res.status(400).json({ error: 'Letters, numbers, underscore only' });
    if (password.length < 4)
        return res.status(400).json({ error: 'Password must be at least 4 characters' });

    try {
        if (db.getUserByUsername(username))
            return res.status(409).json({ error: 'Username already taken' });

        const hash   = await bcrypt.hash(password, 10);
        const userId = db.createUser(username, hash);
        db.grantStarterCollection(userId);

        req.session.userId   = userId;
        req.session.username = username;
        res.json({ ok: true, username });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });

    try {
        const user = db.getUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok)  return res.status(401).json({ error: 'Invalid credentials' });

        req.session.userId   = user.id;
        req.session.username = user.username;
        res.json({ ok: true, username: user.username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const collection = db.getCollection(req.session.userId);
    const stats      = db.getStats(req.session.userId);
    const coins      = db.getCoins(req.session.userId);
    res.json({ username: req.session.username, collection, stats, coins });
});

/* ═════════════════════════════════════════════
   REST – Shop / Packs
   ═════════════════════════════════════════════ */

const { CARDS: ALL_CARDS, CARD_MAP } = GameEngine;

// Pack definitions: name, cost, card count, level range weights
const PACKS = [
    { id: 'bronze', name: 'Bronze Pack',  cost: 100, count: 3, pool: [1,2,3] },
    { id: 'silver', name: 'Silver Pack',  cost: 250, count: 3, pool: [2,3,4,5] },
    { id: 'gold',   name: 'Gold Pack',    cost: 500, count: 3, pool: [4,5,6,7] },
    { id: 'legend', name: 'Legend Pack',   cost: 1000, count: 3, pool: [7,8,9,10] },
];

function randomCardsFromPack(pack) {
    const eligible = ALL_CARDS.filter(c => pack.pool.includes(c.level));
    const picked = [];
    for (let i = 0; i < pack.count; i++) {
        picked.push(eligible[Math.floor(Math.random() * eligible.length)]);
    }
    return picked;
}

// Card sell values based on level
function getSellPrice(cardLevel) {
    const prices = { 1: 10, 2: 20, 3: 35, 4: 55, 5: 80, 6: 120, 7: 175, 8: 250, 9: 400, 10: 600 };
    return prices[cardLevel] || 10;
}

app.get('/api/packs', (req, res) => {
    res.json(PACKS.map(p => ({ id: p.id, name: p.name, cost: p.cost, count: p.count })));
});

app.post('/api/open-pack', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { packId } = req.body;
    const pack = PACKS.find(p => p.id === packId);
    if (!pack) return res.status(400).json({ error: 'Invalid pack' });

    if (!db.spendCoins(req.session.userId, pack.cost))
        return res.status(400).json({ error: 'Not enough coins' });

    const cards = randomCardsFromPack(pack);
    for (const c of cards) db.addCardToCollection(req.session.userId, c.id);

    const coins = db.getCoins(req.session.userId);
    res.json({ ok: true, cards, coins });
});

app.post('/api/sell-card', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const { cardId } = req.body;
    if (typeof cardId !== 'number' || !CARD_MAP[cardId])
        return res.status(400).json({ error: 'Invalid card' });

    if (!db.removeCardFromCollection(req.session.userId, cardId))
        return res.status(400).json({ error: "You don't own that card" });

    const price = getSellPrice(CARD_MAP[cardId].level);
    db.addCoins(req.session.userId, price);
    const coins = db.getCoins(req.session.userId);
    const collection = db.getCollection(req.session.userId);
    res.json({ ok: true, price, coins, collection });
});

/* ═════════════════════════════════════════════════
   State
   ═════════════════════════════════════════════════ */

const onlinePlayers = new Map();   // socketId → { userId, username }
const matchQueue    = [];          // socketIds waiting for opponent
const activeMatches = new Map();   // matchId → GameEngine
const playerToMatch = new Map();   // socketId → matchId
const aiMatches     = new Map();   // socketId → { match, aiSocket }

// Coin rewards
const COIN_WIN  = 50;
const COIN_LOSE = 15;
const COIN_DRAW = 25;
const COIN_AI_WIN  = 30;
const COIN_AI_LOSE = 10;
const COIN_AI_DRAW = 15;

let matchCounter = 0;

/* ═════════════════════════════════════════════════
   Socket.io
   ═════════════════════════════════════════════════ */

io.on('connection', (socket) => {
    const sess = socket.request.session;
    if (!sess || !sess.userId) { socket.disconnect(); return; }

    const userId   = sess.userId;
    const username = sess.username;

    // Prevent duplicate connections for the same user
    for (const [sid, p] of onlinePlayers) {
        if (p.userId === userId) {
            io.to(sid).emit('kicked', 'Logged in from another tab');
            const old = io.sockets.sockets.get(sid);
            if (old) old.disconnect();
            onlinePlayers.delete(sid);
        }
    }

    onlinePlayers.set(socket.id, { userId, username });
    broadcastLobby();
    console.log(`+ ${username} connected  (${onlinePlayers.size} online)`);

    /* ── Matchmaking ─────────────────────────── */

    socket.on('find-match', () => {
        if (playerToMatch.has(socket.id)) return;
        if (matchQueue.includes(socket.id)) return;

        if (matchQueue.length > 0) {
            const oppId = matchQueue.shift();
            if (!onlinePlayers.has(oppId)) return;   // stale
            beginDeckSelect(socket.id, oppId);
        } else {
            matchQueue.push(socket.id);
            socket.emit('queue-status', { inQueue: true });
        }
        broadcastLobby();
    });

    socket.on('cancel-find', () => {
        const idx = matchQueue.indexOf(socket.id);
        if (idx !== -1) matchQueue.splice(idx, 1);
        socket.emit('queue-status', { inQueue: false });
        broadcastLobby();
    });

    /* ── AI Single Player ─────────────────── */

    socket.on('play-ai', () => {
        if (playerToMatch.has(socket.id)) return;
        if (aiMatches.has(socket.id)) return;

        const collection = db.getCollection(userId);
        socket.emit('deck-select', { opponent: 'AI Opponent', collection });
        // Mark this player as pending AI match
        aiMatches.set(socket.id, { phase: 'deckSelect' });
    });

    socket.on('select-deck-ai', (cardIds) => {
        const aiState = aiMatches.get(socket.id);
        if (!aiState || aiState.phase !== 'deckSelect') return;

        // Validate deck
        if (!Array.isArray(cardIds) || cardIds.length !== 5) {
            socket.emit('error-msg', 'Select exactly 5 cards');
            return;
        }
        for (const cid of cardIds) {
            if (typeof cid !== 'number' || !Number.isInteger(cid)) {
                socket.emit('error-msg', 'Invalid card ID');
                return;
            }
        }
        const collection = db.getCollection(userId);
        const ownedIds = collection.map(r => r.cardId);
        const needed = {};
        for (const cid of cardIds) needed[cid] = (needed[cid] || 0) + 1;
        for (const [cid, count] of Object.entries(needed)) {
            if (ownedIds.filter(id => id === Number(cid)).length < count) {
                socket.emit('error-msg', "You don't own enough copies of that card");
                return;
            }
        }

        // Build AI deck from similar levels
        const playerAvgLevel = cardIds.reduce((s, cid) => s + (CARD_MAP[cid] ? CARD_MAP[cid].level : 1), 0) / 5;
        const aiMinLevel = Math.max(1, Math.floor(playerAvgLevel) - 1);
        const aiMaxLevel = Math.min(10, Math.ceil(playerAvgLevel) + 1);
        const aiPool = ALL_CARDS.filter(c => c.level >= aiMinLevel && c.level <= aiMaxLevel);
        const shuffled = aiPool.sort(() => Math.random() - 0.5);
        const aiDeckIds = shuffled.slice(0, 5).map(c => c.id);

        // Create match with a virtual AI socket
        const aiSocket = '__ai_' + (++matchCounter);
        const matchId  = 'ai_match_' + matchCounter;
        const match = new GameEngine(matchId, socket.id, aiSocket,
            { userId, username },
            { userId: 0, username: 'AI Opponent' }
        );
        match.setDeck(socket.id, cardIds);
        match.setDeck(aiSocket, aiDeckIds);
        match.startGame();

        activeMatches.set(matchId, match);
        playerToMatch.set(socket.id, matchId);
        aiMatches.set(socket.id, { phase: 'playing', matchId, aiSocket });

        socket.emit('deck-confirmed');
        socket.emit('game-state', match.getStateFor(socket.id));

        // If AI goes first, make its move
        if (match.getCurrentTurnSocket() === aiSocket) {
            setTimeout(() => aiMakeMove(socket.id), 800);
        }
    });

    /* ── Deck selection ──────────────────────── */

    socket.on('select-deck', (cardIds) => {
        const matchId = playerToMatch.get(socket.id);
        if (!matchId) return;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'deckSelect') return;

        // Validate
        if (!Array.isArray(cardIds) || cardIds.length !== 5) {
            socket.emit('error-msg', 'Select exactly 5 cards');
            return;
        }
        for (const cid of cardIds) {
            if (typeof cid !== 'number' || !Number.isInteger(cid)) {
                socket.emit('error-msg', 'Invalid card ID');
                return;
            }
        }

        const collection = db.getCollection(userId);
        const ownedIds   = collection.map(r => r.cardId);

        // Check ownership (handle duplicates)
        const needed = {};
        for (const cid of cardIds) needed[cid] = (needed[cid] || 0) + 1;
        for (const [cid, count] of Object.entries(needed)) {
            const have = ownedIds.filter(id => id === Number(cid)).length;
            if (count > have) {
                socket.emit('error-msg', "You don't own enough copies of that card");
                return;
            }
        }

        match.setDeck(socket.id, cardIds);
        socket.emit('deck-confirmed');

        if (match.bothDecksReady()) {
            match.startGame();
            emitGameState(matchId);
        }
    });

    /* ── Gameplay ─────────────────────────────── */

    socket.on('play-card', ({ handIndex, boardPos }) => {
        const matchId = playerToMatch.get(socket.id);
        if (!matchId) return;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'playing') return;
        if (match.getCurrentTurnSocket() !== socket.id) return;

        if (typeof handIndex !== 'number' || typeof boardPos !== 'number') return;
        if (handIndex < 0 || handIndex > 4 || boardPos < 0 || boardPos > 8) return;

        const result = match.placeCard(socket.id, handIndex, boardPos);
        if (!result.placed) { socket.emit('error-msg', 'Invalid move'); return; }

        const aiState = aiMatches.get(socket.id);
        const isAI    = aiState && aiState.matchId === matchId;

        if (isAI) {
            socket.emit('game-state', match.getStateFor(socket.id));

            if (match.phase === 'cardClaim') {
                const pResult = match.getResultFor(socket.id);
                if (pResult === 'win') {
                    db.addCoins(userId, COIN_AI_WIN);
                    const loserCards = match.getPlayerCards(aiState.aiSocket);
                    socket.emit('claim-phase', { opponentCards: loserCards });
                } else {
                    db.addCoins(userId, COIN_AI_LOSE);
                    finaliseAiMatch(socket.id, null);
                }
            } else if (match.phase === 'done') {
                db.addCoins(userId, COIN_AI_DRAW);
                finaliseAiMatch(socket.id, null);
            } else if (match.getCurrentTurnSocket() === aiState.aiSocket) {
                setTimeout(() => aiMakeMove(socket.id), 800);
            }
        } else {
            emitGameState(matchId);

            if (match.phase === 'cardClaim') {
                const winnerId = match.getWinnerSocketId();
                const loserId  = match.getLoserSocketId();
                const loserCards = match.getPlayerCards(loserId);
                io.to(winnerId).emit('claim-phase', { opponentCards: loserCards });
                io.to(loserId).emit('waiting-claim', { message: "Opponent is choosing a card…" });
            } else if (match.phase === 'done') {
                finaliseMatch(matchId, null);
            }
        }
    });

    /* ── Card claim ──────────────────────────── */

    socket.on('claim-card', (cardId) => {
        const matchId = playerToMatch.get(socket.id);
        if (!matchId) return;
        const match = activeMatches.get(matchId);
        if (!match || match.phase !== 'cardClaim') return;
        if (match.getWinnerSocketId() !== socket.id) return;

        if (typeof cardId !== 'number') return;

        const aiState = aiMatches.get(socket.id);
        const isAI    = aiState && aiState.matchId === matchId;

        if (isAI) {
            // AI match claim: just add to collection (no real loser)
            const loserCards = match.getPlayerCards(aiState.aiSocket);
            if (!loserCards.some(c => c.id === cardId)) {
                socket.emit('error-msg', 'Invalid card');
                return;
            }
            db.addCardToCollection(userId, cardId);
            finaliseAiMatch(socket.id, cardId);
        } else {
            const loserSocket = match.getLoserSocketId();
            const loserCards  = match.getPlayerCards(loserSocket);
            if (!loserCards.some(c => c.id === cardId)) {
                socket.emit('error-msg', 'Invalid card');
                return;
            }

            const winnerInfo = onlinePlayers.get(socket.id);
            const loserInfo  = onlinePlayers.get(loserSocket);
            if (winnerInfo && loserInfo) {
                db.transferCard(loserInfo.userId, winnerInfo.userId, cardId);
                db.recordMatch(winnerInfo.userId, loserInfo.userId, false, cardId);
            }

            finaliseMatch(matchId, cardId);
        }
    });

    /* ── Forfeit ─────────────────────────────── */

    socket.on('forfeit', () => {
        // Clean up AI match
        if (aiMatches.has(socket.id)) {
            const aiState = aiMatches.get(socket.id);
            if (aiState.matchId) activeMatches.delete(aiState.matchId);
            playerToMatch.delete(socket.id);
            aiMatches.delete(socket.id);
            socket.emit('forfeited');
            return;
        }

        const matchId = playerToMatch.get(socket.id);
        if (matchId) {
            const match = activeMatches.get(matchId);
            if (match) {
                const opp = match.getOpponentSocket(socket.id);
                if (opp) {
                    io.to(opp).emit('opponent-disconnected');
                    playerToMatch.delete(opp);
                }
            }
            activeMatches.delete(matchId);
            playerToMatch.delete(socket.id);
        }
        socket.emit('forfeited');
        broadcastLobby();
    });

    /* ── Disconnect ──────────────────────────── */

    socket.on('disconnect', () => {
        const idx = matchQueue.indexOf(socket.id);
        if (idx !== -1) matchQueue.splice(idx, 1);

        // Clean up AI match
        if (aiMatches.has(socket.id)) {
            const aiState = aiMatches.get(socket.id);
            if (aiState.matchId) activeMatches.delete(aiState.matchId);
            playerToMatch.delete(socket.id);
            aiMatches.delete(socket.id);
        }

        const matchId = playerToMatch.get(socket.id);
        if (matchId) {
            const match   = activeMatches.get(matchId);
            if (match) {
                const opp = match.getOpponentSocket(socket.id);
                if (opp) {
                    io.to(opp).emit('opponent-disconnected');
                    playerToMatch.delete(opp);
                }
            }
            activeMatches.delete(matchId);
            playerToMatch.delete(socket.id);
        }

        onlinePlayers.delete(socket.id);
        broadcastLobby();
        console.log(`- ${username} disconnected  (${onlinePlayers.size} online)`);
    });
});

/* ═════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════ */

function beginDeckSelect(sA, sB) {
    const id    = 'match_' + (++matchCounter);
    const infoA = onlinePlayers.get(sA);
    const infoB = onlinePlayers.get(sB);
    const match = new GameEngine(id, sA, sB, infoA, infoB);

    activeMatches.set(id, match);
    playerToMatch.set(sA, id);
    playerToMatch.set(sB, id);

    const collA = db.getCollection(infoA.userId);
    const collB = db.getCollection(infoB.userId);

    io.to(sA).emit('deck-select', { opponent: infoB.username, collection: collA });
    io.to(sB).emit('deck-select', { opponent: infoA.username, collection: collB });
    broadcastLobby();
}

function emitGameState(matchId) {
    const match = activeMatches.get(matchId);
    if (!match) return;
    for (const sid of match.getPlayerSockets()) {
        io.to(sid).emit('game-state', match.getStateFor(sid));
    }
}

function finaliseMatch(matchId, claimedCardId) {
    const match = activeMatches.get(matchId);
    if (!match) return;

    // For draws, record without a winner
    if (match.result === 'draw') {
        const [sA, sB] = match.getPlayerSockets();
        const pA = onlinePlayers.get(sA);
        const pB = onlinePlayers.get(sB);
        if (pA && pB) {
            db.recordMatch(pA.userId, pB.userId, true, null);
            db.addCoins(pA.userId, COIN_DRAW);
            db.addCoins(pB.userId, COIN_DRAW);
        }
        for (const sid of match.getPlayerSockets()) {
            const info = onlinePlayers.get(sid);
            const coins = info ? db.getCoins(info.userId) : 0;
            io.to(sid).emit('match-over', {
                perspective:   match.getResultFor(sid),
                claimedCardId,
                coins,
                reward: COIN_DRAW,
            });
            playerToMatch.delete(sid);
        }
    } else {
        // Award coins to winner and loser
        const winnerSid = match.getWinnerSocketId();
        const loserSid  = match.getLoserSocketId();
        const wInfo = onlinePlayers.get(winnerSid);
        const lInfo = onlinePlayers.get(loserSid);
        if (wInfo) db.addCoins(wInfo.userId, COIN_WIN);
        if (lInfo) db.addCoins(lInfo.userId, COIN_LOSE);

        for (const sid of match.getPlayerSockets()) {
            const info = onlinePlayers.get(sid);
            const coins = info ? db.getCoins(info.userId) : 0;
            const reward = (sid === winnerSid) ? COIN_WIN : COIN_LOSE;
            io.to(sid).emit('match-over', {
                perspective:   match.getResultFor(sid),
                claimedCardId,
                coins,
                reward,
            });
            playerToMatch.delete(sid);
        }
    }
    activeMatches.delete(matchId);
    broadcastLobby();
}

/* ── AI helpers ───────────────────────────────── */

function aiMakeMove(playerSocketId) {
    const aiState = aiMatches.get(playerSocketId);
    if (!aiState || !aiState.matchId) return;
    const match = activeMatches.get(aiState.matchId);
    if (!match || match.phase !== 'playing') return;
    if (match.getCurrentTurnSocket() !== aiState.aiSocket) return;

    const aiHand = match.players[aiState.aiSocket].hand;
    const empty  = [];
    for (let i = 0; i < 9; i++) { if (!match.board[i]) empty.push(i); }

    // Greedy AI: try all combos, pick best flip count
    let bestScore = -Infinity;
    let bestMoves = [];
    for (let hi = 0; hi < aiHand.length; hi++) {
        for (const pos of empty) {
            // Simulate
            const sim = cloneMatchState(match, aiState.aiSocket);
            const r = sim.placeCard(aiState.aiSocket, hi, pos);
            if (!r.placed) continue;
            const scores = sim._getScores();
            const diff = (scores[aiState.aiSocket] || 0) - (scores[playerSocketId] || 0);
            if (diff > bestScore) { bestScore = diff; bestMoves = [{ hi, pos }]; }
            else if (diff === bestScore) bestMoves.push({ hi, pos });
        }
    }

    if (!bestMoves.length) return;
    const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    const result = match.placeCard(aiState.aiSocket, pick.hi, pick.pos);

    const sock = io.sockets.sockets.get(playerSocketId);
    if (!sock) return;

    sock.emit('game-state', match.getStateFor(playerSocketId));

    if (match.phase === 'cardClaim') {
        const pResult = match.getResultFor(playerSocketId);
        if (pResult === 'win') {
            db.addCoins(aiState.userId || sock.request.session.userId, COIN_AI_WIN);
            const loserCards = match.getPlayerCards(aiState.aiSocket);
            sock.emit('claim-phase', { opponentCards: loserCards });
        } else {
            // AI won
            db.addCoins(sock.request.session.userId, COIN_AI_LOSE);
            finaliseAiMatch(playerSocketId, null);
        }
    } else if (match.phase === 'done') {
        db.addCoins(sock.request.session.userId, COIN_AI_DRAW);
        finaliseAiMatch(playerSocketId, null);
    }
}

function finaliseAiMatch(playerSocketId, claimedCardId) {
    const aiState = aiMatches.get(playerSocketId);
    if (!aiState) return;
    const match = activeMatches.get(aiState.matchId);
    const sock  = io.sockets.sockets.get(playerSocketId);
    const coins = sock ? db.getCoins(sock.request.session.userId) : 0;
    const perspective = match ? match.getResultFor(playerSocketId) : 'draw';
    var reward = COIN_AI_DRAW;
    if (perspective === 'win') reward = COIN_AI_WIN;
    else if (perspective === 'lose') reward = COIN_AI_LOSE;

    if (sock) {
        sock.emit('match-over', {
            perspective,
            claimedCardId,
            coins,
            reward,
        });
    }

    if (aiState.matchId) activeMatches.delete(aiState.matchId);
    playerToMatch.delete(playerSocketId);
    aiMatches.delete(playerSocketId);
}

/** Deep clone match for AI simulation */
function cloneMatchState(match, aiSocket) {
    const g = new GameEngine(match.matchId + '_sim', match.sockets[0], match.sockets[1],
        { userId: 0, username: '' }, { userId: 0, username: '' });
    g.board = match.board.map(cell =>
        cell ? { card: { ...cell.card, values: [...cell.card.values] }, owner: cell.owner } : null
    );
    for (const sid of match.sockets) {
        g.players[sid].hand = match.players[sid].hand.map(c => ({ ...c, values: [...c.values] }));
        g.players[sid].deck = match.players[sid].deck ? [...match.players[sid].deck] : null;
    }
    g.currentTurn = match.currentTurn;
    g.phase = match.phase;
    return g;
}

function broadcastLobby() {
    const list = [];
    for (const [sid, p] of onlinePlayers) {
        list.push({
            username: p.username,
            inMatch:  playerToMatch.has(sid),
            inQueue:  matchQueue.includes(sid),
        });
    }
    io.emit('online-players', list);
}

/* ═════════════════════════════════════════════════
   Start
   ═════════════════════════════════════════════════ */

const PORT = process.env.PORT || 3000;
db.init().then(() => {
    server.listen(PORT, () => {
        console.log(`Triple Triad server running on http://localhost:${PORT}`);
    });
});
