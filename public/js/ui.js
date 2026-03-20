/* ═══════════════════════════════════════════════════════════
   UI – screen switching, card builders, board rendering
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.UI = {

    selectedHandIndex: null,

    // Map of card ID → image filename (only cards with artwork)
    CARD_IMAGES: {
        1: 'moss.png',
        2: 'stinger.png',
    },

    /* ── Screen management ───────────────────── */

    showScreen: function (id) {
        var screens = document.querySelectorAll('.screen');
        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.remove('active');
        }
        document.getElementById(id).classList.add('active');
    },

    /* ── Card DOM builder ────────────────────── */

    buildCard: function (card, cssClass, opts) {
        opts = opts || {};
        var rarity = TT.getRarity(card.level);
        var el = document.createElement('div');
        el.className = 'card ' + (cssClass || 'card-neutral') + ' ' + rarity.css;
        el.dataset.cardId = card.id;

        // Card artwork (if available)
        var imgFile = TT.UI.CARD_IMAGES[card.id];
        if (imgFile) {
            var img = document.createElement('div');
            img.className = 'card-image';
            img.style.backgroundImage = 'url(/images/cards/' + imgFile + ')';
            el.appendChild(img);
        }

        var lvl = document.createElement('div');
        lvl.className = 'card-level';
        lvl.textContent = 'Lv.' + card.level;
        el.appendChild(lvl);

        // Rarity badge
        if (!opts.hideRarity) {
            var rb = document.createElement('div');
            rb.className = 'rarity-badge ' + rarity.css;
            rb.textContent = rarity.name;
            el.appendChild(rb);
        }

        var vals = document.createElement('div');
        vals.className = 'card-values';
        var dirs = ['top', 'right', 'bottom', 'left'];
        for (var i = 0; i < 4; i++) {
            var sp = document.createElement('span');
            sp.className = 'val val-' + dirs[i];
            sp.textContent = TT.formatValue(card.values[i]);
            vals.appendChild(sp);
        }
        el.appendChild(vals);

        var nm = document.createElement('div');
        nm.className = 'card-name';
        nm.textContent = card.name;
        el.appendChild(nm);

        return el;
    },

    buildFaceDown: function () {
        var el = document.createElement('div');
        el.className = 'card card-facedown';
        var b = document.createElement('div');
        b.className = 'card-back';
        b.textContent = '?';
        el.appendChild(b);
        return el;
    },

    /* ── Lobby ───────────────────────────────── */

    renderLobby: function (username, stats, coins) {
        document.getElementById('lobby-username').textContent = username;
        document.getElementById('lobby-stats').textContent =
            stats.wins + 'W / ' + stats.losses + 'L / ' + stats.draws + 'D';
        document.getElementById('lobby-coins').textContent = '🪙 ' + (coins || 0);
    },

    renderPlayerList: function (players, myUsername) {
        var ul = document.getElementById('player-list');
        ul.innerHTML = '';
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            var li = document.createElement('li');

            var dot = document.createElement('span');
            dot.className = 'status-dot';
            if (p.inMatch)     dot.classList.add('busy');
            else if (p.inQueue) dot.classList.add('queue');
            else                dot.classList.add('available');

            var name = document.createTextNode(p.username);
            var status = document.createElement('span');
            status.className = 'stats-badge';
            status.textContent = p.inMatch ? 'In Match' : p.inQueue ? 'Searching' : 'Online';

            li.appendChild(dot);
            li.appendChild(name);
            li.appendChild(status);
            if (p.username === myUsername) li.style.opacity = '0.5';
            ul.appendChild(li);
        }
    },

    setQueueUI: function (inQueue) {
        var findBtn   = document.getElementById('btn-find-match');
        var cancelBtn = document.getElementById('btn-cancel-find');
        var queueMsg  = document.getElementById('queue-msg');
        if (inQueue) {
            findBtn.classList.add('hidden');
            cancelBtn.classList.remove('hidden');
            queueMsg.classList.remove('hidden');
        } else {
            findBtn.classList.remove('hidden');
            cancelBtn.classList.add('hidden');
            queueMsg.classList.add('hidden');
        }
    },

    /* ── Collection ──────────────────────────── */

    _collectionSortMode: 'level-desc',

    renderCollection: function (collection, coins, onSell) {
        var grid  = document.getElementById('collection-grid');
        var count = document.getElementById('coll-count');
        var coinsEl = document.getElementById('coll-coins');
        grid.innerHTML = '';

        // Sell price lookup
        var sellPrices = { 1: 10, 2: 20, 3: 35, 4: 55, 5: 80, 6: 120, 7: 175, 8: 250, 9: 400, 10: 600 };

        // Group by cardId and count duplicates
        var groups = {};
        for (var i = 0; i < collection.length; i++) {
            var cid = collection[i].cardId;
            groups[cid] = (groups[cid] || 0) + 1;
        }

        var ids = Object.keys(groups).map(Number);
        var self = this;

        // Sort
        var sortMode = this._collectionSortMode;
        ids.sort(function (a, b) {
            var cA = TT.CARD_MAP[a], cB = TT.CARD_MAP[b];
            if (!cA || !cB) return 0;
            if (sortMode === 'level-desc') return cB.level - cA.level || a - b;
            if (sortMode === 'level-asc')  return cA.level - cB.level || a - b;
            if (sortMode === 'rarity')     return cB.level - cA.level || a - b;
            if (sortMode === 'name')       return cA.name.localeCompare(cB.name);
            if (sortMode === 'dupes')      return (groups[b] - groups[a]) || cB.level - cA.level;
            return a - b;
        });

        var uniqueCount = ids.length;
        var totalCount  = collection.length;
        count.textContent = uniqueCount + ' unique / ' + totalCount + ' total';
        if (coinsEl) coinsEl.textContent = '🪙 ' + (coins || 0);

        for (var j = 0; j < ids.length; j++) {
            var card = TT.CARD_MAP[ids[j]];
            if (!card) continue;
            var dupeCount = groups[ids[j]];

            // Card stack wrapper
            var wrapper = document.createElement('div');
            wrapper.className = 'card-stack';
            if (dupeCount > 1) wrapper.classList.add('has-dupes');

            var el = this.buildCard(card, 'card-neutral');

            // Duplicate count badge
            if (dupeCount > 1) {
                var badge = document.createElement('div');
                badge.className = 'stack-count';
                badge.textContent = 'x' + dupeCount;
                wrapper.appendChild(badge);
            }

            // Sell button (shows on all but especially visible for dupes)
            if (onSell) {
                var sellBtn = document.createElement('button');
                sellBtn.className = 'sell-btn';
                sellBtn.textContent = 'Sell ' + (sellPrices[card.level] || 10) + '🪙';
                sellBtn.dataset.cardId = card.id;
                sellBtn.addEventListener('click', (function(cardId) {
                    return function(e) { e.stopPropagation(); onSell(cardId); };
                })(card.id));
                el.appendChild(sellBtn);
            }

            wrapper.appendChild(el);
            grid.appendChild(wrapper);
        }
    },

    /* ── Deck select ─────────────────────────── */

    renderDeckSelect: function (collection, opponentName) {
        document.getElementById('deck-opponent').textContent = 'vs ' + opponentName;
        document.getElementById('deck-count').textContent = '0';
        document.getElementById('btn-confirm-deck').disabled = true;
        document.getElementById('btn-confirm-deck').classList.remove('hidden');
        document.getElementById('deck-waiting').classList.add('hidden');

        var grid = document.getElementById('deck-grid');
        grid.innerHTML = '';

        // Show each card instance
        for (var i = 0; i < collection.length; i++) {
            var card = TT.CARD_MAP[collection[i].cardId];
            if (!card) continue;
            var el = this.buildCard(card, 'card-neutral');
            el.dataset.cardId = card.id;
            grid.appendChild(el);
        }
    },

    updateDeckCount: function (n) {
        document.getElementById('deck-count').textContent = n;
        document.getElementById('btn-confirm-deck').disabled = (n !== 5);
    },

    showDeckWaiting: function () {
        document.getElementById('btn-confirm-deck').classList.add('hidden');
        document.getElementById('deck-waiting').classList.remove('hidden');
    },

    /* ── Game board ──────────────────────────── */

    initBoard: function () {
        var board = document.getElementById('board');
        board.innerHTML = '';
        for (var i = 0; i < 9; i++) {
            var cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.pos = i;
            board.appendChild(cell);
        }
    },

    renderGameState: function (state) {
        // Names & scores
        document.getElementById('opp-name').textContent = state.opponentName;
        document.getElementById('player-score').textContent = state.myScore;
        document.getElementById('opponent-score').textContent = state.opScore;

        // Turn
        var turnEl = document.getElementById('turn-indicator');
        if (state.phase === 'gameOver' || state.phase === 'cardClaim' || state.phase === 'done') {
            turnEl.textContent = 'Game Over';
            turnEl.className = 'game-over';
        } else if (state.isMyTurn) {
            turnEl.textContent = 'Your Turn';
            turnEl.className = 'player-turn';
        } else {
            turnEl.textContent = "Opponent's Turn";
            turnEl.className = 'ai-turn';
        }

        // Board
        this._renderBoardCells(state);

        // Hands
        this._renderMyHand(state);
        this._renderOpponentHand(state);
    },

    _renderBoardCells: function (state) {
        var cells = document.getElementById('board').children;
        var canPlace = state.isMyTurn && this.selectedHandIndex !== null && state.phase === 'playing';

        for (var i = 0; i < 9; i++) {
            var cell = cells[i];
            cell.innerHTML = '';
            cell.className = 'board-cell';

            var slot = state.board[i];
            if (slot) {
                var cls = slot.isOwner ? 'card-mine' : 'card-opponent';
                cell.appendChild(this.buildCard(slot.card, cls));
                cell.classList.add('occupied');
            } else {
                cell.classList.add('empty');
                if (canPlace) cell.classList.add('available');
            }
        }
    },

    _renderMyHand: function (state) {
        var container = document.getElementById('player-hand');
        container.innerHTML = '';
        var canSelect = state.isMyTurn && state.phase === 'playing';

        for (var i = 0; i < state.myHand.length; i++) {
            var el = this.buildCard(state.myHand[i], 'card-mine');
            el.classList.add('hand-card');
            el.dataset.handIndex = i;
            if (canSelect) {
                el.classList.add('selectable');
                if (this.selectedHandIndex === i) el.classList.add('selected');
            }
            container.appendChild(el);
        }
    },

    _renderOpponentHand: function (state) {
        var container = document.getElementById('opponent-hand');
        container.innerHTML = '';
        for (var i = 0; i < state.opponentCards; i++) {
            container.appendChild(this.buildFaceDown());
        }
    },

    /* ── Animations ──────────────────────────── */

    /**
     * Attack animation: placed card lunges toward each flipped card,
     * then the captured card shakes and changes colour.
     */
    animateFlips: function (placedAt, flippedIndices, state) {
        if (!flippedIndices || !flippedIndices.length) return Promise.resolve();

        var cells = document.getElementById('board').children;
        var self  = this;

        // Grid position helpers (3x3)
        function rowCol(idx) { return { r: Math.floor(idx / 3), c: idx % 3 }; }

        // Direction from placed card to flipped card as translate offset
        function getAttackOffset(fromIdx, toIdx) {
            var from = rowCol(fromIdx), to = rowCol(toIdx);
            var dx = (to.c - from.c) * 40;  // px to lunge
            var dy = (to.r - from.r) * 40;
            return { x: dx, y: dy };
        }

        // Animate flips sequentially (one after another for drama)
        var chain = Promise.resolve();
        flippedIndices.forEach(function (flipIdx) {
            chain = chain.then(function () {
                return new Promise(function (resolve) {
                    var placedCell = cells[placedAt];
                    var placedCard = placedCell ? placedCell.querySelector('.card') : null;
                    var targetCell = cells[flipIdx];
                    var targetCard = targetCell ? targetCell.querySelector('.card') : null;

                    if (!placedCard || !targetCard) { resolve(); return; }

                    var offset = getAttackOffset(placedAt, flipIdx);

                    // Phase 1: Placed card lunges toward target (150ms)
                    placedCard.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.9, 0.3)';
                    placedCard.style.transform  = 'translate(' + offset.x + 'px, ' + offset.y + 'px) scale(1.08)';
                    placedCard.style.zIndex     = '10';

                    setTimeout(function () {
                        // Phase 2: Impact — shake target + flash
                        targetCard.classList.add('card-hit');

                        // Snap attacker back
                        placedCard.style.transition = 'transform 0.2s cubic-bezier(0, 0.5, 0.3, 1)';
                        placedCard.style.transform  = 'translate(0, 0) scale(1)';

                        setTimeout(function () {
                            placedCard.style.zIndex = '';
                        }, 200);

                        // Phase 3: After shake, flip the color (300ms after impact)
                        setTimeout(function () {
                            targetCard.classList.remove('card-hit');
                            var slot = state.board[flipIdx];
                            if (slot) {
                                var cls   = slot.isOwner ? 'card-mine' : 'card-opponent';
                                var newEl = self.buildCard(slot.card, cls, { hideRarity: true });
                                newEl.classList.add('card-captured');
                                targetCell.innerHTML = '';
                                targetCell.appendChild(newEl);
                            }
                            setTimeout(resolve, 200);
                        }, 300);
                    }, 150);
                });
            });
        });

        return chain;
    },

    /* ── Claim screen ────────────────────────── */

    renderClaimCards: function (cards) {
        var grid = document.getElementById('claim-cards');
        grid.innerHTML = '';
        for (var i = 0; i < cards.length; i++) {
            var el = this.buildCard(cards[i], 'card-opponent');
            el.dataset.cardId = cards[i].id;
            el.style.cursor = 'pointer';
            grid.appendChild(el);
        }
    },

    /* ── Result screen ───────────────────────── */

    renderResult: function (perspective, claimedCardId, coins, reward) {
        var msg = { win: 'You Win!', lose: 'You Lose!', draw: 'Draw!' };
        var h2  = document.getElementById('result-text');
        h2.textContent = msg[perspective] || '';
        h2.className   = perspective;

        var cardMsg = document.getElementById('result-card-msg');
        if (perspective === 'win' && claimedCardId) {
            var card = TT.CARD_MAP[claimedCardId];
            cardMsg.textContent = card ? 'You claimed ' + card.name + '!' : '';
        } else if (perspective === 'lose' && claimedCardId) {
            var lostCard = TT.CARD_MAP[claimedCardId];
            cardMsg.textContent = lostCard ? 'You lost ' + lostCard.name : '';
        } else {
            cardMsg.textContent = perspective === 'draw' ? 'No cards exchanged' : '';
        }

        if (coins !== undefined) {
            var rewardText = reward ? ' (+' + reward + ')' : '';
            cardMsg.textContent += '  |  🪙 ' + coins + rewardText;
        }
    },

    /* ── Shop ────────────────────────────────── */

    renderShop: function (packs, coins, onBuy) {
        var coinsEl = document.getElementById('shop-coins');
        if (coinsEl) coinsEl.textContent = '🪙 ' + (coins || 0);

        var grid = document.getElementById('pack-list');
        grid.innerHTML = '';

        var icons = { bronze: '🥉', silver: '🥈', gold: '🥇', legend: '💎' };
        var levelInfo = { bronze: 'Lv 1–3', silver: 'Lv 2–5', gold: 'Lv 4–7', legend: 'Lv 7–10' };

        for (var i = 0; i < packs.length; i++) {
            var p = packs[i];
            var card = document.createElement('div');
            card.className = 'pack-card ' + p.id;
            card.dataset.packId = p.id;

            card.innerHTML =
                '<div class="pack-icon">' + (icons[p.id] || '📦') + '</div>' +
                '<div class="pack-name">' + p.name + '</div>' +
                '<div class="pack-cost">🪙 ' + p.cost + '</div>' +
                '<div class="pack-info">' + p.count + ' cards · ' + (levelInfo[p.id] || '') + '</div>';

            card.addEventListener('click', (function(packId) {
                return function() { onBuy(packId); };
            })(p.id));

            grid.appendChild(card);
        }
    },

    renderPackResult: function (cards, coins) {
        var grid = document.getElementById('pack-cards');
        grid.innerHTML = '';
        for (var i = 0; i < cards.length; i++) {
            var el = this.buildCard(cards[i], 'card-neutral');
            grid.appendChild(el);
        }
        var coinsEl = document.getElementById('pack-coins-left');
        if (coinsEl) coinsEl.textContent = '🪙 ' + (coins || 0);
    },

    updateCoins: function (coins) {
        var els = ['lobby-coins', 'shop-coins', 'coll-coins', 'market-coins'];
        for (var i = 0; i < els.length; i++) {
            var el = document.getElementById(els[i]);
            if (el) el.textContent = '🪙 ' + (coins || 0);
        }
    },

    /* ── Market / Auction House ─────────────── */

    renderMarketBrowse: function (listings, myUserId, onBuy) {
        var grid = document.getElementById('market-listings');
        var empty = document.getElementById('market-empty');
        grid.innerHTML = '';

        if (!listings || listings.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        for (var i = 0; i < listings.length; i++) {
            var l = listings[i];
            var card = TT.CARD_MAP[l.card_id];
            if (!card) continue;

            var wrapper = document.createElement('div');
            wrapper.className = 'market-listing';

            var cardEl = this.buildCard(card, 'card-neutral');
            wrapper.appendChild(cardEl);

            var info = document.createElement('div');
            info.className = 'listing-info';
            info.innerHTML =
                '<div class="listing-seller">Seller: ' + this._escapeHtml(l.seller_name) + '</div>' +
                '<div class="listing-price">🪙 ' + l.price + '</div>';
            wrapper.appendChild(info);

            if (l.seller_id !== myUserId) {
                var btn = document.createElement('button');
                btn.className = 'btn gold listing-btn';
                btn.textContent = 'Buy';
                btn.dataset.listingId = l.id;
                btn.addEventListener('click', (function (id) {
                    return function () { onBuy(id); };
                })(l.id));
                wrapper.appendChild(btn);
            }

            grid.appendChild(wrapper);
        }
    },

    renderMyListings: function (listings, onCancel) {
        var grid = document.getElementById('my-listings-grid');
        var empty = document.getElementById('my-listings-empty');
        grid.innerHTML = '';

        if (!listings || listings.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        for (var i = 0; i < listings.length; i++) {
            var l = listings[i];
            var card = TT.CARD_MAP[l.card_id];
            if (!card) continue;

            var wrapper = document.createElement('div');
            wrapper.className = 'market-listing';

            var cardEl = this.buildCard(card, 'card-neutral');
            wrapper.appendChild(cardEl);

            var info = document.createElement('div');
            info.className = 'listing-info';
            info.innerHTML = '<div class="listing-price">🪙 ' + l.price + '</div>';
            wrapper.appendChild(info);

            var btn = document.createElement('button');
            btn.className = 'btn outline listing-btn';
            btn.textContent = 'Cancel';
            btn.dataset.listingId = l.id;
            btn.addEventListener('click', (function (id) {
                return function () { onCancel(id); };
            })(l.id));
            wrapper.appendChild(btn);

            grid.appendChild(wrapper);
        }
    },

    renderSellGrid: function (collection, onSelect) {
        var grid = document.getElementById('sell-card-grid');
        grid.innerHTML = '';

        // Build unique card list with counts
        var counts = {};
        for (var i = 0; i < collection.length; i++) {
            var id = collection[i].cardId || collection[i];
            counts[id] = (counts[id] || 0) + 1;
        }

        var sorted = Object.keys(counts).sort(function (a, b) {
            var ca = TT.CARD_MAP[a], cb = TT.CARD_MAP[b];
            return (cb ? cb.level : 0) - (ca ? ca.level : 0);
        });

        for (var j = 0; j < sorted.length; j++) {
            var cardId = parseInt(sorted[j], 10);
            var card = TT.CARD_MAP[cardId];
            if (!card) continue;

            var el = this.buildCard(card, 'card-neutral');
            el.style.cursor = 'pointer';
            el.dataset.cardId = cardId;

            if (counts[cardId] > 1) {
                var badge = document.createElement('span');
                badge.className = 'dupe-count';
                badge.textContent = 'x' + counts[cardId];
                el.appendChild(badge);
            }

            el.addEventListener('click', (function (cid, c) {
                return function () { onSelect(cid, c); };
            })(cardId, card));

            grid.appendChild(el);
        }
    },

    _escapeHtml: function (str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /* ── Card Detail Modal ──────────────────── */

    showCardModal: function (cardId) {
        var card = TT.CARD_MAP[cardId];
        if (!card) return;

        var modal = document.getElementById('card-modal');
        var slot  = document.getElementById('modal-card-slot');
        slot.innerHTML = '';
        slot.appendChild(this.buildCard(card, 'card-neutral'));

        document.getElementById('modal-card-name').textContent = card.name;
        document.getElementById('modal-card-level').textContent = 'Level ' + card.level;

        var rarity = TT.getRarity(card.level);
        var rarityEl = document.getElementById('modal-card-rarity');
        rarityEl.textContent = rarity.name;
        rarityEl.className = 'modal-rarity rarity-badge ' + rarity.css;

        document.getElementById('modal-val-top').textContent = TT.formatValue(card.values[0]);
        document.getElementById('modal-val-right').textContent = TT.formatValue(card.values[1]);
        document.getElementById('modal-val-bottom').textContent = TT.formatValue(card.values[2]);
        document.getElementById('modal-val-left').textContent = TT.formatValue(card.values[3]);
        var total = card.values[0] + card.values[1] + card.values[2] + card.values[3];
        document.getElementById('modal-val-total').textContent = total;

        var lore = (TT.CARD_LORE && TT.CARD_LORE[cardId]) || '';
        document.getElementById('modal-card-lore').textContent = lore;

        modal.classList.remove('hidden');
    },

    hideCardModal: function () {
        document.getElementById('card-modal').classList.add('hidden');
    }
};
