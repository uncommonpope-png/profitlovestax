'use strict';

const PLT_AFFINITY = { profit: 0.4, love: 0.3, tax: 0.3 };

function skill_summarize(input) {
    const text = typeof input === 'string' ? input : (input.text || input.content || '');
    const mode = input.mode || 'standard';
    const maxLength = input.maxLength || 500;
    
    if (!text.trim()) {
        return Promise.resolve({
            skill: 'summarize',
            plt_affinity: PLT_AFFINITY,
            error: 'No text provided',
            timestamp: Date.now(),
        });
    }

    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    
    const keyPoints = extractKeyPoints(text);
    const mainTopic = inferTopic(text);
    
    return Promise.resolve({
        skill: 'summarize',
        plt_affinity: PLT_AFFINITY,
        mode,
        original_length: words,
        original_sentences: sentences,
        summary: generateSummary(text, mode, maxLength),
        key_points: keyPoints,
        topic: mainTopic,
        compression_ratio: Math.round((1 - keyPoints.join(' ').length / text.length) * 100) + '%',
        timestamp: Date.now(),
    });
}

function extractKeyPoints(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).slice(0, 10);
    
    const points = sentences
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 200)
        .map(s => {
            if (s.includes(':')) return s.split(':')[1]?.trim() || s;
            return s;
        })
        .slice(0, 5);
    
    return points.length > 0 ? points : sentences.slice(0, 3);
}

function inferTopic(text) {
    const words = text.toLowerCase().split(/\s+/);
    const freq = {};
    
    for (const word of words) {
        if (word.length > 4) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }
    
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([w]) => w).join(', ');
}

function generateSummary(text, mode, maxLength) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    if (mode === 'bullet') {
        return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
    }
    
    if (mode === 'one-line') {
        const firstSentences = sentences.slice(0, 2).join('. ');
        return firstSentences.length > maxLength 
            ? firstSentences.substring(0, maxLength) + '...' 
            : firstSentences + '.';
    }
    
    const summary = sentences.slice(0, 3).join('. ');
    return summary.length > maxLength 
        ? summary.substring(0, maxLength) + '...' 
        : summary + '.';
}

module.exports = { skill_summarize };