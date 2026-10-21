'use strict';

const PLT_AFFINITY = { profit: 0.7, love: 0.1, tax: 0.2 };

function skill_data_analysis(input) {
    const data = input.data || input.dataset || input.array || [];
    const analysisType = input.type || 'standard';
    
    if (!Array.isArray(data) || data.length === 0) {
        return Promise.resolve({
            skill: 'data_analysis',
            plt_affinity: PLT_AFFINITY,
            error: 'No data provided or empty dataset',
            timestamp: Date.now(),
        });
    }

    const numericData = data.filter(v => typeof v === 'number');
    const stats = numericData.length > 0 ? calculateStats(numericData) : {};
    const patterns = detectPatterns(data);
    const outliers = detectOutliers(numericData);
    
    return Promise.resolve({
        skill: 'data_analysis',
        plt_affinity: PLT_AFFINITY,
        analysis_type: analysisType,
        dataset_size: data.length,
        numeric_count: numericData.length,
        stats,
        patterns,
        outliers,
        plt_recommendation: generatePLTRecommendation(stats, patterns),
        timestamp: Date.now(),
    });
}

function calculateStats(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    
    return {
        count: numbers.length,
        sum,
        mean: Math.round(mean * 100) / 100,
        median: sorted[Math.floor(sorted.length / 2)],
        mode: findMode(numbers),
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        range: Math.max(...numbers) - Math.min(...numbers),
        variance: Math.round(variance * 100) / 100,
        std_dev: Math.round(Math.sqrt(variance) * 100) / 100,
    };
}

function findMode(numbers) {
    const freq = {};
    numbers.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : null;
}

function detectPatterns(data) {
    const patterns = [];
    
    const numericData = data.filter(v => typeof v === 'number');
    if (numericData.length >= 3) {
        const isIncreasing = numericData.every((v, i) => i === 0 || v >= numericData[i - 1]);
        if (isIncreasing) patterns.push({ type: 'increasing', confidence: 0.8 });
        
        const isDecreasing = numericData.every((v, i) => i === 0 || v <= numericData[i - 1]);
        if (isDecreasing) patterns.push({ type: 'decreasing', confidence: 0.8 });
        
        const isUniform = numericData.every(v => Math.abs(v - numericData[0]) < 0.001);
        if (isUniform) patterns.push({ type: 'uniform', confidence: 0.95 });
    }
    
    if (data.length > 10) {
        patterns.push({ type: 'sufficient_data', confidence: Math.min(1, data.length / 100) });
    }
    
    return patterns;
}

function detectOutliers(numbers) {
    if (numbers.length < 3) return [];
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const std = Math.sqrt(numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length);
    
    const outliers = [];
    numbers.forEach((n, i) => {
        if (Math.abs(n - mean) > 2 * std) {
            outliers.push({ value: n, index: i, deviation: Math.round(Math.abs(n - mean) / std * 100) / 100 });
        }
    });
    
    return outliers;
}

function generatePLTRecommendation(stats, patterns) {
    const recommendations = [];
    
    if (stats.std_dev > stats.mean * 0.5) {
        recommendations.push({ dimension: 'profit', action: 'Stabilize values - high variance detected' });
    }
    
    if (patterns.find(p => p.type === 'increasing')) {
        recommendations.push({ dimension: 'profit', action: 'Capitalize on growth trend' });
    }
    
    if (stats.mean > 0) {
        recommendations.push({ dimension: 'love', action: 'Average is positive - focus on consistency' });
    }
    
    return recommendations;
}

module.exports = { skill_data_analysis };