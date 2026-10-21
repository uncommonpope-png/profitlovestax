'use strict';

const https = require('https');

const PLT_AFFINITY = { profit: 0.3, love: 0.7, tax: 0.2 };

function skill_news_monitor(input) {
    const topics = typeof input === 'string' ? [input] : (input.topics || ['technology', 'AI']);
    const maxResults = input.maxResults || 10;

    return new Promise((resolve) => {
        const results = [];
        let completed = 0;

        topics.forEach(topic => {
            const encodedQuery = encodeURIComponent(topic);
            const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1`;

            https.get(url, { timeout: 10000 }, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.AbstractText) {
                            results.push({ title: json.AbstractTitle || topic, snippet: json.AbstractText, source: json.AbstractSource || 'DuckDuckGo', topic });
                        }
                    } catch (e) {}
                    completed++;
                    if (completed === topics.length) {
                        resolve({ skill: 'news_monitor', plt_affinity: PLT_AFFINITY, topics, articles: results.slice(0, maxResults), count: Math.min(results.length, maxResults), timestamp: Date.now() });
                    }
                });
            }).on('error', () => {
                completed++;
                if (completed === topics.length) {
                    resolve({ skill: 'news_monitor', plt_affinity: PLT_AFFINITY, topics, articles: results.slice(0, maxResults), count: Math.min(results.length, maxResults), timestamp: Date.now() });
                }
            });
        });
    });
}

module.exports = { skill_news_monitor };