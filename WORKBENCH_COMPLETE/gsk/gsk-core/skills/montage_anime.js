'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const MANIFEST = {
    name: 'montage_anime',
    description: 'Produce anime-style AI videos via OpenMontage pipeline (script, characters, scenes, anime image gen, FFmpeg compose)',
    version: '1.0.0',
    inputs: {
        prompt: { type: 'string', required: true, description: 'Topic/story for the anime video' },
        duration: { type: 'integer', default: 60, description: 'Target video duration in seconds' },
        title: { type: 'string', description: 'Project title' },
        referenceUrl: { type: 'string', description: 'YouTube URL for style reference' },
        language: { type: 'string', default: 'english', description: 'Voiceover/subtitle language' },
        subtitleLanguage: { type: 'string', description: 'Subtitle language (separate from audio)' },
        projectName: { type: 'string', description: 'Custom project name (auto-generated if omitted)' },
    },
    output: { schema: 'video_path | status | progress' }
};

const PLT_AFFINITY = { profit: 0.4, love: 0.5, tax: 0.1 };

const DEFAULT_OPENMONTAGE_DIR = process.env.OPENMONTAGE_DIR || path.join(os.homedir(), '.openmontage');
const DEFAULT_OUTPUT_DIR = process.env.OPENMONTAGE_OUTPUT_DIR || path.join(os.homedir(), '.openmontage', 'videos');

const PIPELINE_NAME = 'anime-video';
const PROGRESS_POLL_INTERVAL = 2000;

function _resolveOpenMontageDir() {
    return process.env.OPENMONTAGE_DIR || DEFAULT_OPENMONTAGE_DIR;
}

function _checkOpenMontageAvailable() {
    const dir = _resolveOpenMontageDir();
    if (!fs.existsSync(dir)) {
        return { ok: false, error: `OpenMontage not found at ${dir}. Set OPENMONTAGE_DIR env var.` };
    }
    const python = process.platform === 'win32' ? 'python.exe' : 'python3';
    try {
        const { execSync } = require('child_process');
        execSync(`${python} --version`, { cwd: dir, stdio: 'pipe', timeout: 5000 });
        return { ok: true, dir };
    } catch (e) {
        return { ok: false, error: `Python not found or not executable in ${dir}: ${e.message}` };
    }
}

function _writePromptFile(projectName, payload) {
    const dir = _resolveOpenMontageDir();
    const projectsDir = path.join(dir, 'projects');
    fs.mkdirSync(projectsDir, { recursive: true });
    const promptFile = path.join(projectsDir, `${projectName}-gsk-prompt.json`);
    fs.writeFileSync(promptFile, JSON.stringify(payload, null, 2), 'utf8');
    return promptFile;
}

function _buildEnv() {
    const env = { ...process.env };
    env.IMAGE_STYLE_PROFILE = 'anime';
    env.IMAGE_STYLE_PREFIX_OVERRIDE = 'anime manga cel-shaded style, vibrant colors, key visual aesthetic';
    env.IMAGE_BACKEND = process.env.OPENMONTAGE_IMAGE_BACKEND || 'gemini';
    env.GEMINI_NATIVE_IMAGE_MODELS = 'gemini-2.5-flash-image-preview,gemini-2.0-flash-preview-image-generation';
    env.CHECKPOINT_RESUME = process.env.OPENMONTAGE_CHECKPOINT_RESUME || '1';
    env.VIDEOS_ROOT = DEFAULT_OUTPUT_DIR;
    fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
    return env;
}

function _parseProgressLine(line) {
    const match = line.match(/STEP_PROGRESS=(.+)/);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch (e) {
        return null;
    }
}

function _waitForVideo(projectId, dir, timeoutMs) {
    const projectsDir = path.join(dir, 'projects', projectId);
    const rendersDir = path.join(projectsDir, 'renders');
    const videosRoot = DEFAULT_OUTPUT_DIR;
    const startTime = Date.now();

    const checkLocations = [
        rendersDir,
        projectsDir,
        videosRoot,
    ];

    while (Date.now() - startTime < timeoutMs) {
        for (const checkDir of checkLocations) {
            if (!fs.existsSync(checkDir)) continue;
            const files = fs.readdirSync(checkDir).filter(f => f.endsWith('.mp4'));
            for (const f of files) {
                const fullPath = path.join(checkDir, f);
                try {
                    const stats = fs.statSync(fullPath);
                    if (stats.size > 1024 && stats.mtimeMs > startTime - timeoutMs) {
                        return { path: fullPath, size: stats.size };
                    }
                } catch (e) { }
            }
        }
        const { execSync } = require('child_process');
    }

    const { execSync } = require('child_process');
    return null;
}

async function skill_montage_anime(params) {
    const input = typeof params === 'string' ? { prompt: params } : (params || {});
    const action = input.action || 'produce';

    if (action === 'status') {
        const available = _checkOpenMontageAvailable();
        return {
            skill: 'montage_anime',
            plt_affinity: PLT_AFFINITY,
            openmontage_available: available.ok,
            openmontage_dir: available.ok ? available.dir : null,
            error: available.ok ? null : available.error,
            default_pipeline: PIPELINE_NAME,
            image_style_profile: 'anime',
            timestamp: Date.now(),
        };
    }

    const check = _checkOpenMontageAvailable();
    if (!check.ok) {
        return {
            skill: 'montage_anime',
            plt_affinity: PLT_AFFINITY,
            error: check.error,
            timestamp: Date.now(),
        };
    }

    const dir = check.dir;
    const { execSync, spawn } = require('child_process');
    const python = process.platform === 'win32' ? 'python.exe' : 'python3';
    const projectName = input.projectName || `anime_${Date.now()}`;
    const projectTitle = input.title || input.prompt.substring(0, 80);

    const payload = {
        pipeline: PIPELINE_NAME,
        projectId: projectName,
        title: projectTitle,
        prompt: input.prompt,
        referenceUrl: input.referenceUrl || '',
        targetDuration: input.duration || 60,
        audioLanguage: input.language || 'english',
        subtitleLanguage: input.subtitleLanguage || '',
        imageStyleProfile: 'anime',
    };

    const promptFile = _writePromptFile(projectName, payload);
    const env = _buildEnv();

    const runCmd = `python -m webapp.pipeline_runner --pipeline ${PIPELINE_NAME} --project ${projectName} --prompt-file ${promptFile}`;

    return new Promise((resolve) => {
        const startTime = Date.now();
        const timeoutMs = (input.timeoutMinutes || 30) * 60 * 1000;
        let latestProgress = { completed: [], current: null, overallPct: 0 };
        let videoPath = null;
        let videoSize = 0;

        const child = spawn(python, [
            '-m', 'webapp.pipeline_runner',
            '--pipeline', PIPELINE_NAME,
            '--project', projectName,
            '--prompt-file', promptFile,
        ], {
            cwd: dir,
            env: env,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: process.platform === 'win32',
        });

        const stderrChunks = [];
        child.stderr.on('data', (chunk) => {
            stderrChunks.push(chunk.toString());
        });

        child.stdout.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                const progress = _parseProgressLine(line.trim());
                if (progress) {
                    latestProgress = progress;
                }
            }
        });

        child.on('close', (code) => {
            const elapsed = Date.now() - startTime;
            const rendersDir = path.join(dir, 'projects', projectName, 'renders');
            const projectsDir = path.join(dir, 'projects', projectName);

            for (const checkDir of [rendersDir, projectsDir, DEFAULT_OUTPUT_DIR]) {
                if (!fs.existsSync(checkDir)) continue;
                const files = fs.readdirSync(checkDir).filter(f => f.endsWith('.mp4'));
                if (files.length > 0) {
                    const fullPath = path.join(checkDir, files[0]);
                    try {
                        const stats = fs.statSync(fullPath);
                        if (stats.size > 1024) {
                            videoPath = fullPath;
                            videoSize = stats.size;
                            break;
                        }
                    } catch (e) { }
                }
            }

            const stderrOutput = stderrChunks.join('');

            resolve({
                skill: 'montage_anime',
                plt_affinity: PLT_AFFINITY,
                action: 'produce',
                status: code === 0 ? 'completed' : 'failed',
                exitCode: code,
                projectName,
                projectId: projectName,
                title: projectTitle,
                prompt: input.prompt,
                videoPath: videoPath,
                videoSize: videoSize,
                durationSeconds: input.duration || 60,
                imageStyle: 'anime',
                progress: latestProgress,
                elapsedMs: elapsed,
                promptFile: promptFile,
                openmontageDir: dir,
                stderr: code !== 0 ? stderrOutput.substring(0, 2000) : undefined,
                timestamp: Date.now(),
            });
        });

        child.on('error', (err) => {
            resolve({
                skill: 'montage_anime',
                plt_affinity: PLT_AFFINITY,
                error: `Failed to spawn pipeline runner: ${err.message}`,
                timestamp: Date.now(),
            });
        });

        setTimeout(() => {
            if (!child.killed) {
                child.kill('SIGTERM');
                setTimeout(() => {
                    if (!child.killed) child.kill('SIGKILL');
                }, 5000);
            }
        }, timeoutMs);
    });
}

module.exports = {
    MANIFEST,
    PLT_AFFINITY,
    run: skill_montage_anime,
    skill_montage_anime,
};
