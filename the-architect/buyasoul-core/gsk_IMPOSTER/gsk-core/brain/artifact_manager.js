'use strict';

const fs = require('fs');
const path = require('path');

class ArtifactManager {
    constructor(dataDir) {
        this.artifactDir = path.join(dataDir, 'artifacts');
        this.artifacts = [];
        this.maxArtifacts = 100;

        if (!fs.existsSync(this.artifactDir)) {
            fs.mkdirSync(this.artifactDir, { recursive: true });
        }

        this._loadIndex();
    }

    _indexPath() {
        return path.join(this.artifactDir, 'index.json');
    }

    _loadIndex() {
        try {
            if (fs.existsSync(this._indexPath())) {
                const data = fs.readFileSync(this._indexPath(), 'utf8');
                this.artifacts = JSON.parse(data);
            }
        } catch (e) {
            this.artifacts = [];
        }
    }

    _saveIndex() {
        try {
            fs.writeFileSync(this._indexPath(), JSON.stringify(this.artifacts, null, 2));
        } catch (e) {
            // non-fatal
        }
    }

    async addArtifact(skillName, input, result, options = {}) {
        const timestamp = Date.now();
        const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const type = options.type || skillName;
        const title = options.title || `${skillName}_${dateStr}`;

        const content = typeof result === 'string' ? result :
            result.response || result.code || result.findings || result.reflection || result.summary ||
            JSON.stringify(result, null, 2);

        const filename = `${dateStr}-${skillName}-${title.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
        const filepath = path.join(this.artifactDir, filename);

        try {
            const header = `╔════════════════════════════════════════════════════════════╗
║ ARTIFACT: ${(skillName + '                    ').slice(0, 48)}║
║ TIMESTAMP: ${dateStr}                     ║
║ TYPE: ${(type + '                          ').slice(0, 48)}║
╚════════════════════════════════════════════════════════════╝

`;
            fs.writeFileSync(filepath, header + content);

            const artifact = {
                id: `art_${this.artifacts.length + 1}`,
                skill: skillName,
                type: type,
                title: title,
                filename: filename,
                filepath: filepath,
                timestamp: timestamp,
                size: content.length,
                preview: content.slice(0, 120).replace(/\n/g, ' '),
            };

            this.artifacts.push(artifact);
            if (this.artifacts.length > this.maxArtifacts) {
                const removed = this.artifacts.shift();
                try {
                    if (fs.existsSync(removed.filepath)) fs.unlinkSync(removed.filepath);
                } catch (e) {}
            }

            this._saveIndex();

            return artifact;
        } catch (e) {
            return { error: e.message };
        }
    }

    getRecent(count = 5) {
        return this.artifacts.slice(-count).reverse();
    }

    getStats() {
        const bySkill = {};
        for (const a of this.artifacts) {
            bySkill[a.skill] = (bySkill[a.skill] || 0) + 1;
        }
        return {
            total: this.artifacts.length,
            by_skill: bySkill,
            latest: this.artifacts.length > 0 ? this.artifacts[this.artifacts.length - 1] : null,
        };
    }

    getLatest() {
        return this.artifacts.length > 0 ? this.artifacts[this.artifacts.length - 1] : null;
    }

    listAll() {
        return [...this.artifacts];
    }
}

module.exports = { ArtifactManager };
