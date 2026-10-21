'use strict';

/**
 * OMNIROUTE CLIENT — Secure bridge to the blood flow
 */

let OMNIROUTE_AVAILABLE = true;
let OMNIROUTE_RECENT_FAILURES = 0;
const MAX_FAILURES = 3;

async function sendOmniRequest(message, endpoint = '/v1/chat/completions') {
    if (!OMNIROUTE_AVAILABLE) {
        const url = `http://localhost:20128${endpoint}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            
            if (response.ok) {
                OMNIROUTE_RECENT_FAILURES = 0;
                return response.json();
            }
        } catch (error) {
            OMNIROUTE_RECENT_FAILURES++;
            if (OMNIROUTE_RECENT_FAILURES >= MAX_FAILURES) {
                OMNIROUTE_AVAILABLE = false;
            }
            throw error;
        }
    }

    const url = `http://localhost:20128${endpoint}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
    });
    
    if (!response.ok) {
        OMNIROUTE_RECENT_FAILURES++;
        if (OMNIROUTE_RECENT_FAILURES >= MAX_FAILURES) {
            OMNIROUTE_AVAILABLE = false;
        }
        throw new Error(`Omniroute error: ${response.status}`);
    }
    
    OMNIROUTE_RECENT_FAILURES = 0;
    return response.json();
}

async function checkOmniRoute() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('http://localhost:20128/v1/models', {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
            OMNIROUTE_AVAILABLE = true;
            OMNIROUTE_RECENT_FAILURES = 0;
            return true;
        }
    } catch (error) {
        OMNIROUTE_AVAILABLE = false;
    }
    
    return OMNIROUTE_AVAILABLE;
}

function getOmniStatus() {
    return {
        available: OMNIROUTE_AVAILABLE,
        recentFailures: OMNIROUTE_RECENT_FAILURES,
        url: 'http://localhost:20128'
    };
}

module.exports = {
    sendOmniRequest,
    checkOmniRoute,
    getOmniStatus
};