/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BIBLE/INDEX.JS — THE BIBLE SYSTEM EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Unified export for the Bible integration system:
 * - BibleLoader: Parse and extract Bible structures
 * - BibleConsultant: Active Bible consultation for decisions
 * 
 * PLT Score: Profit=0.8, Love=0.6, Tax=0.2
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { BibleLoader } = require('./bible_loader.js');
const { BibleConsultant } = require('./bible_consultant.js');

module.exports = {
    BibleLoader,
    BibleConsultant,
    
    createBibleLoader: (biblePath) => new BibleLoader(biblePath),
    createBibleConsultant: (brain, memory, biblePath) => new BibleConsultant(brain, memory, biblePath),
};

module.exports.BIBLE_SYSTEM = {
    name: 'The Bible Integration System',
    version: '1.0.0',
    purpose: 'Parse and consult THE-PROFIT-BIBLE for decision guidance',
    components: ['BibleLoader', 'BibleConsultant'],
    PLT: { profit: 0.8, love: 0.6, tax: 0.2 },
};