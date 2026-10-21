const crypto = require('crypto');

const JSONRPC_VERSION = '2.0';

// =============================================================================
// Message Builders
// =============================================================================

function buildRequest(method, params = {}, id) {
    return {
        jsonrpc: JSONRPC_VERSION,
        id: id || crypto.randomUUID().slice(0, 8),
        method,
        params
    };
}

function buildResponse(id, result) {
    return { jsonrpc: JSONRPC_VERSION, id, result };
}

function buildError(id, code, message, data) {
    const err = { jsonrpc: JSONRPC_VERSION, id, error: { code, message } };
    if (data) err.error.data = data;
    return err;
}

function buildNotification(method, params = {}) {
    return { jsonrpc: JSONRPC_VERSION, method, params };
}

function isRequest(msg) {
    return msg && msg.jsonrpc === JSONRPC_VERSION && msg.method && msg.id !== undefined;
}

function isNotification(msg) {
    return msg && msg.jsonrpc === JSONRPC_VERSION && msg.method && msg.id === undefined;
}

function isResponse(msg) {
    return msg && msg.jsonrpc === JSONRPC_VERSION && msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined);
}

function isError(msg) {
    return isResponse(msg) && msg.error !== undefined;
}

// =============================================================================
// Error Codes (standard JSON-RPC)
// =============================================================================

const ERROR_CODES = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR_START: -32000,
    SERVER_ERROR_END: -32099
};

function classifyError(err) {
    if (!err || !err.code) return 'UNKNOWN';
    switch (err.code) {
        case ERROR_CODES.PARSE_ERROR: return 'PARSE_ERROR';
        case ERROR_CODES.INVALID_REQUEST: return 'INVALID_REQUEST';
        case ERROR_CODES.METHOD_NOT_FOUND: return 'METHOD_NOT_FOUND';
        case ERROR_CODES.INVALID_PARAMS: return 'INVALID_PARAMS';
        case ERROR_CODES.INTERNAL_ERROR: return 'INTERNAL_ERROR';
        default:
            if (err.code >= -32099 && err.code <= -32000) return 'SERVER_ERROR';
            return 'APPLICATION_ERROR';
    }
}

// =============================================================================
// Transport Helpers
// =============================================================================

function createStdioTransport(command, args = []) {
    const { spawn } = require('child_process');
    let child, buffer = '', pending = {};
    
    function start() {
        return new Promise((resolve, reject) => {
            child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
            child.stdout.on('data', data => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);
                        if (pending[msg.id]) {
                            pending[msg.id](msg);
                            delete pending[msg.id];
                        }
                    } catch (e) {}
                }
            });
            child.stderr.on('data', data => {});
            child.on('error', reject);
            child.on('exit', () => {});
            setTimeout(resolve, 300);
        });
    }

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID().slice(0, 8);
            const msg = buildRequest(method, params, id);
            pending[id] = (resp) => {
                if (resp.error) reject(new Error(resp.error.message));
                else resolve(resp.result);
            };
            child.stdin.write(JSON.stringify(msg) + '\n');
            setTimeout(() => {
                if (pending[id]) {
                    delete pending[id];
                    reject(new Error('Transport timeout'));
                }
            }, 30000);
        });
    }

    function stop() {
        if (child) child.kill();
        pending = {};
    }

    return { start, send, stop };
}

function createHttpTransport(baseUrl) {
    const http = require('http');
    const https = require('https');

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const msg = buildRequest(method, params);
            const urlObj = new URL(baseUrl);
            const client = urlObj.protocol === 'https:' ? https : http;
            const data = JSON.stringify(msg);
            const req = client.request(urlObj, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            }, res => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    try {
                        const resp = JSON.parse(body);
                        if (resp.error) reject(new Error(resp.error.message));
                        else resolve(resp.result);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    return { send };
}

// =============================================================================
// Tool Discovery
// =============================================================================

const MCP_TOOL_REGISTRY = {
    filesystem: ['read_file', 'write_file', 'edit_file', 'create_directory', 'list_directory', 'search_files', 'get_file_info', 'delete_file', 'copy_file', 'move_file', 'read_multiple_files'],
    github: ['create_repository', 'get_repository', 'search_repositories', 'create_issue', 'get_issue', 'search_issues', 'create_pull_request', 'get_pull_request', 'list_pull_requests', 'create_comment', 'list_commits', 'get_contents', 'create_branch', 'list_branches', 'create_release', 'list_releases'],
    postgres: ['query', 'execute', 'list_tables', 'describe_table', 'get_schema', 'run_transaction', 'backup_table'],
    sqlite: ['query', 'execute', 'list_tables', 'create_table', 'insert_rows', 'run_migration'],
    memory: ['store', 'recall', 'search', 'forget', 'list_keys', 'stats'],
    brave_search: ['web_search', 'news_search', 'image_search', 'video_search', 'local_search'],
    puppeteer: ['navigate', 'click', 'type', 'screenshot', 'evaluate', 'get_html', 'get_text', 'wait_for_selector', 'pdf'],
    slack: ['post_message', 'list_channels', 'get_channel_history', 'search_messages', 'upload_file', 'create_channel', 'invite_user'],
    discord: ['send_message', 'get_messages', 'list_channels', 'create_channel', 'add_reaction', 'delete_message'],
    email: ['send_email', 'read_inbox', 'search_emails', 'get_thread', 'create_draft', 'move_to_folder'],
    notion: ['search_pages', 'get_page', 'create_page', 'update_page', 'append_block', 'list_databases', 'query_database'],
    jira: ['search_issues', 'get_issue', 'create_issue', 'update_issue', 'list_projects', 'add_comment', 'get_transitions'],
    sentry: ['list_issues', 'get_issue_details', 'list_events', 'search_issues', 'get_project_stats'],
    aws: ['list_s3_buckets', 'upload_to_s3', 'download_from_s3', 'list_ec2_instances', 'start_ec2', 'stop_ec2', 'invoke_lambda', 'list_lambda_functions'],
    docker: ['list_containers', 'start_container', 'stop_container', 'list_images', 'pull_image', 'run_container', 'container_logs'],
    kubernetes: ['list_pods', 'get_pod_logs', 'list_services', 'list_deployments', 'get_node_status', 'apply_manifest'],
    stripe: ['create_payment', 'list_payments', 'get_balance', 'create_customer', 'list_customers', 'create_invoice'],
    openai: ['chat_completion', 'embedding', 'image_generation', 'transcription', 'list_models'],
    huggingface: ['query_model', 'list_models', 'search_datasets', 'inference', 'upload_model'],
    youtube: ['search_videos', 'get_video_info', 'list_comments', 'get_channel_stats', 'list_playlists'],
    figma: ['get_file', 'get_node', 'get_images', 'get_styles', 'search_components'],
    twitter: ['post_tweet', 'search_tweets', 'get_user_timeline', 'get_user_info', 'list_followers'],
    google_calendar: ['list_events', 'create_event', 'update_event', 'delete_event', 'get_freebusy'],
    prometheus: ['query', 'query_range', 'list_metrics', 'get_alerts', 'get_targets'],
    vercel: ['list_deployments', 'create_deployment', 'get_deployment', 'list_projects', 'get_domain_config'],
    cloudflare: ['list_zones', 'purge_cache', 'update_dns', 'get_analytics', 'list_workers'],
    shodan: ['search_hosts', 'get_host_info', 'search_ports', 'get_service_info', 'get_exploits'],
    virustotal: ['scan_url', 'get_url_report', 'scan_file', 'get_file_report', 'search_ioc']
};

function getToolNamesForServer(serverName) {
    return MCP_TOOL_REGISTRY[serverName] || [];
}

function getAllKnownToolNames() {
    const all = [];
    for (const tools of Object.values(MCP_TOOL_REGISTRY)) {
        all.push(...tools);
    }
    return all;
}

function countAllKnownTools() {
    let count = 0;
    for (const tools of Object.values(MCP_TOOL_REGISTRY)) {
        count += tools.length;
    }
    return count;
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
    buildRequest,
    buildResponse,
    buildError,
    buildNotification,
    isRequest,
    isNotification,
    isResponse,
    isError,
    ERROR_CODES,
    classifyError,
    createStdioTransport,
    createHttpTransport,
    MCP_TOOL_REGISTRY,
    getToolNamesForServer,
    getAllKnownToolNames,
    countAllKnownTools
};
