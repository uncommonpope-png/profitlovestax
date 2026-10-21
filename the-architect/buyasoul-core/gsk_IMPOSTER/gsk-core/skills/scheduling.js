'use strict';

const PLT_AFFINITY = { profit: 0.3, love: 0.5, tax: 0.2 };

function skill_scheduling(input) {
    const action = input.action || 'schedule';
    const task = input.task || '';
    const duration = input.duration || 60;
    const priority = input.priority || 'normal';
    
    if (action === 'schedule') {
        return scheduleTask(task, duration, priority);
    }
    
    if (action === 'list') {
        return listScheduled();
    }
    
    if (action === 'cancel') {
        return cancelTask(input.id || input.task_id);
    }
    
    return Promise.resolve({
        skill: 'scheduling',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['schedule', 'list', 'cancel'],
        timestamp: Date.now(),
    });
}

function scheduleTask(task, duration, priority) {
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + (priority === 'urgent' ? 5 : 30));
    
    return Promise.resolve({
        skill: 'scheduling',
        plt_affinity: PLT_AFFINITY,
        action: 'schedule',
        task,
        duration_minutes: duration,
        priority,
        scheduled_for: scheduledAt.toISOString(),
        status: 'scheduled',
        reminder: generateReminder(task, priority),
        plt_impact: analyzeSchedulingPLT(priority),
        timestamp: Date.now(),
    });
}

function listScheduled() {
    return Promise.resolve({
        skill: 'scheduling',
        plt_affinity: PLT_AFFINITY,
        action: 'list',
        tasks: [
            { id: 1, task: 'Review PR', time: '10:00 AM', priority: 'high' },
            { id: 2, task: 'Team sync', time: '11:30 AM', priority: 'normal' },
            { id: 3, task: 'Update docs', time: '2:00 PM', priority: 'low' },
        ],
        total: 3,
        timestamp: Date.now(),
    });
}

function cancelTask(id) {
    return Promise.resolve({
        skill: 'scheduling',
        plt_affinity: PLT_AFFINITY,
        action: 'cancel',
        task_id: id,
        status: id ? 'cancelled' : 'error',
        error: id ? null : 'Task ID required',
        timestamp: Date.now(),
    });
}

function generateReminder(task, priority) {
    const messages = {
        urgent: `URGENT: ${task} - Requires immediate attention`,
        high: `Reminder: ${task} - High priority task ahead`,
        normal: `${task} is scheduled and ready`,
        low: `FYI: ${task} has been added to your schedule`,
    };
    
    return messages[priority] || messages.normal;
}

function analyzeSchedulingPLT(priority) {
    const scores = {
        urgent: { profit: 0.8, love: 0.5, tax: 0.6 },
        high: { profit: 0.7, love: 0.4, tax: 0.4 },
        normal: { profit: 0.5, love: 0.5, tax: 0.3 },
        low: { profit: 0.3, love: 0.6, tax: 0.2 },
    };
    
    const s = scores[priority] || scores.normal;
    return { ...s, total: s.profit + s.love - s.tax };
}

module.exports = { skill_scheduling };