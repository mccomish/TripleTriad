/* ═══════════════════════════════════════════════════════════
   Main – bootstrap, event wiring, game loop
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

(function () {
    var game;
    var processing = false;   // lock to prevent double-clicks

    /* ── Start / restart a game ──────────────── */

    function startGame() {
        game = new TT.Game();

        // Deal 5 cards each from levels 1-5 (fair starting pool)
        var pool = TT.shuffle(
            TT.CARDS.filter(function (c) { return c.level >= 1 && c.level <= 5; })
        );
        var picked = pool.slice(0, 10).map(TT.cloneCard);

        game.init(picked.slice(0, 5), picked.slice(5, 10));

        TT.UI.selectedCardIndex = null;
        TT.UI.hideGameOver();
        TT.UI.render(game);
        processing = false;
    }

    /* ── Player clicks a card in their hand ──── */

    function onHandClick(e) {
        if (processing) return;
        if (game.currentTurn !== TT.OWNER_PLAYER || game.phase !== 'playing') return;

        var el = e.target.closest('.hand-card.selectable');
        if (!el) return;

        var idx = parseInt(el.dataset.handIndex, 10);
        TT.UI.selectedCardIndex = (TT.UI.selectedCardIndex === idx) ? null : idx;
        TT.UI.render(game);
    }

    /* ── Player clicks a board cell ──────────── */

    function onBoardClick(e) {
        if (processing) return;
        if (game.currentTurn !== TT.OWNER_PLAYER || game.phase !== 'playing') return;
        if (TT.UI.selectedCardIndex === null) return;

        var cell = e.target.closest('.board-cell.empty');
        if (!cell) return;

        processing = true;
        var pos    = parseInt(cell.dataset.pos, 10);
        var result = game.placeCard(TT.UI.selectedCardIndex, pos);

        if (!result.placed) { processing = false; return; }

        TT.UI.selectedCardIndex = null;

        // Show the placed card (without flips yet – render with pre-flip owners)
        TT.UI.render(game);

        // Animate captures, then continue
        TT.UI.animateFlips(result.flipped, game).then(function () {
            TT.UI.render(game);

            if (game.phase === 'gameOver') {
                setTimeout(function () { TT.UI.showGameOver(game.getResult()); }, 250);
                processing = false;
                return;
            }

            // AI turn
            aiTurn();
        });
    }

    /* ── AI turn ─────────────────────────────── */

    function aiTurn() {
        TT.UI.render(game);

        // Brief "thinking" pause
        setTimeout(function () {
            var move = TT.AI.getBestMove(game);
            if (!move) { processing = false; return; }

            var result = game.placeCard(move.handIndex, move.boardPos);
            TT.UI.render(game);

            TT.UI.animateFlips(result.flipped, game).then(function () {
                TT.UI.render(game);

                if (game.phase === 'gameOver') {
                    setTimeout(function () { TT.UI.showGameOver(game.getResult()); }, 250);
                }

                processing = false;
            });
        }, 600);
    }

    /* ── Bootstrap ───────────────────────────── */

    document.addEventListener('DOMContentLoaded', function () {
        TT.UI.init();

        document.getElementById('player-hand').addEventListener('click', onHandClick);
        document.getElementById('board').addEventListener('click', onBoardClick);
        document.getElementById('play-again-btn').addEventListener('click', startGame);

        startGame();
    });
})();
