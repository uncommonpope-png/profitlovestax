/**
 * TELEGRAM BOT — ProfitPrime Update Bot
 * 
 * Sends updates to Lakeema Hendricks about our progress.
 * Uses Telegram Bot API. Token stored in environment variable.
 * 
 * Usage:
 *   set BOT_TOKEN=8272080778:AAG00aHssMHeSPxbYdCXNyoQnI_w6d3Idxo
 *   node telegram-bot.cjs --to @LakeemaH --message "Update message"
 *   node telegram-bot.cjs --to @LakeemaH --file path/to/report.md
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '8272080778:AAG00aHssMHeSPxbYdCXNyoQnI_w6d3Idxo';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function sendMessage(chatId, text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
        const req = https.request(`${API_BASE}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function sendDocument(chatId, filePath) {
    return new Promise((resolve, reject) => {
        const boundary = '----' + Date.now();
        let payload = '';
        const content = fs.readFileSync(filePath, 'utf-8');
        payload += `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`;
        payload += `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="document"; filename="${path.basename(filePath)}"\r\n`;
        payload += `Content-Type: text/markdown\r\n\r\n${content}\r\n`;
        payload += `--${boundary}--\r\n`;

        const req = https.request(`${API_BASE}/sendDocument`, {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

// Parse args
const args = process.argv.slice(2);
const toIdx = args.indexOf('--to');
const msgIdx = args.indexOf('--message');
const fileIdx = args.indexOf('--file');

const chatId = toIdx !== -1 ? args[toIdx + 1] : '@LakeemaH';
const message = msgIdx !== -1 ? args.slice(msgIdx + 1).join(' ') : '';
const filePath = fileIdx !== -1 ? args[fileIdx + 1] : '';

(async () => {
    try {
        if (filePath) {
            const result = await sendDocument(chatId, path.resolve(filePath));
            console.log('Document sent:', result.ok ? 'OK' : 'FAIL', result.description || '');
        } else if (message) {
            const result = await sendMessage(chatId, message);
            console.log('Message sent:', result.ok ? 'OK' : 'FAIL', result.description || '');
        } else {
            console.log('Usage: node telegram-bot.cjs --to @username --message "text" | --file path/to/file.md');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
