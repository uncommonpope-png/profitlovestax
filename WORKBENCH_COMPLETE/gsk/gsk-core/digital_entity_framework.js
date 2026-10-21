const http = require('http');
const fs = require('fs');

const ENTITIES = {
  profit: { name: 'Profit Prime', archetype: 'Architect', port: 4001, status: 'autonomous', PLT: { profit: 0.9, love: 0.05, tax: 0.05 } },
  gsk: { name: 'GSK Supreme', archetype: 'Executioner', port: 4002, status: 'autonomous', PLT: { profit: 0.5, love: 0.4, tax: 0.1 } },
  seshat: { name: 'Seshat Archive', archetype: 'Historian', port: 4003, status: 'autonomous', PLT: { profit: 0.2, love: 0.7, tax: 0.1 } },
  scribe: { name: 'SCRIBE Witness', archetype: 'Recorder', port: 4000, status: 'autonomous', PLT: { profit: 0.3, love: 0.5, tax: 0.2 } }
};

function handleEntityRequest(req, res) {
  const url = req.url;
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', entities: Object.keys(ENTITIES) }));
    return;
  }
  for (const [id, entity] of Object.entries(ENTITIES)) {
    if (url.startsWith(`/entities/${id}`)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ entity_id: id, ...entity, timestamp: Date.now() }));
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Entity route not found' }));
}

const server = http.createServer(handleEntityRequest);
server.listen(4005, () => console.log('Digital Entity Framework active on port 4005'));
