const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function now() { return new Date().toISOString(); }

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

function tokenize(text) {
    return text.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
}

function ngrams(tokens, n) {
    const result = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        result.push(tokens.slice(i, i + n).join(' '));
    }
    return result;
}

function cosineSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    let intersection = 0;
    for (const item of setA) if (setB.has(item)) intersection++;
    const denom = Math.sqrt(setA.size) * Math.sqrt(setB.size);
    return denom === 0 ? 0 : intersection / denom;
}

function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            matrix[i][j] = a[i - 1] === b[j - 1] ? matrix[i - 1][j - 1] : Math.min(matrix[i - 1][j - 1], matrix[i - 1][j], matrix[i][j - 1]) + 1;
    return matrix[a.length][b.length];
}

function fuzzyScore(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return 1.0;
    const words = q.split(/\s+/);
    const matched = words.filter(w => t.includes(w)).length;
    const ratio = matched / words.length;
    const dist = levenshtein(q.slice(0, Math.min(q.length, 20)), t.slice(0, Math.min(t.length, 20)));
    const normDist = 1 - dist / Math.max(q.length, t.length);
    return Math.max(ratio * 0.7, normDist * 0.5);
}

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

module.exports = { clamp, now, slugify, tokenize, ngrams, cosineSimilarity, levenshtein, fuzzyScore, chunkArray, formatBytes, estimateTokens };
