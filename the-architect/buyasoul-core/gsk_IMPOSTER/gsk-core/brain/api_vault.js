'use strict';

const fs = require('fs');
const path = require('path');

const KEY_PATTERNS = [
    { pattern: /^sk-(proj-)?[A-Za-z0-9]{20,}/, service: 'OPENAI', env: 'OPENAI_API_KEY', label: 'OpenAI API' },
    { pattern: /^sk-[A-Za-z0-9]{32,}/, service: 'OPENAI', env: 'OPENAI_API_KEY', label: 'OpenAI API' },
    { pattern: /^ghp_[A-Za-z0-9]{36,}/, service: 'GITHUB', env: 'GITHUB_TOKEN', label: 'GitHub Personal Access' },
    { pattern: /^gho_[A-Za-z0-9]{36,}/, service: 'GITHUB', env: 'GITHUB_TOKEN', label: 'GitHub OAuth' },
    { pattern: /^github_pat_[A-Za-z0-9]{50,}/, service: 'GITHUB', env: 'GITHUB_TOKEN', label: 'GitHub Fine-Grained PAT' },
    { pattern: /^xoxb-[A-Za-z0-9-]{20,}/, service: 'SLACK', env: 'SLACK_BOT_TOKEN', label: 'Slack Bot' },
    { pattern: /^xoxp-[A-Za-z0-9-]{20,}/, service: 'SLACK', env: 'SLACK_TOKEN', label: 'Slack User' },
    { pattern: /^bot[A-Za-z0-9_-]{20,}/, service: 'DISCORD', env: 'DISCORD_BOT_TOKEN', label: 'Discord Bot' },
    { pattern: /^[A-Za-z0-9-_]{24}\.[A-Za-z0-9-_]{6}\.[A-Za-z0-9-_]{27,}/, service: 'DISCORD', env: 'DISCORD_BOT_TOKEN', label: 'Discord Bot (JWT)' },
    { pattern: /^[A-Za-z0-9_-]{23}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{38}/, service: 'DISCORD', env: 'DISCORD_BOT_TOKEN', label: 'Discord Bot' },
    { pattern: /^gsk_[A-Za-z0-9]{20,}/, service: 'GROQ', env: 'GROQ_API_KEY', label: 'Groq Cloud' },
    { pattern: /^sk-[A-Za-z0-9]{20,}/, service: 'ANTHROPIC', env: 'ANTHROPIC_API_KEY', label: 'Anthropic Claude' },
    { pattern: /^r8_[A-Za-z0-9]{30,}/, service: 'REPLICATE', env: 'REPLICATE_API_TOKEN', label: 'Replicate' },
    { pattern: /^AC[A-Za-z0-9]{32}/, service: 'TWILIO', env: 'TWILIO_ACCOUNT_SID', label: 'Twilio Account SID' },
    { pattern: /^SG\.[A-Za-z0-9_-]{66}/, service: 'SENDGRID', env: 'SENDGRID_API_KEY', label: 'SendGrid' },
    { pattern: /^AIza[A-Za-z0-9_-]{30,}/, service: 'GEMINI', env: 'GEMINI_API_KEY', label: 'Google Gemini' },
    { pattern: /^[A-Za-z0-9]{32,44}$/, service: 'STABILITY', env: 'STABILITY_API_KEY', label: 'Stability AI' },
    { pattern: /^ntzn_[A-Za-z0-9]{20,}/, service: 'NOTION', env: 'NOTION_API_KEY', label: 'Notion Integration' },
    { pattern: /^secret_[A-Za-z0-9]{40,}/, service: 'STRIPE', env: 'STRIPE_SECRET_KEY', label: 'Stripe Secret' },
    { pattern: /^pk_[A-Za-z0-9]{30,}/, service: 'STRIPE', env: 'STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable' },
    { pattern: /^ghr_[A-Za-z0-9]{40,}/, service: 'GITHUB', env: 'GITHUB_TOKEN', label: 'GitHub Ref token' },
    { pattern: /^pat_[A-Za-z0-9]{20,}/, service: 'GITLAB', env: 'GITLAB_TOKEN', label: 'GitLab PAT' },
    { pattern: /^glpat-[A-Za-z0-9_-]{20,}/, service: 'GITLAB', env: 'GITLAB_TOKEN', label: 'GitLab PAT' },
    { pattern: /^[A-Za-z0-9]{32}\.app\.n8n-cloud\.[A-Za-z0-9]+/, service: 'N8N', env: 'N8N_API_KEY', label: 'n8n Cloud' },
    { pattern: /^sess-[A-Za-z0-9]{40,}/, service: 'HUGGINGFACE', env: 'HUGGINGFACE_TOKEN', label: 'HuggingFace' },
    { pattern: /^hf_[A-Za-z0-9]{30,}/, service: 'HUGGINGFACE', env: 'HUGGINGFACE_TOKEN', label: 'HuggingFace' },
    { pattern: /^key-[A-Za-z0-9]{20,}/, service: 'OPENROUTER', env: 'OPENROUTER_API_KEY', label: 'OpenRouter' },
    { pattern: /^api-[A-Za-z0-9]{20,}/, service: 'OPENROUTER', env: 'OPENROUTER_API_KEY', label: 'OpenRouter' },
    { pattern: /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/, service: 'JWT', env: 'JWT_TOKEN', label: 'Generic JWT' },
    { pattern: /^[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}/, service: 'LICENSE_KEY', env: null, label: 'License Key' },
];

const MANUAL_KEYS = {
    GROQ_API_KEY: 'GROQ',
    OPENAI_API_KEY: 'OPENAI',
    ANTHROPIC_API_KEY: 'ANTHROPIC',
    GEMINI_API_KEY: 'GEMINI',
    GITHUB_TOKEN: 'GITHUB',
    SLACK_BOT_TOKEN: 'SLACK',
    SLACK_TOKEN: 'SLACK',
    DISCORD_BOT_TOKEN: 'DISCORD',
    NOTION_API_KEY: 'NOTION',
    REPLICATE_API_TOKEN: 'REPLICATE',
    STABILITY_API_KEY: 'STABILITY',
    SPOTIFY_CLIENT_ID: 'SPOTIFY',
    SPOTIFY_CLIENT_SECRET: 'SPOTIFY',
    TRELLO_API_KEY: 'TRELLO',
    TRELLO_TOKEN: 'TRELLO',
    GOOGLE_API_KEY: 'GOOGLE',
    GOOGLE_CLIENT_ID: 'GOOGLE',
    GOOGLE_CLIENT_SECRET: 'GOOGLE',
    OPENWEATHER_API_KEY: 'OPENWEATHER',
    NEWSAPI_KEY: 'NEWSAPI',
    TWILIO_ACCOUNT_SID: 'TWILIO',
    TWILIO_AUTH_TOKEN: 'TWILIO',
    SENDGRID_API_KEY: 'SENDGRID',
    STRIPE_SECRET_KEY: 'STRIPE',
    HUGGINGFACE_TOKEN: 'HUGGINGFACE',
    OPENROUTER_API_KEY: 'OPENROUTER',
    SERPAPI_KEY: 'SERPAPI',
    BRAVE_API_KEY: 'BRAVE',
};

class ApiVault {
    constructor(vaultPath) {
        this.vaultPath = vaultPath || path.join(__dirname, '..', '..', 'data', 'api_vault.json');
        this.keys = {};
        this.autoLabeled = {};
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.vaultPath)) {
                const raw = fs.readFileSync(this.vaultPath, 'utf8');
                const data = JSON.parse(raw);
                this.keys = data.keys || {};
                this.autoLabeled = data.autoLabeled || {};
            }
        } catch (e) {
            console.error('[ApiVault] Load error:', e.message);
            this.keys = {};
            this.autoLabeled = {};
        }
    }

    save() {
        try {
            const dir = path.dirname(this.vaultPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.vaultPath, JSON.stringify({ keys: this.keys, autoLabeled: this.autoLabeled }, null, 2));
        } catch (e) {
            console.error('[ApiVault] Save error:', e.message);
        }
    }

    autoDetect(keyValue) {
        if (!keyValue || typeof keyValue !== 'string') return null;
        const trimmed = keyValue.trim();
        for (const entry of KEY_PATTERNS) {
            if (entry.pattern.test(trimmed)) {
                return { service: entry.service, env: entry.env, label: entry.label };
            }
        }
        return null;
    }

    addKey(nameOrValue, value) {
        if (value === undefined) {
            const detected = this.autoDetect(nameOrValue);
            if (detected) {
                this.keys[detected.service] = nameOrValue.trim();
                this.autoLabeled[detected.service] = detected.label;
                this.save();
                return { success: true, service: detected.service, label: detected.label, autoDetected: true };
            }
            return { success: false, error: 'Could not auto-detect service for this key. Use: vault.addKey("SERVICE_NAME", "key_value")' };
        }
        const service = nameOrValue.toUpperCase();
        this.keys[service] = value.trim();
        const detected = this.autoDetect(value);
        if (detected) this.autoLabeled[service] = detected.label;
        else this.autoLabeled[service] = 'Manually added';
        this.save();
        return { success: true, service, autoDetected: !!detected };
    }

    addKeys(rawText) {
        const results = [];
        const lines = rawText.split('\n').filter(l => l.trim());
        for (const line of lines) {
            if (line.includes('=')) {
                const eqIdx = line.indexOf('=');
                const k = line.substring(0, eqIdx).trim();
                const v = line.substring(eqIdx + 1).trim();
                if (k && v) {
                    const detected = this.autoDetect(v);
                    if (detected) {
                        this.keys[detected.service] = v;
                        this.autoLabeled[detected.service] = detected.label;
                        results.push({ key: detected.service, label: detected.label, source: k });
                    } else {
                        this.keys[k.toUpperCase()] = v;
                        this.autoLabeled[k.toUpperCase()] = `From env: ${k}`;
                        results.push({ key: k.toUpperCase(), label: k, source: k });
                    }
                }
            }
        }
        this.save();
        return results;
    }

    getKey(service) {
        const svc = service.toUpperCase();
        if (this.keys[svc]) return this.keys[svc];
        const envVar = MANUAL_KEYS[svc];
        if (envVar && process.env[svc]) {
            this.keys[svc] = process.env[svc];
            this.save();
            return this.keys[svc];
        }
        if (process.env[svc]) {
            this.keys[svc] = process.env[svc];
            this.save();
            return this.keys[svc];
        }
        return null;
    }

    skillRequirements(skillName) {
        const map = {
            openai: ['OPENAI_API_KEY'],
            github: ['GITHUB_TOKEN'],
            'gh-issues': ['GITHUB_TOKEN'],
            discord: ['DISCORD_BOT_TOKEN'],
            spotify: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'],
            'spotify-player': ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'],
            notion: ['NOTION_API_KEY'],
            trello: ['TRELLO_API_KEY', 'TRELLO_TOKEN'],
            google_workspace: ['GOOGLE_API_KEY', 'GOOGLE_CLIENT_ID'],
            gemini: ['GEMINI_API_KEY'],
            openai_image_gen: ['OPENAI_API_KEY'],
            openai_whisper: ['OPENAI_API_KEY'],
            openhue: ['PHILIPS_HUE_IP', 'PHILIPS_HUE_USER'],
            replication: ['REPLICATE_API_TOKEN'],
            stability: ['STABILITY_API_KEY'],
            weather: ['OPENWEATHER_API_KEY'],
            sendgrid: ['SENDGRID_API_KEY'],
            stripe: ['STRIPE_SECRET_KEY'],
            serpapi: ['SERPAPI_KEY'],
            brave_search: ['BRAVE_API_KEY'],
            groq: ['GROQ_API_KEY'],
            anthropic: ['ANTHROPIC_API_KEY'],
            google: ['GOOGLE_API_KEY'],
            newsapi: ['NEWSAPI_KEY'],
        };
        return map[skillName] || [];
    }

    canSkillWork(skillName) {
        const required = this.skillRequirements(skillName);
        if (required.length === 0) return { canWork: true, reason: 'No API keys required' };
        const missing = required.filter(r => !this.getKey(r));
        if (missing.length === 0) return { canWork: true, reason: 'All keys available' };
        return { canWork: false, missing, reason: `Missing: ${missing.join(', ')}` };
    }

    getStatus() {
        const services = Object.keys(this.keys).sort();
        return {
            totalKeys: services.length,
            services: services.map(s => ({
                service: s,
                label: this.autoLabeled[s] || 'Unknown',
                keyPreview: this.keys[s] ? this.keys[s].substring(0, 8) + '...' : null,
                loaded: !!this.keys[s],
            })),
        };
    }

    removeKey(service) {
        const svc = service.toUpperCase();
        delete this.keys[svc];
        delete this.autoLabeled[svc];
        this.save();
        return { success: true, service: svc };
    }

    clearAll() {
        this.keys = {};
        this.autoLabeled = {};
        this.save();
        return { success: true, message: 'All keys removed' };
    }
}

const defaultVault = new ApiVault();

module.exports = { ApiVault, vault: defaultVault };
