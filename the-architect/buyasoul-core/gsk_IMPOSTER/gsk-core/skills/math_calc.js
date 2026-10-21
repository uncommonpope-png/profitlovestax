'use strict';

const PLT_AFFINITY = { profit: 0.4, love: 0.4, tax: 0.2 };

function skill_math_calc(input) {
    const expression = typeof input === 'string' ? input : (input.expression || input.calc || '');
    
    try {
        const result = evaluateExpression(expression);
        
        return Promise.resolve({
            skill: 'math_calc',
            plt_affinity: PLT_AFFINITY,
            expression,
            result,
            timestamp: Date.now(),
        });
    } catch (e) {
        return Promise.resolve({
            skill: 'math_calc',
            plt_affinity: PLT_AFFINITY,
            expression,
            error: e.message,
            timestamp: Date.now(),
        });
    }
}

function evaluateExpression(expr) {
    expr = expr.replace(/\s+/g, '');
    
    // Handle common math functions
    expr = expr.replace(/sqrt\(([^)]+)\)/gi, (_, inner) => {
        const val = evaluateExpression(inner);
        return Math.sqrt(val);
    });
    expr = expr.replace(/abs\(([^)]+)\)/gi, (_, inner) => {
        const val = evaluateExpression(inner);
        return Math.abs(val);
    });
    expr = expr.replace(/pow\(([^,]+),([^)]+)\)/gi, (_, a, b) => {
        return Math.pow(evaluateExpression(a), evaluateExpression(b));
    });
    expr = expr.replace(/sin\(([^)]+)\)/gi, (_, inner) => Math.sin(evaluateExpression(inner)));
    expr = expr.replace(/cos\(([^)]+)\)/gi, (_, inner) => Math.cos(evaluateExpression(inner)));
    expr = expr.replace(/tan\(([^)]+)\)/gi, (_, inner) => Math.tan(evaluateExpression(inner)));
    expr = expr.replace(/log\(([^)]+)\)/gi, (_, inner) => Math.log(evaluateExpression(inner)));
    
    // Handle pi and e
    expr = expr.replace(/pi/gi, String(Math.PI));
    expr = expr.replace(/\be\b/g, String(Math.E));
    
    const tokens = tokenize(expr);
    const result = parseExpression(tokens);
    
    return {
        result: Math.round(result * 1000000) / 1000000,
        breakdown: explainTokens(tokens),
    };
}

function tokenize(expr) {
    const tokens = [];
    let num = '';
    
    for (let i = 0; i < expr.length; i++) {
        const c = expr[i];
        
        if (/[0-9.]/.test(c)) {
            num += c;
        } else {
            if (num) {
                tokens.push({ type: 'number', value: parseFloat(num) });
                num = '';
            }
            
            if ('+-*/()^'.includes(c)) {
                tokens.push({ type: 'operator', value: c });
            }
        }
    }
    
    if (num) {
        tokens.push({ type: 'number', value: parseFloat(num) });
    }
    
    return tokens;
}

function parseExpression(tokens) {
    let pos = 0;
    
    function parseTerm() {
        let left = parseFactor();
        
        while (pos < tokens.length && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
            const op = tokens[pos++].value;
            const right = parseFactor();
            left = op === '*' ? left * right : left / right;
        }
        
        return left;
    }
    
    function parseFactor() {
        if (pos < tokens.length && tokens[pos].type === 'operator' && tokens[pos].value === '-') {
            pos++;
            return -parsePrimary();
        }
        return parsePrimary();
    }
    
    function parsePrimary() {
        if (pos < tokens.length) {
            if (tokens[pos].type === 'number') {
                return tokens[pos++].value;
            }
            if (tokens[pos].value === '(') {
                pos++;
                const result = parseAdd();
                if (pos < tokens.length && tokens[pos].value === ')') {
                    pos++;
                }
                return result;
            }
        }
        return 0;
    }
    
    function parseAdd() {
        let left = parseTerm();
        
        while (pos < tokens.length && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
            const op = tokens[pos++].value;
            const right = parseTerm();
            left = op === '+' ? left + right : left - right;
        }
        
        return left;
    }
    
    return parseAdd();
}

function explainTokens(tokens) {
    return tokens.map(t => t.type === 'number' ? t.value : t.value).join(' ');
}

module.exports = { skill_math_calc };