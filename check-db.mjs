import { Database } from 'node:sqlite';
import { homedir } from 'node:os';
import path from 'node:path';

const dbPath = path.join(homedir(), '.omniroute', 'storage.sqlite');
console.log('DB path:', dbPath);

const db = Database.open(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

try {
  const keys = db.prepare('SELECT * FROM api_keys').all();
  console.log('\n=== API KEYS ===');
  keys.forEach(k => console.log(JSON.stringify(k)));
} catch(e) { console.log('api_keys:', e.message); }

try {
  const settings = db.prepare('SELECT * FROM settings LIMIT 1').all();
  console.log('\n=== SETTINGS ===');
  settings.forEach(s => console.log(JSON.stringify(s)));
} catch(e) { console.log('settings:', e.message); }

try {
  const kvs = db.prepare('SELECT * FROM key_value').all();
  console.log('\n=== KEY VALUE (all) ===');
  kvs.forEach(k => console.log(JSON.stringify(k)));
} catch(e) { console.log('key_value:', e.message); }

db.close();
