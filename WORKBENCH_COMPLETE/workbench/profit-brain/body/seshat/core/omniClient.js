'use strict';

/**
 * OMNIROUTE CLIENT — Secure bridge to the blood flow
 */

let OMNIROUTE_AVAILABLE = true;
let OMNIROUTE_RECENT_FAILURES = 0;
const MAX_FAILURES = 3;

const OMNIROUTE_URL = () => process.env.OMNIROUTE_URL || process.env.OMNIROUTE_BASE_URL || 'http://127.0.0.1:20128';

function omniHeaders() {
    const key = process.env.OMNIROUTE_API_KEY || process.env.GSK_BRAIN_API_KEY || process.env.NINE_ROUTER_API_KEY || '';
    return {
        'Content-Type': 'application/json',
        ...(key ? { 'Authorization': 'Bearer ' + key, 'x-api-key': key } : {})
    };
}

async function sendOmniRequest(message, endpoint = '/v1/chat/completions') {
    // Breaker: while unavailable, probe once per call until it recovers.
    if (!OMNIROUTE_AVAILABLE) {
        const recovered = await checkOmniRoute();
        if (!recovered) {
            throw new Error(`Omniroute unavailable (${OMNIROUTE_RECENT_FAILURES} recent failures)`);
        }
    }

    const url = `${OMNIROUTE_URL()}${endpoint}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: omniHeaders(),
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
    OMNIROUTE_AVAILABLE = true;
    return response.json();
}

async function checkOmniRoute() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${OMNIROUTE_URL()}/v1/models`, {
            method: 'GET',
            headers: omniHeaders(),
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
        url: OMNIROUTE_URL()
    };
}

module.exports = {
    sendOmniRequest,
    checkOmniRoute,
    getOmniStatus
};