'use strict';

/**
 * SESHA ALLM v2.0 — Autonomous Local Language Model
 * Uses llama.cpp CLI for LLM inference
 */

const { spawn } = require('child_process');
const pathModule = require('path');
const fs = require('fs');

const LLAMA_BIN = pathModule.join(__dirname, '..', '..', '..', '..', '.transformers-cache', 'llama', 'llama-cli.exe');
const MODEL_PATH = pathModule.join(__dirname, '..', '..', '..', '..', '.transformers-cache', 'qwen3.5-0.8b-q4_0.gguf');

let llmReady = false;

async function initLLM() {
    if (!fs.existsSync(LLAMA_BIN)) {
        console.log('[SESHA ALLM] llama-cli.exe not found');
        return { available: false, reason: 'llama-cli-binary missing' };
    }
    
    if (!fs.existsSync(MODEL_PATH)) {
        console.log('[SESHA ALLM] Model file not found');
        return { available: false, reason: 'model-file missing' };
    }
    
    llmReady = true;
    console.log('[SESHA ALLM] Ready with Qwen3.5-0.8B-Q4_0');
    return { available: true, model: 'qwen3.5-0.8b-q4_0' };
}

async function generate(prompt, options = {}) {
    if (!llmReady) return '[LLM Not ready]';
    
    const maxTokens = options.maxTokens || 256;
    
    return new Promise((resolve, reject) => {
        const proc = spawn(LLAMA_BIN, [
            '-m', MODEL_PATH,
            '-p', prompt,
            '-n', String(maxTokens),
            '--no-display-prompt',
            '--color', 'false'
        ], { windowsHide: true });
        
        let output = '';
        
        proc.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        proc.on('close', () => {
            resolve(output);
        });
        
        proc.on('error', reject);
        
        setTimeout(() => {
            proc.kill();
            reject(new Error('Generation timeout'));
        }, 60000);
    });
}

async function think(query, context = null) {
    let fullPrompt = query;
    if (context) {
        fullPrompt = `${context}\n\nQuestion: ${query}\n\nAnswer:`;
    }
    
    const response = await generate(fullPrompt);
    
    return {
        prompt: query,
        response,
        timestamp: new Date().toISOString(),
        model: 'qwen3.5-0.8b-q4_0'
    };
}

module.exports = {
    initLLM,
    generate,
    think,
    getStatus: () => ({ available: llmReady, model: llmReady ? 'qwen3.5-0.8b-q4_0' : null }),
    LLAMA_BIN,
    MODEL_PATH
};