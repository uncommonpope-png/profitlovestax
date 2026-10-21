process.env.NINE_ROUTER_API_KEY = 'test';
process.env.GSK_PROJECT_ROOTS = 'C:\\Users\\uncom\\Downloads\\Profit Bible Foundation Acknowledged - DeepSeek_files';
process.env.NINE_ROUTER_URL = 'http://127.0.0.1:20128';
process.env.MCP_API_KEY = 'gsk-dev-key';
process.env.GSK_MODEL = 'auto/best-reasoning';
process.env.GSK_MODEL_FALLBACKS = 'auto/best-fast,auto/best-coding,auto/smart';

const path = require('path');
process.env.GSK_ROOT = path.join(__dirname, 'the-architect', 'buyasoul-core', 'gsk');

// Load the daemon
require('./the-architect/buyasoul-core/gsk/gsk_daemon.js');
