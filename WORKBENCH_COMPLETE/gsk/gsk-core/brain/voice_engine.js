'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

class VoiceEngine {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.outputDir = options.outputDir || path.join(__dirname, '..', '..', 'data', 'gsk', 'voice');
        this.synthesizer = options.synthesizer || this._windowsSynthesize.bind(this);
        this.history = [];
        fs.mkdirSync(this.outputDir, { recursive: true });
    }

    async speak(text, options = {}) {
        const content = String(text || '').trim();
        if (!content) return { ok: false, error: 'Text is required' };
        const filename = options.filename || `gsk-voice-${Date.now()}.wav`;
        const outputPath = path.resolve(this.outputDir, path.basename(filename));
        await this.synthesizer(content, outputPath, options);
        const stat = fs.statSync(outputPath);
        const result = { ok: stat.size > 44, outputPath, bytes: stat.size, text: content, voicedAt: Date.now() };
        this.history.push(result);
        if (this.history.length > 100) this.history.shift();

        const memory = this.kernel?.memory || this.kernel?.systems?.memory;
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'voice_output', weight: 0.6, tags: ['voice', 'journal'], content: `[Voice] ${content.substring(0, 200)}`, meta: { outputPath, bytes: stat.size } }).catch(() => {});
        }
        return result;
    }

    async speakJournalEntry(entry) {
        if (!entry) return { ok: false, error: 'Journal entry is required' };
        const text = `${entry.title}. ${entry.body}`;
        return this.speak(text, { filename: `journal-${entry.id || Date.now()}.wav` });
    }

    _windowsSynthesize(text, outputPath) {
        if (process.platform !== 'win32') return Promise.reject(new Error('Local voice provider currently requires Windows'));
        const textPath = path.join(os.tmpdir(), `gsk-voice-${process.pid}-${Date.now()}.txt`);
        fs.writeFileSync(textPath, text, 'utf8');
        const escape = value => String(value).replace(/'/g, "''");
        const script = [
            'Add-Type -AssemblyName System.Speech',
            '$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer',
            `$text = Get-Content -LiteralPath '${escape(textPath)}' -Raw -Encoding UTF8`,
            `$voice.SetOutputToWaveFile('${escape(outputPath)}')`,
            '$voice.Speak($text)',
            '$voice.Dispose()'
        ].join('; ');
        return new Promise((resolve, reject) => {
            execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { timeout: 30000, windowsHide: true }, error => {
                try { fs.unlinkSync(textPath); } catch {}
                if (error) reject(error);
                else resolve(outputPath);
            });
        });
    }

    getStatus() {
        return { available: process.platform === 'win32', provider: 'windows-system-speech', outputs: this.history.length, lastOutput: this.history[this.history.length - 1] || null };
    }
}

module.exports = { VoiceEngine };
