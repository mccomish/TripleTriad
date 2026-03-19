/* ═══════════════════════════════════════════════════════════
   UI – DOM rendering, animations, event-wiring helpers
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.UI = {

    selectedCardIndex: null,

    /* ── Cache DOM references ────────────────── */

    init: function () {
        this.boardEl        = document.getElementById('board');
        this.playerHandEl   = document.getElementById('player-hand');
        this.opponentHandEl = document.getElementById('opponent-hand');
        this.playerScoreEl  = document.getElementById('player-score');
        this.opponentScoreEl = document.getElementById('opponent-score');
        this.turnEl         = document.getElementById('turn-indicator');
        this.overlayEl      = document.getElementById('game-over-overlay');
        this.resultTextEl   = document.getElementById('game-over-text');

        // Build the 9 board cells once
        this.boardEl.innerHTML = '';
        for (var i = 0; i < 9; i++) {
            var cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.pos = i;
            this.boardEl.appendChild(cell);
        }
    },

    /* ── Full render ─────────────────────────── */

    render: function (game) {
        this._renderBoard(game);
        this._renderHand(game.hands.player, this.playerHandEl, TT.OWNER_PLAYER, game);
        this._renderHand(game.hands.ai, this.opponentHandEl, TT.OWNER_AI, game);
        this._renderScores(game);
        this._renderTurn(game);
    },

    /* ── Board ───────────────────────────────── */

    _renderBoard: function (game) {
        var cells = this.boardEl.children;
        var canPlace = game.currentTurn === TT.OWNER_PLAYER
                    && this.selectedCardIndex !== null
                    && game.phase === 'playing';

        for (var i = 0; i < 9; i++) {
            var cell = cells[i];
            cell.innerHTML = '';
            cell.className = 'board-cell';

            var slot = game.board[i];
            if (slot) {
                cell.appendChild(this._cardEl(slot.card, slot.owner));
                cell.classList.add('occupied');
            } else {
                cell.classList.add('empty');
                if (canPlace) cell.classList.add('available');
            }
        }
    },

    /* ── Hands ───────────────────────────────── */

    _renderHand: function (cards, container, owner, game) {
        container.innerHTML = '';
        var isPlayer   = (owner === TT.OWNER_PLAYER);
        var canSelect  = isPlayer
                      && game.currentTurn === TT.OWNER_PLAYER
                      && game.phase === 'playing';

        for (var i = 0; i < cards.length; i++) {
            var el = isPlayer
                ? this._cardEl(cards[i], owner)
                : this._faceDownEl();

            el.classList.add('hand-card');
            el.dataset.handIndex = i;

            if (canSelect) {
                el.classList.add('selectable');
                if (this.selectedCardIndex === i) el.classList.add('selected');
            }

            container.appendChild(el);
        }
    },

    /* ── Scores ──────────────────────────────── */

    _renderScores: function (game) {
        var s = game.getScores();
        this.playerScoreEl.textContent   = s.player;
        this.opponentScoreEl.textContent = s.ai;
    },

    /* ── Turn indicator ──────────────────────── */

    _renderTurn: function (game) {
        if (game.phase === 'gameOver') {
            this.turnEl.textContent = 'Game Over';
            this.turnEl.className   = 'game-over';
        } else if (game.currentTurn === TT.OWNER_PLAYER) {
            this.turnEl.textContent = 'Your Turn';
            this.turnEl.className   = 'player-turn';
        } else {
            this.turnEl.textContent = "Opponent's Turn";
            this.turnEl.className   = 'ai-turn';
        }
    },

    /* ── Game-over overlay ───────────────────── */

    showGameOver: function (result) {
        var msg = { win: 'You Win!', lose: 'You Lose!', draw: 'Draw!' };
        this.resultTextEl.textContent = msg[result] || '';
        this.resultTextEl.className   = result;
        this.overlayEl.classList.remove('hidden');
    },

    hideGameOver: function () {
        this.overlayEl.classList.add('hidden');
    },

    /* ── Card DOM builders ───────────────────── */

    _cardEl: function (card, owner) {
        var el = document.createElement('div');
        el.className = 'card card-' + owner;

        // Level badge
        var lvl = document.createElement('div');
        lvl.className = 'card-level';
        lvl.textContent = 'Lv.' + card.level;
        el.appendChild(lvl);

        // Values diamond
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

        // Name
        var nm = document.createElement('div');
        nm.className = 'card-name';
        nm.textContent = card.name;
        el.appendChild(nm);

        return el;
    },

    _faceDownEl: function () {
        var el = document.createElement('div');
        el.className = 'card card-facedown';
        var back = document.createElement('div');
        back.className = 'card-back';
        back.textContent = '?';
        el.appendChild(back);
        return el;
    },

    /* ── Animations ──────────────────────────── */

    /**
     * Animate captured cards flipping to new owner.
     * Re-renders those cells mid-animation to swap colors.
     */
    animateFlips: function (flippedIndices, game) {
        if (!flippedIndices.length) return Promise.resolve();

        var cells = this.boardEl.children;
        var self  = this;

        var promises = flippedIndices.map(function (idx) {
            return new Promise(function (resolve) {
                var cell   = cells[idx];
                var cardEl = cell.querySelector('.card');
                if (!cardEl) { resolve(); return; }

                cardEl.classList.add('flipping');

                // At the midpoint (225ms), rebuild the card with new owner colour
                setTimeout(function () {
                    var slot = game.board[idx];
                    if (slot) {
                        var newEl = self._cardEl(slot.card, slot.owner);
                        // Continue the second half of the flip
                        newEl.style.transform = 'scaleX(0)';
                        newEl.style.transition = 'transform 0.225s ease-out';
                        cell.innerHTML = '';
                        cell.classList.add('occupied');
                        cell.appendChild(newEl);
                        // Force reflow then animate to full scale
                        void newEl.offsetWidth;
                        newEl.style.transform = 'scaleX(1)';
                    }
                }, 225);

                setTimeout(resolve, 470);
            });
        });

        return Promise.all(promises);
    }
};
