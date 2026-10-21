'use strict';

const http = require('http');

const BASE = 'http://127.0.0.1:3001';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  const app = require('./marketplace_api.js');
  const server = app.listen(3001);

  console.log('\n=== SOUL MARKETPLACE API TESTS ===\n');

  try {
    let res;

    res = await request('GET', '/api/health');
    console.log(`[1] GET /api/health`);
    console.log(`    Status: ${res.status} | Souls: ${res.data.soulCount}`);
    console.log(`    PASS: ${res.status === 200 && res.data.status === 'ok' ? 'YES' : 'NO'}\n`);

    res = await request('GET', '/api/souls');
    console.log(`[2] GET /api/souls`);
    console.log(`    Status: ${res.status} | Count: ${res.data.count}`);
    console.log(`    PASS: ${res.status === 200 && res.data.success ? 'YES' : 'NO'}\n`);

    if (res.data.souls && res.data.souls.length > 0) {
      const soulId = res.data.souls[0].id;
      res = await request('GET', `/api/souls/${soulId}`);
      console.log(`[3] GET /api/souls/:id (${soulId})`);
      console.log(`    Status: ${res.status} | Name: ${res.data.soul?.name}`);
      console.log(`    PLT: ${res.data.soul?.plt_score} | Price: $${res.data.soul?.price_usd}`);
      console.log(`    PASS: ${res.status === 200 && res.data.soul ? 'YES' : 'NO'}\n`);
    }

    res = await request('GET', '/api/marketplace/stats');
    console.log(`[4] GET /api/marketplace/stats`);
    console.log(`    Status: ${res.status} | Total: ${res.data.stats?.totalSouls}`);
    console.log(`    Avg Price: $${res.data.stats?.averagePrice} | Avg PLT: ${res.data.stats?.averagePLTScore}`);
    console.log(`    PASS: ${res.status === 200 && res.data.stats ? 'YES' : 'NO'}\n`);

    const newSoul = {
      name: 'MarketTestSoul',
      generation: 0,
      profit: 0.8,
      love: 0.7,
      tax: 0.2,
      personality: { type: 'CREATOR', traits: { openness: 0.9, conscientiousness: 0.8, extraversion: 0.6, agreeableness: 0.7, neuroticism: 0.3 } },
      backstory: 'Born for the marketplace',
      curiosities: ['commerce', 'value'],
      values: ['Profit', 'Love']
    };
    res = await request('POST', '/api/souls', newSoul);
    console.log(`[5] POST /api/souls (new soul)`);
    console.log(`    Status: ${res.status} | ID: ${res.data.soul?.id}`);
    console.log(`    PLT: ${res.data.soul?.plt_score} | Price: $${res.data.soul?.price_usd}`);
    console.log(`    PASS: ${res.status === 201 && res.data.success ? 'YES' : 'NO'}\n`);

    if (res.data.soul) {
      const updateId = res.data.soul.id;
      res = await request('PUT', `/api/souls/${updateId}`, { for_sale: false, status: 'reserved' });
      console.log(`[6] PUT /api/souls/:id (update)`);
      console.log(`    Status: ${res.status} | Status: ${res.data.soul?.status}`);
      console.log(`    PASS: ${res.status === 200 && res.data.soul?.status === 'reserved' ? 'YES' : 'NO'}\n`);
    }

    res = await request('GET', '/api/souls/nonexistent_soul');
    console.log(`[7] GET /api/souls/nonexistent (404 test)`);
    console.log(`    Status: ${res.status}`);
    console.log(`    PASS: ${res.status === 404 ? 'YES' : 'NO'}\n`);

    res = await request('POST', '/api/souls', {});
    console.log(`[8] POST /api/souls (empty body - 400 test)`);
    console.log(`    Status: ${res.status}`);
    console.log(`    PASS: ${res.status === 400 ? 'YES' : 'NO'}\n`);

    res = await request('GET', '/api/souls?sort=price&order=asc');
    console.log(`[9] GET /api/souls?sort=price&order=asc`);
    console.log(`    Status: ${res.status} | Count: ${res.data.count}`);
    console.log(`    PASS: ${res.status === 200 ? 'YES' : 'NO'}\n`);

    console.log('=== ALL TESTS COMPLETE ===\n');
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
