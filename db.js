/* ═══════════════════════════════════════════════════════════
   Database – PostgreSQL via pg
   Users, card collections, match history
   ═══════════════════════════════════════════════════════════ */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

/* ── Initialise schema ───────────────────────── */

async function init() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      TEXT   UNIQUE NOT NULL,
            password_hash TEXT   NOT NULL,
            coins         INTEGER DEFAULT 500,
            created_at    TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS collections (
            id      SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            card_id INTEGER NOT NULL
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS matches (
            id          SERIAL PRIMARY KEY,
            winner_id   INTEGER REFERENCES users(id),
            loser_id    INTEGER REFERENCES users(id),
            is_draw     INTEGER DEFAULT 0,
            card_won_id INTEGER,
            played_at   TIMESTAMPTZ DEFAULT NOW()
        )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_coll_user ON collections(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_match_winner ON matches(winner_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_match_loser  ON matches(loser_id)');

    // Migrate: add coins column if table already existed without it
    try { await pool.query('ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 500'); } catch (_) {}
}

/* ── Users ───────────────────────────────────── */

async function getUserByUsername(username) {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return rows[0] || null;
}

async function createUser(username, passwordHash) {
    const { rows } = await pool.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        [username, passwordHash]
    );
    return rows[0].id;
}

/* ── Collections ─────────────────────────────── */

async function grantStarterCollection(userId) {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const values = base.map((cid, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
        `INSERT INTO collections (user_id, card_id) VALUES ${values}`,
        [userId, ...base]
    );
}

async function getCollection(userId) {
    const { rows } = await pool.query(
        'SELECT id AS "instanceId", card_id AS "cardId" FROM collections WHERE user_id = $1 ORDER BY card_id',
        [userId]
    );
    return rows;
}

async function transferCard(fromUserId, toUserId, cardId) {
    const { rows } = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1 AND card_id = $2 LIMIT 1',
        [fromUserId, cardId]
    );
    if (!rows[0]) return;
    await pool.query('DELETE FROM collections WHERE id = $1', [rows[0].id]);
    await pool.query('INSERT INTO collections (user_id, card_id) VALUES ($1, $2)', [toUserId, cardId]);
}

/* ── Match history ───────────────────────────── */

async function recordMatch(winnerId, loserId, isDraw, cardWonId) {
    await pool.query(
        'INSERT INTO matches (winner_id, loser_id, is_draw, card_won_id) VALUES ($1, $2, $3, $4)',
        [winnerId, loserId, isDraw ? 1 : 0, cardWonId || null]
    );
}

async function getStats(userId) {
    const wins = (await pool.query('SELECT COUNT(*) AS c FROM matches WHERE winner_id = $1 AND is_draw = 0', [userId])).rows[0].c;
    const losses = (await pool.query('SELECT COUNT(*) AS c FROM matches WHERE loser_id = $1 AND is_draw = 0', [userId])).rows[0].c;
    const draws = (await pool.query(
        'SELECT COUNT(*) AS c FROM matches WHERE (winner_id = $1 OR loser_id = $2) AND is_draw = 1',
        [userId, userId]
    )).rows[0].c;
    return { wins: Number(wins), losses: Number(losses), draws: Number(draws) };
}

/* ── Coins ───────────────────────────────────── */

async function getCoins(userId) {
    const { rows } = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    return rows[0] ? rows[0].coins : 0;
}

async function addCoins(userId, amount) {
    await pool.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [amount, userId]);
}

async function spendCoins(userId, amount) {
    const { rows } = await pool.query('SELECT coins FROM users WHERE id = $1', [userId]);
    if (!rows[0] || rows[0].coins < amount) return false;
    await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [amount, userId]);
    return true;
}

/* ── Pack opening ────────────────────────────── */

async function addCardToCollection(userId, cardId) {
    await pool.query('INSERT INTO collections (user_id, card_id) VALUES ($1, $2)', [userId, cardId]);
}

async function removeCardFromCollection(userId, cardId) {
    const { rows } = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1 AND card_id = $2 LIMIT 1',
        [userId, cardId]
    );
    if (!rows[0]) return false;
    await pool.query('DELETE FROM collections WHERE id = $1', [rows[0].id]);
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
