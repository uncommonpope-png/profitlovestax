'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { AutonomousLearning } = require('../brain/autonomous_learning.js');
const { SkillCreator } = require('../skills/skill_creator.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-p3-p4-'));
    const memoryDir = path.join(root, 'memory');
    const seshatDir = path.join(root, 'seshat', 'pages');
    const skillsDir = path.join(root, 'skills');
    const hubDir = path.join(root, 'hub');
    fs.mkdirSync(path.join(hubDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(hubDir, 'downloads'), { recursive: true });
    fs.writeFileSync(path.join(hubDir, 'data', 'catalog.json'), '[]\n', 'utf8');

    const witnessed = [];
    const memory = {
        dataDir: memoryDir,
        witness: async entry => witnessed.push(entry)
    };
    const learning = new AutonomousLearning(null, memory, {}, {
        seshatPagesDir: seshatDir,
        searchProvider: async topic => [
            { title: 'Primary source', url: 'https://example.com/primary', snippet: `${topic} primary evidence` },
            { title: 'Second source', url: 'https://example.org/second', snippet: `${topic} independent evidence` }
        ],
        fetchProvider: async url => ({ ok: true, statusCode: 200, text: `Verified content fetched from ${url}` })
    });

    const research = await learning.learnFromWeb('persistent agent memory');
    assert(research.status === 'success' && research.verifiedSources === 2, 'P3 verifies fetched web sources');
    assert(learning.learnedTopics.has('persistent agent memory'), 'P3 records learnedTopics entry');
    assert(fs.existsSync(research.seshatNote), 'P3 writes a Seshat Soul Note');
    const note = fs.readFileSync(research.seshatNote, 'utf8');
    assert(note.includes('verified: true') && note.includes('https://example.com/primary'), 'P3 Soul Note contains verification and citations');
    assert(witnessed.some(entry => entry.meta?.seshatNote === research.seshatNote), 'P3 research result is witnessed with note provenance');

    const creator = new SkillCreator({}, { skillsDir, hubDir });
    const created = creator.create('memory_probe', { description: 'Inspect persistent memory with provenance' });
    assert(created.success && fs.existsSync(created.filepath), 'P4 creates a parseable skill file');
    assert(created.hub.published && fs.existsSync(created.hub.downloadPath), 'P4 copies the Soul Gun into Hub downloads');
    const catalog = JSON.parse(fs.readFileSync(path.join(hubDir, 'data', 'catalog.json'), 'utf8'));
    assert(catalog.some(item => item.file === 'soul-gun-memory_probe.js' && item.forgedBy === 'GSK'), 'P4 adds a GSK-forged Hub listing');
    assert(creator.list().includes('memory_probe'), 'P4 refreshable skill inventory sees the graft');

    fs.rmSync(root, { recursive: true, force: true });
    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
