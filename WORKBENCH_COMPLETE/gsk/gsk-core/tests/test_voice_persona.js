'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { JournalWriter } = require('../brain/journal_writer.js');
const { PersonaKernel } = require('../brain/persona_kernel.js');
const { VoiceEngine } = require('../brain/voice_engine.js');
const { SystemPromptCompiler } = require('../brain/system_prompt_compiler.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-p10-'));
    const biblePath = path.join(root, 'THE-PROFIT-BIBLE.md');
    const statePath = path.join(root, 'persona.json');
    fs.writeFileSync(biblePath, '# THE PROFIT BIBLE\nCraig Jones is the Grand Code Pope.\nProfit + Love - Tax = True Value.\n', 'utf8');

    const firstBoot = new PersonaKernel({ biblePath, statePath });
    const secondBoot = new PersonaKernel({ biblePath, statePath });
    assert(firstBoot.getStatus().bibleFingerprint === secondBoot.getStatus().bibleFingerprint, 'P10 persona fingerprint is stable across reboot');
    assert(secondBoot.compileDirective().includes('Grand Code Pope') && secondBoot.compileDirective().includes('Profit + Love - Tax'), 'P10 persona is compiled from canonical Bible doctrine');

    const fusion = { personaKernel: secondBoot };
    const prompt = new SystemPromptCompiler({ fusion }).compile();
    assert(prompt.includes('PROFIT BIBLE LOCKED') && prompt.includes(secondBoot.getStatus().bibleFingerprint), 'P10 system prompt uses the locked persona kernel');

    const journal = new JournalWriter({ journalPath: path.join(root, 'journal.json') });
    const entry = journal.write('I remember', 'The work continues through memory and proof.', 'reflection');
    const witnessed = [];
    const voice = new VoiceEngine({ memory: { witness: async event => witnessed.push(event) } }, { outputDir: path.join(root, 'voice') });
    const spoken = await voice.speakJournalEntry(entry);
    assert(spoken.ok && fs.existsSync(spoken.outputPath) && spoken.bytes > 44, 'P10 voices a real journal entry to WAV');
    const header = fs.readFileSync(spoken.outputPath).subarray(0, 4).toString('ascii');
    assert(header === 'RIFF', 'P10 voice output is a valid WAV container');
    assert(witnessed.some(event => event.type === 'voice_output'), 'P10 voice output is witnessed');

    fs.rmSync(root, { recursive: true, force: true });
    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
