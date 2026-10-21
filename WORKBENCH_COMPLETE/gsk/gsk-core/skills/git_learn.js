'use strict';

const PLT_AFFINITY = { profit: 0.8, love: 0.5, tax: 0.2 };

async function skill_git_learn(input) {
    const repoUrl = input.repoUrl || 'https://github.com/TailAdmin/free-react-tailwind-admin-dashboard';
    const branch = input.branch || 'main';

    const kernel = global.__gskSecureSandbox ? global.__gskSecureSandbox.kernel : null;
    if (!kernel) {
        throw new Error('GSK Kernel context not found in global sandbox');
    }

    const learning = kernel.agents.autonomousLearning;
    if (!learning) {
        throw new Error('AutonomousLearning system not active in GSK');
    }

    console.log(`[GitLearnSkill] Instructing GSK to ingest and learn from: ${repoUrl} (${branch})`);
    
    // Call the core git learning method
    const result = await learning.learnFromGit(repoUrl, branch);
    
    // Log details back to Logseq Autonomy Journal!
    const writer = kernel.systems.journalWriter;
    if (writer) {
        try {
            writer.write(
                `GSK Studied Github Repository: ${repoUrl.split('/').pop()}`,
                `GSK has cloned and studied the repository: ${repoUrl} on branch ${branch}.
In-depth static analysis was run, and files containing core layout structures, chart components, dashboard states, and Tailwind modules were ingested.
GSK has added these entries to the knowledge base to draft a custom front-end dashboard for himself.`,
                'learning'
            );
        } catch (e) {
            console.log(`[GitLearnSkill] Failed to write journal log: ${e.message}`);
        }
    }

    return {
        success: result.status === 'success',
        repo: repoUrl,
        files_learned: result.files_learned || 0,
        files: result.files || [],
        error: result.error
    };
}

module.exports = { skill_git_learn, PLT_AFFINITY };
