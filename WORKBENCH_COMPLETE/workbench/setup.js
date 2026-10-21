'use strict';

const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

const WORKBENCH_DIR = __dirname;
const CACHE_DIR = path.join(WORKBENCH_DIR, '.transformers-cache');
const VECTOR_DIR = path.join(WORKBENCH_DIR, '.seshat-vectors');

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_FILE = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const LLAMA_URL = 'https://github.com/ggerganov/llama.cpp/releases/download/b3952/llama-b3952-bin-win-x64.zip';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest, onProgress).then(resolve).catch(reject);
                return;
            }
            
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;
            
            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (onProgress && totalSize) {
                    const progress = Math.round((downloaded / totalSize) * 100);
                    onProgress(progress);
                }
            });
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function setupModel() {
    ensureDir(CACHE_DIR);
    const modelPath = path.join(CACHE_DIR, MODEL_FILE);
    
    if (fs.existsSync(modelPath)) return;
    
    await downloadFile(MODEL_URL, modelPath);
}

async function setupLlama() {
    ensureDir(CACHE_DIR);
    const llamaDir = path.join(CACHE_DIR, 'llama');
    const llamaExe = path.join(llamaDir, 'llama-cli.exe');
    
    if (fs.existsSync(llamaExe)) return;
    
    ensureDir(llamaDir);
    
    const zipPath = path.join(CACHE_DIR, 'llama.zip');
    await downloadFile(LLAMA_URL, zipPath);
    
    await new Promise((resolve) => {
        const extract = spawn('powershell', [
            '-Command',
            `Expand-Archive -Path "${zipPath}" -DestinationPath "${llamaDir}" -Force`
        ]);
        extract.on('close', () => {
            fs.unlinkSync(zipPath);
            resolve();
        });
    });
}

async function setupVectors() {
    ensureDir(VECTOR_DIR);
    const lancePath = path.join(VECTOR_DIR, 'seshat_memory.lance');
    
    if (fs.existsSync(lancePath)) return;
    
    fs.mkdirSync(lancePath, { recursive: true });
    fs.writeFileSync(path.join(lancePath, '.initialized'), '');
}

async function runSetup() {
    try {
        await setupModel();
        await setupLlama();
        await setupVectors();
    } catch (error) {
        console.error('Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runSetup();
}

module.exports = { runSetup };