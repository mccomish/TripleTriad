/* ═══════════════════════════════════════════════════════════
   Network – thin wrapper around Socket.io + REST calls
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.Net = {

    socket: null,

    /* ── REST helpers ────────────────────────── */

    _post: function (url, body) {
        return fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        }).then(function (r) { return r.json(); });
    },

    register: function (username, password) {
        return this._post('/api/register', { username: username, password: password });
    },

    login: function (username, password) {
        return this._post('/api/login', { username: username, password: password });
    },

    logout: function () {
        return this._post('/api/logout', {});
    },

    getMe: function () {
        return fetch('/api/me').then(function (r) {
            if (!r.ok) throw new Error('not logged in');
            return r.json();
        });
    },

    /* ── Socket.io ───────────────────────────── */

    connect: function () {
        if (this.socket && this.socket.connected) return;
        this.socket = io();

        // Re-wire event handlers
        var handlers = this._handlers || {};
        for (var evt in handlers) {
            this.socket.on(evt, handlers[evt]);
        }
    },

    disconnect: function () {
        if (this.socket) { this.socket.disconnect(); this.socket = null; }
    },

    /** Register an event handler (survives reconnect) */
    on: function (event, fn) {
        this._handlers = this._handlers || {};
        this._handlers[event] = fn;
        if (this.socket) this.socket.on(event, fn);
    },

    emit: function (event, data) {
        if (this.socket) this.socket.emit(event, data);
    },

    /* ── Shop / Pack helpers ─────────────────── */

    getPacks: function () {
        return fetch('/api/packs').then(function (r) { return r.json(); });
    },

    openPack: function (packId) {
        return this._post('/api/open-pack', { packId: packId });
    },

    sellCard: function (cardId) {
        return this._post('/api/sell-card', { cardId: cardId });
    },

    /* ── Market / Auction House ──────────────── */

    getListings: function () {
        return fetch('/api/market').then(function (r) { return r.json(); });
    },

    getMyListings: function () {
        return fetch('/api/market/mine').then(function (r) { return r.json(); });
    },

    listCard: function (cardId, price) {
        return this._post('/api/market/list', { cardId: cardId, price: price });
    },

    buyListing: function (listingId) {
        return this._post('/api/market/buy', { listingId: listingId });
    },

    cancelListing: function (listingId) {
        return this._post('/api/market/cancel', { listingId: listingId });
    }
};
