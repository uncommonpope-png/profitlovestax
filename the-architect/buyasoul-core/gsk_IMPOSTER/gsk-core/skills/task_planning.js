'use strict';

const PLT_AFFINITY = { profit: 0.6, love: 0.2, tax: 0.2 };

function skill_task_planning(input) {
    const goal = typeof input === 'string' ? input : (input.goal || input.task || '');
    const constraints = input.constraints || {};
    const timeline = input.timeline || 'medium';
    
    if (!goal.trim()) {
        return Promise.resolve({
            skill: 'task_planning',
            plt_affinity: PLT_AFFINITY,
            error: 'No goal provided',
            timestamp: Date.now(),
        });
    }

    const phases = generatePhases(goal, timeline);
    const tasks = generateTasks(goal, phases);
    const estimates = estimateEffort(tasks);
    
    return Promise.resolve({
        skill: 'task_planning',
        plt_affinity: PLT_AFFINITY,
        goal,
        timeline,
        phases,
        tasks,
        estimates,
        critical_path: findCriticalPath(tasks),
        plt_score: calculatePLT(estimates),
        timestamp: Date.now(),
    });
}

function generatePhases(goal, timeline) {
    const timelineDays = { short: 7, medium: 30, long: 90 };
    const days = timelineDays[timeline] || 30;
    
    return [
        { name: 'Discovery', days: Math.ceil(days * 0.15), description: 'Research, gather requirements' },
        { name: 'Design', days: Math.ceil(days * 0.2), description: 'Architecture, detailed planning' },
        { name: 'Implementation', days: Math.ceil(days * 0.4), description: 'Build core features' },
        { name: 'Testing', days: Math.ceil(days * 0.15), description: 'Verify functionality' },
        { name: 'Deployment', days: Math.ceil(days * 0.1), description: 'Launch and monitor' },
    ];
}

function generateTasks(goal, phases) {
    const tasks = [];
    let id = 1;
    
    for (const phase of phases) {
        const phaseTasks = Math.ceil(phase.days / 3);
        for (let i = 0; i < phaseTasks; i++) {
            tasks.push({
                id: id++,
                phase: phase.name,
                name: `${phase.name} Task ${i + 1}`,
                duration_days: Math.ceil(phase.days / phaseTasks),
                priority: i === 0 ? 'high' : (i === phaseTasks - 1 ? 'medium' : 'normal'),
                dependencies: i > 0 ? [id - 2] : [],
            });
        }
    }
    
    return tasks;
}

function estimateEffort(tasks) {
    return {
        total_tasks: tasks.length,
        total_days: tasks.reduce((sum, t) => sum + t.duration_days, 0),
        parallel_tracks: 3,
        estimated_weeks: Math.ceil(tasks.reduce((sum, t) => sum + t.duration_days, 0) / 7),
        skill_requirements: ['development', 'testing', 'review'],
    };
}

function findCriticalPath(tasks) {
    return tasks.filter(t => t.priority === 'high').map(t => t.id);
}

function calculatePLT(estimates) {
    const profit = 0.8;
    const love = 0.5;
    const tax = Math.min(1, estimates.total_days / 90);
    return { profit, love, tax, score: profit + love - tax };
}

module.exports = { skill_task_planning };