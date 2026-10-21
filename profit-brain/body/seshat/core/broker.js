'use strict';

/**
 * SESSIONHAT BROKER — Intelligent routing between Seshat (local) and Omniroute (family tool layer)
 * 
 * FAMILY HIERARCHY:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ LAYER    │ COMPONENT   │ ROLE           │ LOCATION  │ CONTROL      │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ REASON   │ Seshat ALLM │ Local reasoning│ CPU       │ Autonomous   │
 * │ MEMORY   │ Seshat Vectors│ Embeddings  │ LanceDB   │ Autonomous   │
 * │ TOOLS    │ Omniroute   │ MCP Tool Layer │ :20128    │ GSK-Managed  │
 * │ MIND     │ Profit      │ Qwen chat      │ In-proc   │ Blueprint    │
 * │ EXECUTION│ Workbench   │ Orchestrator   │ :3000     │ Family       │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * DECISION MAP:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ TASK TYPE                  │ ROUTER   │ REASON                     │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │ Embedding Generation       │ Seshat   │ Local, fast, no tokens     │
 * │ Vector Search              │ Seshat   │ Embedded DB, instant       │
 * │ Keyword/BM25 Search        │ Seshat   │ No external calls          │
 * │ Memory Indexing            │ Seshat   │ Offline batch processing   │
 * │ File Chunking/Categorizing │ Seshat   │ Text processing only       │
 * │ Simple Q&A (local docs)   │ Seshat   │ Fast, cheap, private       │
 * │ ──────────────────────────┼──────────┼────────────────────────────│
 * │ Tool Calls (read, write, │ Omniroute│ MUST go through MCP layer  │
 * │ browser launch, etc.)     │          │ GSK controls tool access   │
 * │ Multi-step Planning       │ Omniroute│ Can involve external tools │
 * │ Chat Synthesis            │ Omniroute│ Quality-critical response  │
 * │ Creative Writing          │ Omniroute│ Higher quality output      │
 * │ Complex Reasoning         │ Seshat →  │ Try local first            │
 * │                        │ Omniroute│ Fall back if needed        │
 * └─────────────────────────────────────────────────────────────────────┘
 */

const { sendOmniRequest, checkOmniRoute, getOmniStatus } = require('./omniClient');
const { getStatus, LLM_AVAILABLE } = require('./llm');
const seshat = require('./index');

const OMNIROUTE_AVAILABLE = process.env.OMNIROUTE_URL || 'http://localhost:20128';
const TOOL_TASKS = ['tool_call', 'read_file', 'write_file', 'browser', 'api_call', 'external'];

async function brokerQuery(prompt, options = {}) {
    const {
        taskType = 'reasoning',
        maxTokens = 2048,
        temperature = 0.7,
        context = null,
        urgent = false,
        qualityCritical = false,
        toolCall = false
    } = options;

    if (urgent && LLM_AVAILABLE) {
        return seshat.generate(prompt, { maxTokens, temperature });
    }

    if (toolCall || TOOL_TASKS.includes(taskType)) {
        const omni = await checkOmniRoute();
        if (omni) {
            return sendOmniRequest({
                model: 'qwen-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature: temperature
            });
        }
    }

    if (qualityCritical || taskType === 'chat' || taskType === 'planning') {
        return sendOmniRequest({
            model: 'qwen-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });
    }

    if (LLM_AVAILABLE) {
        return seshat.think(prompt, context);
    }

    return sendOmniRequest({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature
    });
}

async function brokerSearch(query, options = {}) {
    const {
        mode = 'hybrid',
        useVectors = true,
        useKeywords = true,
        topK = 10
    } = options;

    if (mode === 'keyword' || mode === 'bm25') {
        return seshat.searchByCategory(query, { topK });
    }

    if (mode === 'vector' && useVectors) {
        return seshat.hybridSearch(query, { vector: true, bm25: false, topK });
    }

    return seshat.hybridSearch(query, { vector: useVectors, bm25: useKeywords, topK });
}

async function brokerSynthesize(topic, sourceDocs = [], options = {}) {
    const { maxTokens = 2048, chunk = false, outputType = 'summary', toolContext = false } = options;

    if (sourceDocs.length === 0) {
        if (toolContext || !LLM_AVAILABLE) {
            return { source: 'omniroute', result: await sendOmniRequest({
                model: 'qwen-turbo',
                messages: [{ role: 'user', content: `Synthesize: ${topic}` }],
                max_tokens: maxTokens
            }) };
        }
        const localResult = await seshat.synthesize(topic, { maxTokens });
        return { source: 'seshat', result: localResult };
    }

    if (toolContext) {
        return { source: 'omniroute', result: await sendOmniRequest({
            model: 'qwen-turbo',
            messages: [
                { role: 'system', content: 'You are a synthesis engine with tool access.' },
                { role: 'user', content: `Topic: ${topic}\n\nSources:\n${sourceDocs.join('\n')}` }
            ],
            max_tokens: maxTokens
        }) };
    }

    const localSummary = await seshat.summarize(sourceDocs.join('\n'), { maxTokens: 512 });
    
    if (LLM_AVAILABLE) {
        return { source: 'seshat', result: await seshat.synthesize(`${topic}: ${localSummary}`, { maxTokens }) };
    }

    return { source: 'omniroute', result: await sendOmniRequest({
        model: 'qwen-turbo',
        messages: [
            { role: 'system', content: 'You are a synthesis engine.' },
            { role: 'user', content: `Topic: ${topic}\n\nSources:\n${sourceDocs.join('\n')}` }
        ],
        max_tokens: maxTokens
    }) };
}

async function brokerToolCall(toolName, argumentsObj, options = {}) {
    const omni = await checkOmniRoute();
    if (!omni) {
        throw new Error('Omniroute (MCP tool layer) is not available');
    }
    
    return { source: 'omniroute', result: await sendOmniRequest({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: `Use tool: ${toolName}` }],
        functions: [{ name: toolName, parameters: argumentsObj }],
        function_call: { name: toolName },
        max_tokens: options.maxTokens || 1000
    }) };
}

async function brokerDecide(taskDescription) {
    const toolIndicators = ['tool', 'browser', 'api', 'file', 'web', 'external', 'execute'];
    const qualityIndicators = ['chat', 'creative', 'writing', 'conversation'];
    const localIndicators = ['embed', 'search', 'index', 'summarize', 'categorize', 'chunk', 'qa', 'simple'];

    const desc = taskDescription.toLowerCase();

    for (const indicator of toolIndicators) {
        if (desc.includes(indicator)) return 'omniroute';
    }

    for (const indicator of qualityIndicators) {
        if (desc.includes(indicator)) return 'omniroute';
    }

    for (const indicator of localIndicators) {
        if (desc.includes(indicator)) return 'seshat';
    }

    if (LLM_AVAILABLE) return 'seshat';
    return 'omniroute';
}

async function route(task, payload, options = {}) {
    const router = await brokerDecide(task);
    
    if (router === 'seshat' && LLM_AVAILABLE) {
        switch (task) {
            case 'reasoning':
                return { source: 'seshat', result: await seshat.think(payload, options.context) };
            case 'search':
                return { source: 'seshat', result: await brokerSearch(payload, options) };
            case 'summarize':
                return { source: 'seshat', result: await seshat.summarize(payload, options) };
            case 'synthesize':
                return { source: 'seshat', result: await seshat.synthesize(payload, options) };
            default:
                return { source: 'seshat', result: await seshat.generate(payload, options) };
        }
    }

    return { source: 'omniroute', result: await sendOmniRequest({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: payload }],
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7
    }) };
}

module.exports = {
    query: brokerQuery,
    search: brokerSearch,
    synthesize: brokerSynthesize,
    toolCall: brokerToolCall,
    decide: brokerDecide,
    route: route,
    OMNIROUTE_URL: OMNIROUTE_AVAILABLE,
    checkOmniRoute,
    omniStatus: getOmniStatus
};