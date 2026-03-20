/* ═══════════════════════════════════════════════════════════
   Main – App controller, event wiring, screen flow
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

(function () {

    var myUsername  = null;
    var myStats     = null;
    var myCollection = null;
    var myCoins     = 0;
    var myUserId    = null;
    var currentGameState = null;
    var isAiMatch   = false;

    // Deck-select state
    var selectedDeck = [];   // card IDs chosen

    /* ═══════════════════════════════════════════
       AUTH
       ═══════════════════════════════════════════ */

    function doAuth(action) {
        var user = document.getElementById('auth-user').value.trim();
        var pass = document.getElementById('auth-pass').value;
        var errEl = document.getElementById('auth-error');
        errEl.textContent = '';

        if (!user || !pass) { errEl.textContent = 'Enter username & password'; return; }

        var fn = (action === 'register') ? TT.Net.register : TT.Net.login;
        fn.call(TT.Net, user, pass).then(function (data) {
            if (data.error) { errEl.textContent = data.error; return; }
            enterLobby();
        });
    }

    function enterLobby() {
        TT.Net.getMe().then(function (data) {
            myUserId     = data.id;
            myUsername   = data.username;
            myStats      = data.stats;
            myCollection = data.collection;
            myCoins      = data.coins || 0;

            TT.UI.renderLobby(myUsername, myStats, myCoins);
            TT.UI.showScreen('screen-lobby');
            TT.UI.setQueueUI(false);

            TT.Net.connect();
        }).catch(function () {
            TT.UI.showScreen('screen-auth');
        });
    }

    /* ═══════════════════════════════════════════
       LOBBY
       ═══════════════════════════════════════════ */

    function onFindMatch()  { isAiMatch = false; TT.Net.emit('find-match'); TT.UI.setQueueUI(true); }
    function onCancelFind() { TT.Net.emit('cancel-find'); TT.UI.setQueueUI(false); }

    function onLogout() {
        TT.Net.logout().then(function () {
            TT.Net.disconnect();
            TT.UI.showScreen('screen-auth');
        });
    }

    function openCollection() {
        TT.Net.getMe().then(function (data) {
            myCollection = data.collection;
            myCoins = data.coins || 0;
            TT.UI.renderCollection(myCollection, myCoins, onSellCard);
            TT.UI.showScreen('screen-collection');
        });
    }

    function onPlayAI() {
        isAiMatch = true;
        TT.Net.emit('play-ai');
    }

    function openShop() {
        TT.Net.getPacks().then(function (packs) {
            TT.Net.getMe().then(function (data) {
                myCoins = data.coins || 0;
                TT.UI.renderShop(packs, myCoins, onBuyPack);
                TT.UI.showScreen('screen-shop');
            });
        });
    }

    function onBuyPack(packId) {
        TT.Net.openPack(packId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCoins = data.coins;
            TT.UI.renderPackResult(data.cards, data.coins);
            TT.UI.showScreen('screen-pack-result');
        });
    }

    function onSellCard(cardId) {
        TT.Net.sellCard(cardId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCoins = data.coins;
            myCollection = data.collection;
            TT.UI.renderCollection(myCollection, myCoins, onSellCard);
            TT.UI.updateCoins(myCoins);
        });
    }

    /* ═══════════════════════════════════════════
       AUCTION HOUSE / MARKET
       ═══════════════════════════════════════════ */

    var sellSelectedCardId = null;

    function openMarket() {
        TT.Net.getMe().then(function (data) {
            myCoins = data.coins || 0;
            myUserId = data.id;
            myCollection = data.collection;
            TT.UI.updateCoins(myCoins);
            switchMarketTab('browse');
            TT.UI.showScreen('screen-market');
        });
    }

    function switchMarketTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.market-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        // Update panels
        document.getElementById('market-browse').classList.toggle('active', tab === 'browse');
        document.getElementById('market-mine').classList.toggle('active', tab === 'my-listings');
        document.getElementById('market-sell').classList.toggle('active', tab === 'sell');

        if (tab === 'browse') {
            TT.Net.getListings().then(function (listings) {
                TT.UI.renderMarketBrowse(listings, myUserId, onBuyListing);
            });
        } else if (tab === 'my-listings') {
            TT.Net.getMyListings().then(function (listings) {
                TT.UI.renderMyListings(listings, onCancelListing);
            });
        } else if (tab === 'sell') {
            sellSelectedCardId = null;
            document.getElementById('sell-form').classList.add('hidden');
            TT.Net.getMe().then(function (data) {
                myCollection = data.collection;
                TT.UI.renderSellGrid(myCollection, onSellSelect);
            });
        }
    }

    function onSellSelect(cardId, card) {
        sellSelectedCardId = cardId;
        document.getElementById('sell-card-name').textContent = card.name;
        document.getElementById('sell-price').value = '';
        document.getElementById('sell-form').classList.remove('hidden');

        // Highlight selected card
        document.querySelectorAll('#sell-card-grid .card').forEach(function (c) {
            c.classList.toggle('sell-selected', parseInt(c.dataset.cardId, 10) === cardId);
        });
    }

    function onConfirmSell() {
        if (!sellSelectedCardId) return;
        var price = parseInt(document.getElementById('sell-price').value, 10);
        if (!price || price < 1 || price > 99999) {
            alert('Enter a price between 1 and 99,999');
            return;
        }
        TT.Net.listCard(sellSelectedCardId, price).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCollection = data.collection;
            sellSelectedCardId = null;
            document.getElementById('sell-form').classList.add('hidden');
            // Refresh the sell grid
            TT.UI.renderSellGrid(myCollection, onSellSelect);
        });
    }

    function onBuyListing(listingId) {
        if (!confirm('Buy this card?')) return;
        TT.Net.buyListing(listingId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCoins = data.coins;
            TT.UI.updateCoins(myCoins);
            // Refresh browse
            switchMarketTab('browse');
        });
    }

    function onCancelListing(listingId) {
        TT.Net.cancelListing(listingId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCollection = data.collection;
            // Refresh my listings
            switchMarketTab('my-listings');
        });
    }

    /* ═══════════════════════════════════════════
       DECK SELECT
       ═══════════════════════════════════════════ */

    function onDeckSelect(data) {
        selectedDeck = [];
        _prevBoard = null; // reset for new game
        TT.UI.renderDeckSelect(data.collection, data.opponent);
        TT.UI.showScreen('screen-deck');
        myCollection = data.collection;
    }

    function toggleDeckCard(el) {
        var cardId = parseInt(el.dataset.cardId, 10);
        var idx    = selectedDeck.indexOf(cardId);

        if (idx !== -1) {
            // Deselect
            selectedDeck.splice(idx, 1);
            el.classList.remove('selected');
        } else {
            if (selectedDeck.length >= 5) return;
            selectedDeck.push(cardId);
            el.classList.add('selected');
        }

        TT.UI.updateDeckCount(selectedDeck.length);
    }

    function confirmDeck() {
        if (selectedDeck.length !== 5) return;
        if (isAiMatch) {
            TT.Net.emit('select-deck-ai', selectedDeck);
        } else {
            TT.Net.emit('select-deck', selectedDeck);
        }
    }

    /* ═══════════════════════════════════════════
       GAMEPLAY
       ═══════════════════════════════════════════ */

    var _prevBoard = null; // track previous board for animation

    function onGameState(state) {
        currentGameState = state;
        TT.UI.selectedHandIndex = null;
        TT.UI.initBoard();

        var lp = state.lastPlacement;
        var hasFlips = lp && lp.flipped && lp.flipped.length > 0;

        if (hasFlips && _prevBoard) {
            // Render board with old ownership for flipped cells (pre-flip state)
            var preFlipState = JSON.parse(JSON.stringify(state));
            for (var k = 0; k < lp.flipped.length; k++) {
                var fi = lp.flipped[k];
                if (preFlipState.board[fi]) {
                    preFlipState.board[fi].isOwner = !state.board[fi].isOwner;
                }
            }
            TT.UI.renderGameState(preFlipState);

            if (state.phase === 'playing' || state.phase === 'cardClaim' || state.phase === 'done' || state.phase === 'gameOver') {
                TT.UI.showScreen('screen-game');
            }

            // Run attack animation, then re-render with real state
            TT.UI.animateFlips(lp.placedAt, lp.flipped, state).then(function () {
                TT.UI.renderGameState(state);
            });
        } else {
            TT.UI.renderGameState(state);
            if (state.phase === 'playing') {
                TT.UI.showScreen('screen-game');
            }
        }

        // Store board snapshot for next comparison
        _prevBoard = state.board.map(function (c) {
            return c ? { cardId: c.card.id, isOwner: c.isOwner } : null;
        });
    }

    function onHandClick(e) {
        if (!currentGameState || !currentGameState.isMyTurn) return;
        if (currentGameState.phase !== 'playing') return;

        var el = e.target.closest('.hand-card.selectable');
        if (!el) return;

        var idx = parseInt(el.dataset.handIndex, 10);
        TT.UI.selectedHandIndex = (TT.UI.selectedHandIndex === idx) ? null : idx;
        TT.UI.renderGameState(currentGameState);
    }

    function onBoardClick(e) {
        if (!currentGameState || !currentGameState.isMyTurn) return;
        if (currentGameState.phase !== 'playing') return;
        if (TT.UI.selectedHandIndex === null) return;

        var cell = e.target.closest('.board-cell.empty');
        if (!cell) return;

        var pos = parseInt(cell.dataset.pos, 10);
        TT.Net.emit('play-card', {
            handIndex: TT.UI.selectedHandIndex,
            boardPos:  pos
        });
        TT.UI.selectedHandIndex = null;
    }

    /* ═══════════════════════════════════════════
       POST-GAME
       ═══════════════════════════════════════════ */

    function onClaimPhase(data) {
        TT.UI.renderClaimCards(data.opponentCards);
        TT.UI.showScreen('screen-claim');
    }

    function onClaimClick(e) {
        var card = e.target.closest('.card');
        if (!card) return;
        var cardId = parseInt(card.dataset.cardId, 10);
        if (isNaN(cardId)) return;

        // Visual feedback
        var all = document.querySelectorAll('#claim-cards .card');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('claimed-highlight');
        card.classList.add('claimed-highlight');

        TT.Net.emit('claim-card', cardId);
    }

    function onWaitingClaim(data) {
        document.getElementById('claim-title').textContent = 'You Lose';
        document.getElementById('claim-subtitle').textContent = data.message;
        document.getElementById('claim-cards').innerHTML = '';
        TT.UI.showScreen('screen-claim');
    }

    function onMatchOver(data) {
        TT.UI.renderResult(data.perspective, data.claimedCardId, data.coins, data.reward);
        if (data.coins !== undefined) myCoins = data.coins;
        isAiMatch = false;
        TT.UI.showScreen('screen-result');
    }

    function onOpponentDisconnected() {
        document.getElementById('result-text').textContent = 'Opponent Left';
        document.getElementById('result-text').className = 'draw';
        document.getElementById('result-card-msg').textContent = 'No result recorded';
        TT.UI.showScreen('screen-result');
    }

    function backToLobby() {
        isAiMatch = false;
        // Refresh stats
        TT.Net.getMe().then(function (data) {
            myUserId = data.id;
            myStats = data.stats;
            myCollection = data.collection;
            myCoins = data.coins || 0;
            TT.UI.renderLobby(myUsername, myStats, myCoins);
            TT.UI.setQueueUI(false);
            TT.UI.showScreen('screen-lobby');
        }).catch(function () {
            TT.UI.showScreen('screen-lobby');
        });
    }

    /* ═══════════════════════════════════════════
       AUCTION HOUSE / MARKET
       ═══════════════════════════════════════════ */

    var myUserId = null;
    var sellSelectedCardId = null;

    function openMarket() {
        TT.Net.getMe().then(function (data) {
            myCoins = data.coins || 0;
            myCollection = data.collection;
            myUserId = data.id;
            TT.UI.updateCoins(myCoins);
            switchMarketTab('browse');
            TT.UI.showScreen('screen-market');
        });
    }

    function switchMarketTab(tab) {
        // Update tab buttons
        var tabs = document.querySelectorAll('.market-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });

        // Update panels
        document.getElementById('market-browse').classList.toggle('active', tab === 'browse');
        document.getElementById('market-mine').classList.toggle('active', tab === 'my-listings');
        document.getElementById('market-sell').classList.toggle('active', tab === 'sell');

        if (tab === 'browse') loadBrowse();
        if (tab === 'my-listings') loadMyListings();
        if (tab === 'sell') loadSellGrid();
    }

    function loadBrowse() {
        TT.Net.getListings().then(function (listings) {
            TT.UI.renderMarketBrowse(listings, myUserId, onBuyListing);
        });
    }

    function loadMyListings() {
        TT.Net.getMyListings().then(function (listings) {
            TT.UI.renderMyListings(listings, onCancelListing);
        });
    }

    function loadSellGrid() {
        sellSelectedCardId = null;
        document.getElementById('sell-form').classList.add('hidden');
        TT.Net.getMe().then(function (data) {
            myCollection = data.collection;
            TT.UI.renderSellGrid(myCollection, onSelectSellCard);
        });
    }

    function onSelectSellCard(cardId, card) {
        sellSelectedCardId = cardId;
        document.getElementById('sell-card-name').textContent = card.name;
        document.getElementById('sell-price').value = '';
        document.getElementById('sell-form').classList.remove('hidden');

        // Highlight selected
        var cards = document.querySelectorAll('#sell-card-grid .card');
        cards.forEach(function (c) { c.classList.toggle('sell-selected', parseInt(c.dataset.cardId) === cardId); });
    }

    function onConfirmSell() {
        if (!sellSelectedCardId) return;
        var price = parseInt(document.getElementById('sell-price').value, 10);
        if (!price || price < 1 || price > 99999) { alert('Set a price between 1 and 99,999'); return; }

        TT.Net.listCard(sellSelectedCardId, price).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCollection = data.collection;
            loadSellGrid();
        });
    }

    function onBuyListing(listingId) {
        if (!confirm('Buy this card?')) return;
        TT.Net.buyListing(listingId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCoins = data.coins;
            TT.UI.updateCoins(myCoins);
            loadBrowse();
        });
    }

    function onCancelListing(listingId) {
        TT.Net.cancelListing(listingId).then(function (data) {
            if (data.error) { alert(data.error); return; }
            myCollection = data.collection;
            loadMyListings();
        });
    }

    /* ═══════════════════════════════════════════
       SOCKET EVENTS
       ═══════════════════════════════════════════ */

    function wireSocketEvents() {
        TT.Net.on('online-players', function (list) {
            TT.UI.renderPlayerList(list, myUsername);
        });

        TT.Net.on('queue-status', function (data) {
            TT.UI.setQueueUI(data.inQueue);
        });

        TT.Net.on('deck-select', onDeckSelect);
        TT.Net.on('deck-confirmed', function () {
            TT.UI.showDeckWaiting();
        });

        TT.Net.on('game-state', onGameState);
        TT.Net.on('claim-phase', onClaimPhase);
        TT.Net.on('waiting-claim', onWaitingClaim);
        TT.Net.on('match-over', onMatchOver);
        TT.Net.on('opponent-disconnected', onOpponentDisconnected);

        TT.Net.on('forfeited', function () {
            backToLobby();
        });

        TT.Net.on('error-msg', function (msg) {
            console.error('[Server]', msg);
        });

        TT.Net.on('kicked', function (msg) {
            alert(msg);
            TT.Net.disconnect();
            TT.UI.showScreen('screen-auth');
        });
    }

    /* ═══════════════════════════════════════════
       BOOTSTRAP
       ═══════════════════════════════════════════ */

    document.addEventListener('DOMContentLoaded', function () {

        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }

        wireSocketEvents();

        // Auth buttons
        document.getElementById('btn-login').addEventListener('click', function () { doAuth('login'); });
        document.getElementById('btn-register').addEventListener('click', function () { doAuth('register'); });
        // Enter key submits
        document.getElementById('auth-pass').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') doAuth('login');
        });

        // Lobby buttons
        document.getElementById('btn-find-match').addEventListener('click', onFindMatch);
        document.getElementById('btn-cancel-find').addEventListener('click', onCancelFind);
        document.getElementById('btn-logout').addEventListener('click', onLogout);
        document.getElementById('btn-collection').addEventListener('click', openCollection);
        document.getElementById('btn-play-ai').addEventListener('click', onPlayAI);
        document.getElementById('btn-shop').addEventListener('click', openShop);
        document.getElementById('btn-market').addEventListener('click', openMarket);
        document.getElementById('btn-how-to-play').addEventListener('click', function () {
            TT.UI.showScreen('screen-how-to-play');
        });
        document.getElementById('btn-htp-back').addEventListener('click', function () {
            TT.UI.showScreen('screen-lobby');
        });

        // Collection
        document.getElementById('btn-back-lobby').addEventListener('click', function () {
            TT.UI.showScreen('screen-lobby');
        });

        // Sort buttons in collection
        var sortBtns = document.querySelectorAll('.sort-btn');
        sortBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                sortBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                TT.UI._collectionSortMode = btn.dataset.sort;
                if (myCollection) {
                    TT.UI.renderCollection(myCollection, myCoins, onSellCard);
                }
            });
        });

        // Shop
        document.getElementById('btn-shop-back').addEventListener('click', function () {
            TT.Net.getMe().then(function (data) {
                myStats = data.stats;
                myCollection = data.collection;
                myCoins = data.coins || 0;
                TT.UI.renderLobby(myUsername, myStats, myCoins);
                TT.UI.showScreen('screen-lobby');
            });
        });
        document.getElementById('btn-pack-done').addEventListener('click', function () {
            openShop();
        });

        // Market / Auction House
        document.getElementById('btn-market-back').addEventListener('click', function () {
            TT.Net.getMe().then(function (data) {
                myStats = data.stats;
                myCollection = data.collection;
                myCoins = data.coins || 0;
                TT.UI.renderLobby(myUsername, myStats, myCoins);
                TT.UI.showScreen('screen-lobby');
            });
        });
        document.querySelectorAll('.market-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchMarketTab(tab.dataset.tab);
            });
        });
        document.getElementById('btn-confirm-sell').addEventListener('click', onConfirmSell);
        document.getElementById('btn-cancel-sell').addEventListener('click', function () {
            sellSelectedCardId = null;
            document.getElementById('sell-form').classList.add('hidden');
            document.querySelectorAll('#sell-card-grid .card').forEach(function (c) {
                c.classList.remove('sell-selected');
            });
        });

        // Deck select
        document.getElementById('deck-grid').addEventListener('click', function (e) {
            var card = e.target.closest('.card');
            if (card) toggleDeckCard(card);
        });
        document.getElementById('btn-confirm-deck').addEventListener('click', confirmDeck);

        // Forfeit buttons
        document.getElementById('btn-forfeit-deck').addEventListener('click', function () {
            TT.Net.emit('forfeit');
        });
        document.getElementById('btn-forfeit-game').addEventListener('click', function () {
            if (confirm('Forfeit this match?')) TT.Net.emit('forfeit');
        });

        // Game
        document.getElementById('player-hand').addEventListener('click', onHandClick);
        document.getElementById('board').addEventListener('click', onBoardClick);

        // Claim
        document.getElementById('claim-cards').addEventListener('click', onClaimClick);

        // Result
        document.getElementById('btn-back-to-lobby').addEventListener('click', backToLobby);

        // Try auto-login from existing session
        TT.Net.getMe().then(function (data) {
            myUserId     = data.id;
            myUsername   = data.username;
            myStats      = data.stats;
            myCollection = data.collection;
            myCoins      = data.coins || 0;
            TT.UI.renderLobby(myUsername, myStats, myCoins);
            TT.UI.showScreen('screen-lobby');
            TT.Net.connect();
        }).catch(function () {
            // Not logged in, show auth screen
            TT.UI.showScreen('screen-auth');
        });
    });

})();
