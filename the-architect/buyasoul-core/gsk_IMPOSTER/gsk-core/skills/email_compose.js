'use strict';

const PLT_AFFINITY = { profit: 0.4, love: 0.3, tax: 0.3 };

function skill_email_compose(input) {
    const to = input.to || '';
    const subject = input.subject || '';
    const purpose = input.purpose || '';
    const tone = input.tone || 'professional';
    const body = input.body || '';
    
    if (!to) {
        return Promise.resolve({
            skill: 'email_compose',
            plt_affinity: PLT_AFFINITY,
            error: 'Recipient is required',
            timestamp: Date.now(),
        });
    }
    
    const email = {
        to,
        subject: subject || generateSubject(purpose),
        body: body || generateBody(purpose, tone),
        tone,
        timestamp: Date.now(),
    };
    
    return Promise.resolve({
        skill: 'email_compose',
        plt_affinity: PLT_AFFINITY,
        email,
        plt_analysis: analyzePLT(purpose),
        timestamp: Date.now(),
    });
}

function generateSubject(purpose) {
    const subjects = {
        introduction: 'Introduction and Partnership Opportunity',
        follow_up: 'Following Up on Our Conversation',
        meeting: 'Meeting Request',
        thank_you: 'Thank You for Your Time',
        proposal: 'Proposal for Your Consideration',
        update: 'Quick Update',
    };
    
    return subjects[purpose.toLowerCase()] || 'Communication';
}

function generateBody(purpose, tone) {
    const templates = {
        introduction: `Dear [Name],

I hope this message finds you well. I wanted to reach out to introduce myself and explore potential opportunities for collaboration.

[Customize based on specific context]

Looking forward to connecting.

Best regards,
[Your Name]`,
        
        follow_up: `Dear [Name],

I wanted to follow up on our recent conversation. I believe there are some exciting possibilities we could explore together.

Please let me know if you'd like to continue the discussion.

Best regards,
[Your Name]`,
        
        meeting: `Dear [Name],

I would like to schedule a meeting to discuss [topic]. Would you be available [time/date]?

I believe a brief conversation would be valuable for both of us.

Best regards,
[Your Name]`,
    };
    
    return templates[purpose.toLowerCase()] || `Dear [Name],

${purpose}

Best regards,
[Your Name]`;
}

function analyzePLT(purpose) {
    return {
        profit: 'Addresses business opportunity or follow-up',
        love: 'Builds relationship and connection',
        tax: 'Time cost of writing and sending',
        score: 0.6,
        recommendation: 'Email is appropriate for this purpose',
    };
}

module.exports = { skill_email_compose };