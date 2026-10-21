'use strict';

module.exports.MANIFEST = {
    name: 'game_theory_analyzer',
    description: 'Analyze strategic scenarios - Nash equilibrium, zero-sum games, payoff matrices, Pareto optimal',
    version: '1.0.0',
    inputs: { payoffMatrix: 'array', players: 'array', scenario: 'string', analysisType: 'string' },
    output: { schema: 'game_theory' }
};

const PLT_AFFINITY = { profit: 0.7, love: 0.2, tax: 0.1 };

async function skill_game_theory_analyzer(input, brain, memory) {
    var payoffMatrix = input.payoffMatrix || [[1, 0], [0.5, 0.5]];
    var players = input.players || ['Player A', 'Player B'];
    var scenario = input.scenario || 'Prisoner\'s Dilemma';
    var analysisType = input.analysisType || 'nash';
    
    function findNash(matrix) {
        var equilibria = [];
        var rows = matrix.length;
        var cols = matrix[0].length;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var aVal = matrix[r][c];
                var isBestA = true;
                for (var rr = 0; rr < rows; rr++) {
                    if (matrix[rr][c] > aVal) isBestA = false;
                }
                if (!isBestA) continue;
                var isBestB = true;
                for (var cc = 0; cc < cols; cc++) {
                    if (matrix[r][cc] > aVal) isBestB = false;
                }
                if (isBestB) equilibria.push({ row: r, col: c, value: aVal });
            }
        }
        return equilibria;
    }
    
    function calcDominance(matrix) {
        var dominated = { rows: [], cols: [] };
        for (var r = 0; r < matrix.length; r++) {
            for (var rr = 0; rr < matrix.length; rr++) {
                if (r !== rr && matrix[r].every(function(v, c) { return v <= matrix[rr][c]; })) {
                    dominated.rows.push({ row: r, dominatedBy: rr });
                }
            }
        }
        return dominated;
    }
    
    var nashEquilibrium = findNash(payoffMatrix);
    var dominated = calcDominance(payoffMatrix);
    
    var analysis = {
        scenario: scenario,
        players: players,
        matrix: payoffMatrix,
        nashEquilibrium: nashEquilibrium,
        dominantStrategy: dominated.cols.length === 0 && dominated.rows.length === 0,
        paretoOptimal: nashEquilibrium.length > 0,
        value: nashEquilibrium.length > 0 ? nashEquilibrium[0].value : null,
        insight: nashEquilibrium.length > 0 
            ? scenario + ' has Nash equilibrium at row ' + nashEquilibrium[0].row + ', col ' + nashEquilibrium[0].col 
            : scenario + ' has no pure Nash equilibrium (mixed strategy recommended)'
    };
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'game_theory_analyzer', weight: 0.7 });
    }
    
    return {
        skill: 'game_theory_analyzer',
        success: true,
        analysis: analysis,
        nashEquilibria: nashEquilibrium,
        timestamp: Date.now()
    };
}

module.exports = { skill_game_theory_analyzer, PLT_AFFINITY };