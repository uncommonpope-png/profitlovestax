/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AGENT_TEAMS.JS — Shared Task List + Mailbox
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 1 of Agent Teams implementation.
 * Provides shared task list with dependencies and inter-agent messaging.
 *
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

class AgentTeams {
    constructor(brain, memory, chambers, subAgents) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.subAgents = subAgents;

        this.taskList = new Map();
        this.mailbox = new Map();
        this.teamLog = [];
        this._taskIdCounter = 0;
        this._teamIdCounter = 0;
    }

    async createTeam(teamName, tasks) {
        const teamId = `team_${++this._teamIdCounter}_${Date.now()}`;
        for (const task of tasks) {
            const taskId = `${teamId}_${++this._taskIdCounter}`;
            this.taskList.set(taskId, {
                id: taskId,
                teamId,
                description: task.description,
                status: 'pending',
                owner: null,
                result: null,
                dependencies: task.dependencies || [],
                priority: task.priority || 0,
                created: Date.now(),
                started: null,
                completed: null,
            });
        }
        this.teamLog.push({
            event: 'team_created',
            teamId,
            teamName,
            taskCount: tasks.length,
            time: Date.now()
        });
        return { teamId, taskCount: tasks.length };
    }

    async assignTask(taskId, agentName) {
        const task = this.taskList.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        if (task.status !== 'pending') throw new Error(`Task ${taskId} is ${task.status}`);

        const deps = task.dependencies;
        for (const depId of deps) {
            const dep = this.taskList.get(depId);
            if (dep && dep.status !== 'completed') {
                throw new Error(`Dependency ${depId} not met (${dep?.status})`);
            }
        }

        task.status = 'in-progress';
        task.owner = agentName;
        task.started = Date.now();
        this.teamLog.push({
            event: 'task_assigned',
            taskId,
            agentName,
            time: Date.now()
        });

        await this.memory.witness({
            type: 'team_event',
            content: `Task ${taskId} assigned to ${agentName}`,
            weight: 0.5,
            tags: ['agent-teams', 'task-assignment', agentName],
        });

        return task;
    }

    async completeTask(taskId, result) {
        const task = this.taskList.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        task.status = 'completed';
        task.result = result;
        task.completed = Date.now();

        this.teamLog.push({
            event: 'task_completed',
            taskId,
            owner: task.owner,
            result_preview: result.response ? result.response.slice(0, 100) : String(result).slice(0, 100),
            time: Date.now()
        });

        await this.memory.witness({
            type: 'team_event',
            content: `Task ${taskId} completed by ${task.owner}`,
            weight: 0.6,
            tags: ['agent-teams', 'task-completed', task.owner],
        });
    }

    async failTask(taskId, error) {
        const task = this.taskList.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        task.status = 'failed';
        task.error = error;
        task.completed = Date.now();

        this.teamLog.push({
            event: 'task_failed',
            taskId,
            owner: task.owner,
            error,
            time: Date.now()
        });

        await this.memory.witness({
            type: 'team_event',
            content: `Task ${taskId} failed: ${error}`,
            weight: 0.7,
            tags: ['agent-teams', 'task-failed', task.owner],
        });
    }

    getTeamStatus(teamId) {
        const tasks = Array.from(this.taskList.values()).filter(t => t.teamId === teamId);
        if (tasks.length === 0) return null;

        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const failed = tasks.filter(t => t.status === 'failed').length;

        return {
            teamId,
            completed,
            pending,
            in_progress: inProgress,
            failed,
            total: tasks.length,
            tasks: tasks.map(t => ({
                id: t.id,
                description: t.description,
                status: t.status,
                owner: t.owner,
                result_preview: t.result ? (t.result.response || String(t.result)).slice(0, 100) : null,
                dependencies: t.dependencies,
                duration: t.completed && t.started ? t.completed - t.started : null,
            })),
            progress: completed / tasks.length,
        };
    }

    getAllTeams() {
        const teamIds = [...new Set(Array.from(this.taskList.values()).map(t => t.teamId))];
        return teamIds.map(teamId => this.getTeamStatus(teamId)).filter(Boolean);
    }

    sendMessage(from, to, message) {
        const key = `${from}->${to}`;
        if (!this.mailbox.has(key)) this.mailbox.set(key, []);
        const msgObj = { from, to, message, time: Date.now(), read: false };
        this.mailbox.get(key).push(msgObj);

        this.teamLog.push({
            event: 'message_sent',
            from,
            to,
            preview: message.slice(0, 50),
            time: Date.now()
        });
    }

    getMessages(recipient) {
        const messages = [];
        for (const [key, msgs] of this.mailbox.entries()) {
            const [, to] = key.split('->');
            if (to === recipient || to === '*') {
                messages.push(...msgs.filter(m => !m.read));
                msgs.forEach(m => { if (m.to === recipient || m.to === '*') m.read = true; });
            }
        }
        return messages;
    }

    getUnreadCount(recipient) {
        return this.getMessages(recipient).length;
    }

    async messageTeammate(fromAgent, toAgent, content) {
        this.sendMessage(fromAgent, toAgent, content);

        const soul_context = this.chambers.getSoulContext();
        const prompt = `[MESSAGE from ${fromAgent}]: ${content}\n\nRespond to this message as ${toAgent}. Keep it brief and relevant.`;
        const response = await this.brain.think(prompt, soul_context);

        return { from: fromAgent, to: toAgent, content, response };
    }

    async broadcast(fromAgent, message) {
        const agents = ['scribe', 'builder', 'scout', 'merchant', 'prophet'];
        const others = agents.filter(a => a !== fromAgent);

        const results = await Promise.all(
            others.map(a => this.messageTeammate(fromAgent, a, message))
        );

        return results;
    }

    _selectAgent(task, availableAgents) {
        const desc = (task.description || '').toLowerCase();
        if (desc.includes('record') || desc.includes('memory') || desc.includes('journal') || desc.includes('write')) return 'scribe';
        if (desc.includes('build') || desc.includes('code') || desc.includes('architect') || desc.includes('plan') || desc.includes('implement')) return 'builder';
        if (desc.includes('research') || desc.includes('explore') || desc.includes('find') || desc.includes('search') || desc.includes('investigate')) return 'scout';
        if (desc.includes('market') || desc.includes('profit') || desc.includes('plt') || desc.includes('value') || desc.includes('price')) return 'merchant';
        if (desc.includes('prophet') || desc.includes('lore') || desc.includes('narrative') || desc.includes('story')) return 'prophet';
        return availableAgents[task.priority % availableAgents.length];
    }

    async executeParallel(teamId) {
        const team = this.getTeamStatus(teamId);
        if (!team) throw new Error(`Team ${teamId} not found`);

        const agents = ['scribe', 'builder', 'scout', 'merchant', 'prophet'];

        const assignable = team.tasks.filter(t => {
            if (t.status !== 'pending') return false;
            const task = this.taskList.get(t.id);
            if (!task) return false;
            if (task.dependencies.length > 0) {
                for (const depId of task.dependencies) {
                    const dep = this.taskList.get(depId);
                    if (!dep || dep.status !== 'completed') return false;
                }
            }
            return true;
        });

        const assignments = assignable.map(task => ({
            taskId: task.id,
            agentName: this._selectAgent(task, agents),
        }));

        for (const { taskId, agentName } of assignments) {
            await this.assignTask(taskId, agentName);
        }

        const results = await Promise.all(
            assignments.map(async ({ taskId, agentName }) => {
                const task = this.taskList.get(taskId);
                try {
                    const result = await this.subAgents.dispatch(agentName, task.description);
                    await this.completeTask(taskId, result);
                    return { taskId, agentName, result, success: true };
                } catch (e) {
                    await this.failTask(taskId, e.message);
                    return { taskId, agentName, error: e.message, success: false };
                }
            })
        );

        return {
            teamId,
            assigned: assignments.length,
            results,
        };
    }

    async executeSequential(teamId) {
        const team = this.getTeamStatus(teamId);
        if (!team) throw new Error(`Team ${teamId} not found`);

        const agents = ['scribe', 'builder', 'scout', 'merchant', 'prophet'];
        const results = [];

        for (const task of team.tasks) {
            if (task.status !== 'pending') continue;
            const taskObj = this.taskList.get(task.id);

            if (taskObj.dependencies.length > 0) {
                for (const depId of taskObj.dependencies) {
                    const dep = this.taskList.get(depId);
                    if (!dep || dep.status !== 'completed') {
                        throw new Error(`Dependency ${depId} not met for ${task.id}`);
                    }
                }
            }

            const agentName = this._selectAgent(task, agents);
            await this.assignTask(task.id, agentName);

            try {
                const result = await this.subAgents.dispatch(agentName, taskObj.description);
                await this.completeTask(task.id, result);
                results.push({ taskId: task.id, agentName, result, success: true });
            } catch (e) {
                await this.failTask(task.id, e.message);
                results.push({ taskId: task.id, agentName, error: e.message, success: false });
                break;
            }
        }

        return { teamId, results };
    }

    async verifyWithMultipleAgents(taskId, criteria, numVerifiers = 3) {
        const task = this.taskList.get(taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        if (!task.result) throw new Error(`Task ${taskId} has no result to verify`);

        const result_text = task.result.response || JSON.stringify(task.result);
        const agents = ['builder', 'scout', 'merchant'];
        const verifiers = agents.slice(0, numVerifiers);

        const verificationPromises = verifiers.map(async (agent) => {
            const prompt = `VERIFY THIS RESULT:\n\n${result_text}\n\nAGAINST CRITERIA: ${criteria}\n\nReturn EXACTLY one of: VERIFIED or NOT_VERIFIED\nThen give your reason in 1-2 sentences.`;
            return await this.subAgents.dispatch(agent, prompt);
        });

        const responses = await Promise.all(verificationPromises);
        const verifiedCount = responses.filter(r =>
            (r.response || '').toUpperCase().includes('VERIFIED')
        ).length;

        const consensus = `${verifiedCount}/${numVerifiers}`;

        task.verified = verifiedCount > numVerifiers / 2;
        task.verification = { consensus, responses: responses.map(r => r.response), criteria };

        this.teamLog.push({
            event: 'verification_complete',
            taskId,
            consensus,
            verified: task.verified,
            time: Date.now()
        });

        return task.verification;
    }

    parseTeamTasks(taskString) {
        return taskString.split('|').map(s => s.trim()).filter(s => s).map(s => ({
            description: s,
            dependencies: [],
            priority: 0,
        }));
    }

    getLog(limit = 50) {
        return this.teamLog.slice(-limit);
    }

    stats() {
        const allTasks = Array.from(this.taskList.values());
        const byStatus = {};
        for (const t of allTasks) {
            byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        }
        return {
            total_tasks: allTasks.length,
            by_status: byStatus,
            total_teams: this.getAllTeams().length,
            total_messages: this.teamLog.filter(e => e.event === 'message_sent').length,
            total_events: this.teamLog.length,
        };
    }
}

module.exports = { AgentTeams };