const path = require('path');
const GSKFusion = require('./fusion-loader.js');
async function test() {
    const gsk = new GSKFusion(null, { dataDir: path.join(__dirname, 'data') });
    await gsk.boot();
    const bm = gsk.brain;
    console.log('Brain type:', bm.constructor.name);
    console.log('Has thinkForUser:', typeof bm.thinkForUser);
    console.log('Has thinkForBackground:', typeof bm.thinkForBackground);
    console.log('BrainManager summary:', JSON.stringify(bm.summary()));
    
    // Test user brain directly
    console.log('Testing user brain...');
    const sw = Date.now();
    const res = await bm.thinkForUser("Who are you? One sentence.", "");
    console.log('[User Brain', Date.now() - sw, 'ms]:', res?.substring(0, 200));
    
    process.exit(0);
}
test();
