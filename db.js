/* ═══════════════════════════════════════════════════════════
   Database – SQLite via sql.js (pure JS, no native deps)
   Users, card collections, match history
   ═══════════════════════════════════════════════════════════ */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tripletriad.db');
let db;

/* ── Persist helper ──────────────────────────── */

function save() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/* ── Initialise schema ───────────────────────── */

async function init() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const buf = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buf);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT    NOT NULL,
            coins         INTEGER DEFAULT 500,
            created_at    TEXT    DEFAULT (datetime('now'))
        )
    `);

    // Migrate: add coins column if table already existed without it
    try { db.run('ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 500'); } catch (_) {}
    db.run(`
        CREATE TABLE IF NOT EXISTS collections (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            card_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS matches (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            winner_id   INTEGER,
            loser_id    INTEGER,
            is_draw     INTEGER DEFAULT 0,
            card_won_id INTEGER,
            played_at   TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (winner_id) REFERENCES users(id),
            FOREIGN KEY (loser_id)  REFERENCES users(id)
        )
    `);
    db.run('CREATE INDEX IF NOT EXISTS idx_coll_user ON collections(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_match_winner ON matches(winner_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_match_loser  ON matches(loser_id)');

    save();
}

/* ── Helper: run a SELECT and return rows as objects ─── */

function all(sql, params) {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

function get(sql, params) {
    const rows = all(sql, params);
    return rows.length ? rows[0] : null;
}

function run(sql, params) {
    db.run(sql, params);
    save();
}

/* ── Users ───────────────────────────────────── */

function getUserByUsername(username) {
    return get('SELECT * FROM users WHERE username = ?', [username]);
}

function createUser(username, passwordHash) {
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
    const row = get('SELECT last_insert_rowid() AS id');
    save();
    return row.id;
}

/* ── Collections ─────────────────────────────── */

function grantStarterCollection(userId) {
    // Give 15 unique cards (levels 1-4) so new players can build a 5-card deck easily
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const cards = base;
    for (const cid of cards) {
        db.run('INSERT INTO collections (user_id, card_id) VALUES (?, ?)', [userId, cid]);
    }
    save();
}

function getCollection(userId) {
    return all(
        'SELECT id AS instanceId, card_id AS cardId FROM collections WHERE user_id = ? ORDER BY card_id',
        [userId]
    );
}

function transferCard(fromUserId, toUserId, cardId) {
    const row = get(
        'SELECT id FROM collections WHERE user_id = ? AND card_id = ? LIMIT 1',
        [fromUserId, cardId]
    );
    if (!row) return;
    db.run('DELETE FROM collections WHERE id = ?', [row.id]);
    db.run('INSERT INTO collections (user_id, card_id) VALUES (?, ?)', [toUserId, cardId]);
    save();
}

/* ── Match history ───────────────────────────── */

function recordMatch(winnerId, loserId, isDraw, cardWonId) {
    run(
        'INSERT INTO matches (winner_id, loser_id, is_draw, card_won_id) VALUES (?, ?, ?, ?)',
        [winnerId, loserId, isDraw ? 1 : 0, cardWonId || null]
    );
}

function getStats(userId) {
    const wins   = get('SELECT COUNT(*) AS c FROM matches WHERE winner_id = ? AND is_draw = 0', [userId]).c;
    const losses = get('SELECT COUNT(*) AS c FROM matches WHERE loser_id  = ? AND is_draw = 0', [userId]).c;
    const draws  = get(
        'SELECT COUNT(*) AS c FROM matches WHERE (winner_id = ? OR loser_id = ?) AND is_draw = 1',
        [userId, userId]
    ).c;
    return { wins, losses, draws };
}

/* ── Coins ───────────────────────────────────── */

function getCoins(userId) {
    const row = get('SELECT coins FROM users WHERE id = ?', [userId]);
    return row ? row.coins : 0;
}

function addCoins(userId, amount) {
    run('UPDATE users SET coins = coins + ? WHERE id = ?', [amount, userId]);
}

function spendCoins(userId, amount) {
    const row = get('SELECT coins FROM users WHERE id = ?', [userId]);
    if (!row || row.coins < amount) return false;
    run('UPDATE users SET coins = coins - ? WHERE id = ?', [amount, userId]);
    return true;
}

/* ── Pack opening ────────────────────────────── */

function addCardToCollection(userId, cardId) {
    run('INSERT INTO collections (user_id, card_id) VALUES (?, ?)', [userId, cardId]);
}

function removeCardFromCollection(userId, cardId) {
    const row = get(
        'SELECT id FROM collections WHERE user_id = ? AND card_id = ? LIMIT 1',
        [userId, cardId]
    );
    if (!row) return false;
    run('DELETE FROM collections WHERE id = ?', [row.id]);
    return true;
}

module.exports = {
    init,
    getUserByUsername,
    createUser,
    grantStarterCollection,
    getCollection,
    transferCard,
    recordMatch,
    getStats,
    getCoins,
    addCoins,
    spendCoins,
    addCardToCollection,
    removeCardFromCollection,
};
