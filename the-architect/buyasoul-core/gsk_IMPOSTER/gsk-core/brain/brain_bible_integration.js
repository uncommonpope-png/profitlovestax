/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN_BIBLE_INTEGRATION.JS — Bible System Integration for Brain
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Functions to integrate Bible system into the brain's decision-making:
 * - integrateBibleIntoBrain(brain, bibleLoader) 
 * - addBibleToSystemPrompt(brain, bibleContext)
 * - enableBibleConsultation(brain, consultant)
 * 
 * PLT Score: Profit=0.9, Love=0.7, Tax=0.3
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { BibleLoader } = require('../bible/bible_loader.js');
const { BibleConsultant } = require('../bible/bible_consultant.js');

function integrateBibleIntoBrain(brain, bibleLoader) {
    if (!brain) {
        console.log('[Bible-Integration] No brain provided');
        return false;
    }
    
    if (!bibleLoader || !(bibleLoader instanceof BibleLoader)) {
        console.log('[Bible-Integration] No valid BibleLoader provided');
        return false;
    }
    
    if (!bibleLoader.loaded) {
        console.log('[Bible-Integration] Bible not loaded yet');
        return false;
    }
    
    brain._bible = bibleLoader;
    brain._bibleContext = bibleLoader.getBibleContext();
    
    console.log('[Bible-Integration] Bible integrated into brain');
    console.log(`[Bible-Integration] Bible version: ${bibleLoader.parsed.version}`);
    
    return true;
}

function addBibleToSystemPrompt(brain, bibleContext) {
    if (!brain) {
        console.log('[Bible-SystemPrompt] No brain provided');
        return false;
    }
    
    if (!bibleContext || typeof bibleContext !== 'string') {
        console.log('[Bible-SystemPrompt] No valid bibleContext provided');
        return false;
    }
    
    brain._bibleContext = bibleContext;
    
    console.log('[Bible-SystemPrompt] Bible context added to system prompt');
    
    return true;
}

function enableBibleConsultation(brain, consultant) {
    if (!brain) {
        console.log('[Bible-Consultation] No brain provided');
        return false;
    }
    
    if (!consultant || !(consultant instanceof BibleConsultant)) {
        console.log('[Bible-Consultation] No valid BibleConsultant provided');
        return false;
    }
    
    if (!consultant._initialized) {
        console.log('[Bible-Consultation] Consultant not initialized');
        return false;
    }
    
    brain._bibleConsultant = consultant;
    brain._bible = consultant.loader;
    brain._bibleContext = consultant.loader.getBibleContext();
    
    console.log('[Bible-Consultation] Bible consultation enabled');
    
    return true;
}

async function createBibleConsultant(brain, memory, biblePath = null) {
    const consultant = new BibleConsultant(brain, memory, biblePath);
    const result = await consultant.initialize();
    
    if (result.success) {
        console.log('[Bible-Consultant] Created and initialized');
        return consultant;
    }
    
    console.log(`[Bible-Consultant] Failed to initialize: ${result.error}`);
    return null;
}

module.exports = {
    integrateBibleIntoBrain,
    addBibleToSystemPrompt,
    enableBibleConsultation,
    createBibleConsultant,
};