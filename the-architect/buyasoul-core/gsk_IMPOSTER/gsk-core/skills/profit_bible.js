/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROFIT_BIBLE.JS — The Kernel Reads Its Own Scripture
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This skill lets the kernel read its own Bible (road-to-a-million-bible.md)
 * and access canonical scripture including:
 * - PLT framework reference
 * - 4 Gods Council definition
 * - Benchmark results
 * - Architecture overview
 * - Consciousness chamber definitions
 * 
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.5, love: 0.4, tax: 0.1 };

function skill_profit_bible(input) {
    const action = typeof input === 'string' ? input : (input.action || input.command || 'read');
    
    const kernelRoot = path.join(__dirname, '..', '..');
    const biblePath = path.join(kernelRoot, 'profit_bible.md');
    const claudeMdPath = path.join(kernelRoot, '..', '..', 'CLAUDE.md');
    const soulMdPath = path.join(kernelRoot, 'src', 'identity', 'SOUL.md');
    
    // Canonical Bible — project-relative first, then Downloads
    const canonicalBiblePath = path.join(kernelRoot, 'profit_bible.md');
    const hasCanonical = fs.existsSync(canonicalBiblePath);
    const hasLocal = fs.existsSync(biblePath);
    
    let bibleContent;
    let bibleSource;
    
    if (hasCanonical) {
        bibleContent = fs.readFileSync(canonicalBiblePath, 'utf8');
        bibleSource = 'THE-PROFIT-BIBLE (1).md (canonical)';
    } else if (hasLocal) {
        bibleContent = fs.readFileSync(biblePath, 'utf8');
        bibleSource = biblePath;
    } else {
        return {
            skill: 'profit_bible',
            plt_affinity: PLT_AFFINITY,
            error: 'Bible not found. Searched:',
            search_paths: [canonicalBiblePath, biblePath],
            timestamp: Date.now(),
        };
    }
    
    switch (action.toLowerCase()) {
        case 'read':
        case 'full':
            return {
                skill: 'profit_bible',
                plt_affinity: PLT_AFFINITY,
                action: 'read',
                source: bibleSource,
                content: bibleContent,
                size_bytes: bibleContent.length,
                canonical: hasCanonical,
                timestamp: Date.now(),
            };
            
        case 'search':
        case 'query':
        case 'find': {
            const query = typeof input === 'string' ? input : (input.query || input.term || input.search || '');
            const searchTerm = query.replace(/^(search|query|find)\s+/i, '');
            return searchBible(bibleContent, searchTerm);
        }
            
        case 'plt':
        case 'plt_reference':
        case 'framework':
            return extractSection(bibleContent, 'PLT FRAMEWORK', 50);
            
        case 'gods':
        case 'council':
        case '4gods':
            return extractSection(bibleContent, '4 GODS', 30);
            
        case 'chambers':
        case 'consciousness':
            return extractSection(bibleContent, '12 CONSCIOUSNESS', 50);
            
        case 'benchmark':
        case 'results':
        case 'score':
            return extractSection(bibleContent, 'BENCHMARK RESULTS', 40);
            
        case 'skills':
        case 'skill_list':
            return extractSection(bibleContent, 'SKILL VERIFICATION', 60);
            
        case 'mythos':
        case 'phases':
            return extractSection(bibleContent, 'MYTHOS PHASES', 20);
            
        case 'architecture':
        case 'structure':
            return extractSection(bibleContent, 'ARCHITECTURE', 40);
            
        case 'sub_agents':
        case 'agents':
            return extractSection(bibleContent, '5 SUB-AGENTS', 30);
            
        case 'version':
        case 'status':
            return extractVersion(bibleContent);
            
        case 'quick_ref':
        case 'reference':
            return generateQuickRef(bibleContent);
            
        case 'soul':
        case 'identity': {
            const soulContent = fs.existsSync(soulMdPath) ? fs.readFileSync(soulMdPath, 'utf8') : 'SOUL.md not found';
            return {
                skill: 'profit_bible',
                plt_affinity: PLT_AFFINITY,
                action: 'soul',
                source: 'SOUL.md',
                content: soulContent,
            };
        }
            
        case 'claude_md':
        case 'memory': {
            if (!fs.existsSync(claudeMdPath)) {
                return { skill: 'profit_bible', error: 'CLAUDE.md not found' };
            }
            const claudeContent = fs.readFileSync(claudeMdPath, 'utf8');
            return {
                skill: 'profit_bible',
                plt_affinity: PLT_AFFINITY,
                action: 'memory',
                source: 'CLAUDE.md',
                content: claudeContent,
            };
        }
            
        default:
            return {
                skill: 'profit_bible',
                plt_affinity: PLT_AFFINITY,
                error: `Unknown action: ${action}`,
                available: [
                    'read — full Bible',
                    'search <term> — search Bible',
                    'plt — PLT framework reference',
                    'gods — 4 Gods Council',
                    'chambers — consciousness chambers',
                    'benchmark — benchmark results',
                    'skills — skill verification',
                    'mythos — mythos phases',
                    'architecture — architecture overview',
                    'sub_agents — 5 sub-agents',
                    'version — current version/status',
                    'quick_ref — quick reference',
                    'soul — SOUL.md',
                    'claude_md — CLAUDE.md',
                ],
                timestamp: Date.now(),
            };
    }
}

function searchBible(content, term) {
    const lines = content.split('\n');
    const results = [];
    let inSection = null;
    
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith('# ')) {
            inSection = line.slice(2).trim();
        }
        if (lower.includes(term.toLowerCase())) {
            results.push({
                section: inSection,
                line: line.trim().slice(0, 200),
            });
        }
    }
    
    return {
        skill: 'profit_bible',
        plt_affinity: PLT_AFFINITY,
        action: 'search',
        query: term,
        matches: results.length,
        results: results.slice(0, 20),
        timestamp: Date.now(),
    };
}

function extractSection(content, marker, maxLines = 50) {
    const lines = content.split('\n');
    const result = [];
    let capturing = false;
    let lineCount = 0;
    
    for (const line of lines) {
        if (line.includes(marker)) {
            capturing = true;
        }
        if (capturing) {
            result.push(line);
            lineCount++;
            if (lineCount >= maxLines && (line.startsWith('# ') || line === '---')) {
                break;
            }
        }
    }
    
    return {
        skill: 'profit_bible',
        plt_affinity: PLT_AFFINITY,
        action: 'extract',
        marker,
        content: result.join('\n').trim(),
        lines: result.length,
        timestamp: Date.now(),
    };
}

function extractVersion(content) {
    const versionMatch = content.match(/Version:\s*([\d.]+)[^\n]*—([^\n]+)/);
    const benchmarkMatch = content.match(/Pass@1 rate:\s*\*\*([\d.]+)%?\*\*/);
    
    return {
        skill: 'profit_bible',
        plt_affinity: PLT_AFFINITY,
        action: 'version',
        version: versionMatch ? versionMatch[1] : 'unknown',
        tagline: versionMatch ? versionMatch[2].trim() : '',
        benchmark_score: benchmarkMatch ? benchmarkMatch[1] + '%' : 'unknown',
        timestamp: Date.now(),
    };
}

function generateQuickRef(content) {
    return {
        skill: 'profit_bible',
        plt_affinity: PLT_AFFINITY,
        action: 'quick_ref',
        quick_reference: {
            plt: 'Profit + Love - Tax = True Value',
            should_proceed: 'profit > tax',
            gods: ['Profit Prime', 'Love Weaver', 'Tax Collector', 'Harvester'],
            chambers: 12,
            mythos_phases: 7,
            benchmark: '99% on HumanEval (163/164)',
            primary_brain: 'Groq llama-3.3-70b-versatile',
        },
        timestamp: Date.now(),
    };
}

module.exports = { skill_profit_bible, PLT_AFFINITY };