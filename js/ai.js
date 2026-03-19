/* ═══════════════════════════════════════════════════════════
   AI Opponent – greedy single-move look-ahead
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.AI = {

    /**
     * Pick the best (handIndex, boardPos) for the current AI turn.
     * Strategy: simulate every possible move, pick the one that
     * maximises (AI score − Player score). Ties broken randomly.
     */
    getBestMove: function (game) {
        var hand  = game.hands.ai;
        var empty = game.getEmptyPositions();

        var bestScore = -Infinity;
        var bestMoves = [];

        for (var hi = 0; hi < hand.length; hi++) {
            for (var ei = 0; ei < empty.length; ei++) {
                var pos = empty[ei];
                var sim = game.clone();
                sim.placeCard(hi, pos);

                var score = this._evaluate(sim);
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ handIndex: hi, boardPos: pos }];
                } else if (score === bestScore) {
                    bestMoves.push({ handIndex: hi, boardPos: pos });
                }
            }
        }

        // Random pick among equally-good moves
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    },

    /** Board evaluation from AI's perspective (higher = better for AI) */
    _evaluate: function (game) {
        var s = game.getScores();
        return s.ai - s.player;
    }
};
