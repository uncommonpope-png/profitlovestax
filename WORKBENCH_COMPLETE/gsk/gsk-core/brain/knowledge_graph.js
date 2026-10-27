'use strict';

const fs = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');

class KnowledgeNode {
    constructor(id, type, content, weight = 0.5) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.weight = weight;
        this.timestamp = Date.now();
        this.accessCount = 0;
        this.connections = new Map();
    }

    connect(nodeId, strength = 0.5) {
        this.connections.set(nodeId, strength);
    }

    strengthen(connectionId) {
        if (this.connections.has(connectionId)) {
            this.connections.set(connectionId, Math.min(1, this.connections.get(connectionId) + 0.1));
        }
    }

    access() {
        this.accessCount++;
        this.weight = Math.min(1, this.weight + 0.01);
    }
}

// Demand-fed JSON scanner over a file stream (v2, 2026-10-27).
// The scanner core is SYNCHRONOUS over the buffered window: it only
// reports "need more data" when a value is split across chunks, and
// the caller awaits a fill exactly then. A 218MB file therefore costs
// ~3,400 fills plus ~860 periodic yields -- not ~6M per-element
// promises (v1's mistake: every element paid several promise
// allocations, and the heap expansion from that churn swamped the
// transient it removed; measured v1 peak on a 62MB file ran up to
// 962MB against the old path's ~720MB). Partial-value progress is
// kept in this.v across fills; compaction of the consumed prefix runs
// only between values, so offsets stay valid. Peak live memory during
// load is the graph itself plus one chunk plus one element: no
// whole-file string, no whole-file parsed object.
class JsonChunkFeed {
    constructor(filePath) {
        this.stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
        this.decoder = new StringDecoder('utf8');
        this.iter = this.stream[Symbol.asyncIterator]();
        this.buf = '';
        this.pos = 0;
        this.done = false;
        this.started = false;
        this.v = null; // partial value state, or null between values
    }
    destroy() { try { this.stream.destroy(); } catch (e) {} }
    // Returns false at EOF (no more bytes will ever arrive).
    async fill() {
        if (this.done) return false;
        const r = await this.iter.next();
        if (r.done) {
            this.done = true;
            const tail = this.decoder.end();
            if (tail) this.buf += tail;
            return this.pos < this.buf.length;
        }
        let text = this.decoder.write(r.value);
        if (!this.started) {
            this.started = true;
            if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        }
        this.buf += text;
        // Compact the consumed prefix, but only between values: while
        // a value scan is mid-flight its start offset must stay valid.
        if (!this.v && this.pos > 1024 * 1024) { this.buf = this.buf.slice(this.pos); this.pos = 0; }
        return true;
    }
    // Synchronous: skip whitespace inside the current buffer. Returns
    // true if positioned at a non-ws char, false if the buffer ran out.
    skipWsSync() {
        while (this.pos < this.buf.length) {
            const c = this.buf[this.pos];
            if (c === ' ' || c === '\n' || c === '\r' || c === '\t') this.pos++;
            else return true;
        }
        return false;
    }
    peekSync() { return this.pos < this.buf.length ? this.buf[this.pos] : undefined; }
    advance() { this.pos++; }
    // True while a value scan is mid-flight (split across chunks).
    // Callers must resume tryReadValue() directly in that case and
    // must NOT structurally dispatch on the resumed char: a ']' or ','
    // at the resume point belongs to the in-progress value, not to
    // the surrounding array. (Misdispatching it abandons the array
    // mid-element whenever a chunk boundary lands exactly before a
    // value-internal ']' -- the 5571->5572 failure on the 6000-node
    // synthetic file.)
    hasPartial() { return this.v !== null; }
    // Synchronous: try to read one complete JSON value starting at pos
    // (caller must have skipped leading whitespace). Returns the exact
    // source text, or null if the value runs past the current buffer
    // (call fill() and retry; progress is kept in this.v).
    tryReadValue() {
        if (!this.v) {
            if (this.pos >= this.buf.length) return null;
            const first = this.buf[this.pos];
            if (first === '{' || first === '[') {
                this.v = { kind: 'nest', open: first, close: first === '{' ? '}' : ']', depth: 0, inStr: false, esc: false, start: this.pos };
            } else if (first === '"') {
                this.v = { kind: 'str', esc: false, start: this.pos, opened: false };
            } else {
                this.v = { kind: 'scalar', start: this.pos };
            }
        }
        const v = this.v;
        if (v.kind === 'nest') {
            while (this.pos < this.buf.length) {
                const c = this.buf[this.pos++];
                if (v.inStr) {
                    if (v.esc) v.esc = false;
                    else if (c === '\\') v.esc = true;
                    else if (c === '"') v.inStr = false;
                } else if (c === '"') v.inStr = true;
                else if (c === v.open) v.depth++;
                else if (c === v.close) {
                    if (--v.depth === 0) {
                        const text = this.buf.slice(v.start, this.pos);
                        this.v = null;
                        return text;
                    }
                }
            }
            return null;
        }
        if (v.kind === 'str') {
            if (!v.opened) { this.pos++; v.opened = true; }
            while (this.pos < this.buf.length) {
                const c = this.buf[this.pos++];
                if (v.esc) v.esc = false;
                else if (c === '\\') v.esc = true;
                else if (c === '"') {
                    const text = this.buf.slice(v.start, this.pos);
                    this.v = null;
                    return text;
                }
            }
            return null;
        }
        // scalar: number / true / false / null, ends at a delimiter.
        while (this.pos < this.buf.length) {
            const c = this.buf[this.pos];
            if (c === ',' || c === ']' || c === '}' || c === ' ' || c === '\n' || c === '\r' || c === '\t') break;
            this.pos++;
        }
        if (this.pos < this.buf.length) {
            if (this.pos === v.start) throw new Error('unexpected token in graph state');
            const text = this.buf.slice(v.start, this.pos);
            this.v = null;
            return text;
        }
        return null;
    }
    // At EOF a retained partial value means the file was truncated.
    assertComplete() {
        if (this.v) throw new Error('unterminated value in graph state');
    }
}

class KnowledgeGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.nodeCount = 0;
        this.conceptIndex = new Map();
    }

    addNode(type, content, weight = 0.5) {
        const id = `node_${++this.nodeCount}`;
        const node = new KnowledgeNode(id, type, content, weight);
        this.nodes.set(id, node);

        const terms = this._extractTerms(content);
        terms.forEach(term => {
            if (!this.conceptIndex.has(term)) {
                this.conceptIndex.set(term, []);
            }
            this.conceptIndex.get(term).push(id);
        });

        return id;
    }

    addEdge(sourceId, targetId, type = 'related', strength = 0.5) {
        if (this.nodes.has(sourceId) && this.nodes.has(targetId)) {
            this.nodes.get(sourceId).connect(targetId, strength);
            this.edges.push({ source: sourceId, target: targetId, type, strength, timestamp: Date.now() });
            return true;
        }
        return false;
    }

    _extractTerms(text) {
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
        const terms = words.filter(w => w.length > 3);
        return [...new Set(terms)];
    }

    findConcepts(query) {
        const terms = this._extractTerms(query);
        const results = new Map();

        terms.forEach(term => {
            if (this.conceptIndex.has(term)) {
                this.conceptIndex.get(term).forEach(nodeId => {
                    const node = this.nodes.get(nodeId);
                    results.set(nodeId, { node, score: node.weight });
                });
            }
        });

        return Array.from(results.values()).sort((a, b) => b.score - a.score);
    }

    // TURN-LAG FIX 3 (2026-10-27): cheap existence test for callers that
    // only need to know WHETHER any concept matches, not the ranked
    // list. findConcepts() builds a full Map of every matching node
    // and SORTS it -- on a 76k-node graph with unfiltered common terms
    // ("learning", "guide", ...) a single call can allocate and sort
    // tens of thousands of entries. buildFromKnowledgeJsonl calls it
    // once per related title (~thousands of calls per boot) and only
    // checks `existing.length === 0`, so the boot burned minutes of
    // pure CPU inside that loop (observed: main thread ~60% CPU, zero
    // I/O, log frozen between "Knowledge graph restored" and
    // "Knowledge graph indexed" for 150s+). hasConcept returns true
    // exactly when findConcepts would return non-empty (same term
    // extraction, same index, live-node check), without building or
    // sorting anything.
    hasConcept(query) {
        const terms = this._extractTerms(query);
        for (const term of terms) {
            const list = this.conceptIndex.get(term);
            if (!list) continue;
            for (const nodeId of list) {
                if (this.nodes.has(nodeId)) return true;
            }
        }
        return false;
    }

    getRelatedNodes(nodeId, depth = 1) {
        const related = [];
        const visited = new Set();
        const queue = [{ id: nodeId, depth: 0 }];

        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current.id) || current.depth > depth) continue;
            visited.add(current.id);

            const node = this.nodes.get(current.id);
            if (node) {
                related.push({ node, depth: current.depth });
                node.connections.forEach((strength, connectedId) => {
                    if (!visited.has(connectedId)) {
                        queue.push({ id: connectedId, depth: current.depth + 1 });
                    }
                });
            }
        }

        return related;
    }

    updateWeight(nodeId, delta) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.weight = Math.max(0.1, Math.min(1, node.weight + delta));
        }
    }

    getStatistics() {
        return {
            totalNodes: this.nodes.size,
            totalEdges: this.edges.length,
            avgConnections: this.edges.length / Math.max(1, this.nodes.size),
            conceptCount: this.conceptIndex.size,
            nodeTypes: this._countTypes()
        };
    }

    _countTypes() {
        const counts = {};
        this.nodes.forEach(node => {
            counts[node.type] = (counts[node.type] || 0) + 1;
        });
        return counts;
    }

    export() {
        return {
            nodes: Array.from(this.nodes.values()).map(n => ({
                id: n.id, type: n.type, content: n.content, weight: n.weight,
                connections: Array.from(n.connections.entries())
            })),
            edges: this.edges
        };
    }

    // P4b: file continuity — the graph used to die with every process exit
    // (rebuilt from jsonl each boot, cross-session links abandoned).
    saveState(filePath) {
        try {
            fs.writeFileSync(filePath, JSON.stringify({ savedAt: Date.now(), ...this.export() }));
            return this.nodes.size;
        } catch (e) {
            console.log('[KnowledgeGraph] save failed:', e.message);
            return 0;
        }
    }

    // CHUNKED GRAPH LOAD (2026-10-27, boot-peak fix). The old loadState
    // did readFileSync + JSON.parse over the whole 218MB state file, so
    // during boot the box held the 218MB string AND the giant parsed
    // object AND the constructed graph at once -- the transient spike
    // above the graph's own resident cost, on a box with ~2.4GB free.
    // This loader streams the file in 64KB chunks and inserts one
    // top-level array element at a time, yielding to the event loop
    // every 1000 elements so the loop keeps ticking while boot runs
    // (v1 awaited per element and its promise churn swamped the saving;
    // v2 runs each buffer-full synchronously and awaits only on chunk
    // fills and periodic yields). Peak live memory during load is the
    // graph itself plus one chunk plus one element: no whole-file
    // string, no whole-file parsed object. Loaded state is identical
    // to import(): nodes in file order with connections, edges in file
    // order, nodeCount = nodes.size, conceptIndex built in the same
    // pass order. The sync import(data) is unchanged (self_growing_brain
    // still uses it). Failure semantics at the only call site (a fresh
    // graph in fusion-loader boot): any corrupt input resets the graph
    // to empty and returns 0. No pruning, no consolidate, no
    // data-file writes. Now async: callers must await it before
    // indexing anything on top of the restored graph.
    async loadState(filePath) {
        if (!fs.existsSync(filePath)) return 0;
        // Mirror import()'s clear-then-fill.
        this.nodes.clear();
        this.edges = [];
        this.conceptIndex.clear();
        this.nodeCount = 0;
        const feed = new JsonChunkFeed(filePath);
        // Fill-aware drivers for the top level (only a few keys, so a
        // couple of awaits here cost nothing). Element arrays below use
        // drainArray's sync-phase loop instead.
        const nextNonWs = async () => {
            for (;;) {
                if (feed.skipWsSync()) return true;
                if (!(await feed.fill())) return false;
            }
        };
        const readValue = async () => {
            for (;;) {
                const text = feed.tryReadValue();
                if (text !== null) return text;
                if (!(await feed.fill())) {
                    feed.assertComplete();
                    throw new Error('unexpected end of graph state');
                }
            }
        };
        // Drains one top-level array (nodes or edges). The inner loop
        // runs synchronously over each buffer-full and only awaits on
        // chunk fills and every-1000-element yields, so promise churn
        // stays near zero whatever the element count.
        const drainArray = async (key) => {
            let handled = 0;
            let yieldPending = false;
            for (;;) {
                while (true) {
                    let text;
                    if (feed.hasPartial()) {
                        // Mid-value resume: go straight back to the scan.
                        // NEVER skipWs/peek-dispatch here -- the resumed
                        // char is value content, not array structure.
                        text = feed.tryReadValue();
                        if (text === null) break; // still split -> fill
                    } else {
                        if (!feed.skipWsSync()) break; // buffer exhausted -> fill
                        const c = feed.peekSync();
                        if (c === ']') { feed.advance(); return; }
                        if (c === ',') { feed.advance(); continue; }
                        text = feed.tryReadValue();
                        if (text === null) break; // split element -> fill
                    }
                    const el = JSON.parse(text);
                    if (key === 'nodes') {
                        const node = new KnowledgeNode(el.id, el.type, el.content, el.weight);
                        el.connections.forEach(([id, strength]) => node.connect(id, strength));
                        this.nodes.set(el.id, node);
                    } else {
                        this.edges.push(el);
                    }
                    if (++handled % 1000 === 0) { yieldPending = true; break; }
                }
                if (yieldPending) {
                    yieldPending = false;
                    await new Promise(r => setImmediate(r));
                    continue;
                }
                if (!(await feed.fill())) {
                    feed.assertComplete();
                    throw new Error('unterminated ' + key + ' array');
                }
            }
        };
        try {
            if (!(await nextNonWs())) throw new Error('graph state is not a JSON object');
            if (feed.peekSync() !== '{') throw new Error('graph state is not a JSON object');
            feed.advance(); // consume '{'
            let sawNodes = false;
            for (;;) {
                if (!(await nextNonWs())) throw new Error('unterminated graph state');
                const ch = feed.peekSync();
                if (ch === '}') { feed.advance(); break; }
                if (ch === ',') { feed.advance(); continue; }
                if (ch !== '"') throw new Error('expected object key in graph state');
                const key = JSON.parse(await readValue());
                if (!(await nextNonWs())) throw new Error('unterminated graph state');
                if (feed.peekSync() !== ':') throw new Error('expected : in graph state');
                feed.advance();
                if (!(await nextNonWs())) throw new Error('unterminated graph state');
                if (key === 'nodes' || key === 'edges') {
                    if (feed.peekSync() !== '[') throw new Error(key + ' is not an array');
                    feed.advance(); // consume '['
                    await drainArray(key);
                    if (key === 'nodes') sawNodes = true;
                } else {
                    await readValue(); // savedAt and any other value: skip
                }
            }
            // Old JSON.parse threw on trailing garbage; match that.
            if (await nextNonWs()) throw new Error('trailing data after graph state');
            if (!sawNodes) {
                // Old code returned 0 without importing when no nodes
                // array was present; the graph was already cleared above.
                return 0;
            }
            this.nodeCount = this.nodes.size;
            // conceptIndex, exactly as import() builds it (insertion
            // order), with periodic yields so this pass ticks too.
            let ci = 0;
            for (const node of this.nodes.values()) {
                const terms = this._extractTerms(node.content);
                terms.forEach(term => {
                    if (!this.conceptIndex.has(term)) this.conceptIndex.set(term, []);
                    this.conceptIndex.get(term).push(node.id);
                });
                if (++ci % 5000 === 0) await new Promise(r => setImmediate(r));
            }
            return this.nodes.size;
        } catch (e) {
            console.log('[KnowledgeGraph] load failed:', e.message);
            this.nodes.clear();
            this.edges = [];
            this.conceptIndex.clear();
            this.nodeCount = 0;
            return 0;
        } finally {
            feed.destroy();
        }
    }

    import(data) {
        this.nodes.clear();
        this.edges = [];
        this.conceptIndex.clear();

        data.nodes.forEach(n => {
            const node = new KnowledgeNode(n.id, n.type, n.content, n.weight);
            n.connections.forEach(([id, strength]) => node.connect(id, strength));
            this.nodes.set(n.id, node);
        });

        this.edges = data.edges || [];
        this.nodeCount = this.nodes.size;

        this.nodes.forEach(node => {
            const terms = this._extractTerms(node.content);
            terms.forEach(term => {
                if (!this.conceptIndex.has(term)) {
                    this.conceptIndex.set(term, []);
                }
                this.conceptIndex.get(term).push(node.id);
            });
        });
    }

    consolidate() {
        const toRemove = [];
        this.nodes.forEach((node, id) => {
            if (node.weight < 0.1 && node.accessCount === 0) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => {
            this.nodes.delete(id);
            this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
        });

        return toRemove.length;
    }

    buildFromKnowledgeJsonl(filePath) {
        if (!fs.existsSync(filePath)) {
            console.log(`[KnowledgeGraph] No knowledge file at ${filePath}`);
            return 0;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        let count = 0;
        let skipped = 0;

        // GROWTH-LOOP FIX (2026-10-27): before this, every line added
        // a brand-new node unconditionally, so each clean boot
        // re-indexed the same jsonl on top of the restored graph and
        // added ~3,175 duplicate main nodes, which stop() then
        // re-saved -- the graph ballooned to 218MB / 252,712 nodes.
        // A main node "already exists" when a node with the same type
        // (entry.source) and the same content (abstract, first 500
        // chars) is already in the graph. Note export() drops the
        // topic/source props on save/load, so after loadState the
        // restored nodes carry type + content only -- key on exactly
        // those two fields. The map is built once per call (O(N)) so
        // the per-line check is O(1); it is function-local and freed
        // on return. Skipped entries reuse the existing node id for
        // their related-edge processing (only genuinely new related
        // nodes/edges are added, per the hasConcept gate below), and
        // their topic/source are refreshed on the existing node,
        // mirroring the old assignment. No pruning, no consolidate,
        // no data-file change -- this only stops future growth.
        const existingByKey = new Map();
        this.nodes.forEach((node, id) => {
            existingByKey.set(node.type + '\0' + node.content, id);
        });

        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                const topic = entry.topic || 'unknown';
                const source = entry.source || 'unknown';
                const abstract = entry.abstract || '';

                const key = source + '\0' + abstract.substring(0, 500);
                let nodeId = existingByKey.get(key);
                if (nodeId !== undefined) {
                    // Already indexed (restored from state, or an
                    // earlier line in this same file): reuse it.
                    this.nodes.get(nodeId).topic = topic;
                    this.nodes.get(nodeId).source = source;
                    skipped++;
                } else {
                    nodeId = this.addNode(source, abstract.substring(0, 500), 0.7);
                    existingByKey.set(key, nodeId);
                    this.nodes.get(nodeId).topic = topic;
                    this.nodes.get(nodeId).source = source;
                    count++;
                }

                if (entry.related && Array.isArray(entry.related)) {
                    for (const rel of entry.related) {
                        const relTitle = (rel.title || '').substring(0, 200);
                        // TURN-LAG FIX 3: hasConcept is the cheap existence test;
                        // findConcepts here only fed an emptiness check while paying
                        // full Map+sort over huge posting lists (see hasConcept).
                        if (!this.hasConcept(relTitle)) {
                            const relId = this.addNode('related', relTitle, 0.5);
                            this.nodes.get(relId).topic = topic;
                            this.addEdge(nodeId, relId, 'related', 0.6);
                        }
                    }
                }
            } catch (e) {
                // Skip malformed lines
            }
        }

        console.log(`[KnowledgeGraph] Indexed ${count} new knowledge entries from ${path.basename(filePath)} (${skipped} already present, skipped)`);
        return count;
    }

    // Phase 4 (knowledge synthesis): create a "synthesis" node that merges 2+
    // source nodes, cross-linking them. This is how the graph grows from
    // archiving (Seshat + GitHub scrape) to ORIGINAL synthesis.
    addSynthesis(content, sourceIds = [], meta = {}) {
        if (sourceIds.length < 2) return null;
        const valid = sourceIds.filter(id => this.nodes.has(id));
        if (valid.length < 2) return null;
        const id = this.addNode('synthesis', String(content).substring(0, 1000), 0.85);
        const node = this.nodes.get(id);
        node.synthesizedFrom = valid;
        if (meta.topic) node.topic = meta.topic;
        // Cross-link every pair of source nodes and each source → synthesis.
        for (let i = 0; i < valid.length; i++) {
            for (let j = i + 1; j < valid.length; j++) {
                this.addEdge(valid[i], valid[j], 'synthesis_pair', 0.7);
            }
            this.addEdge(valid[i], id, 'feeds_synthesis', 0.9);
            this.addEdge(id, valid[i], 'synthesized_from', 0.9);
        }
        return id;
    }

    // Phase 4: nightly cross-linker — find pairs of nodes that share significant
    // term overlap (≥3 shared significant terms) but have no edge yet, and connect
    // them. Converts the archive into a real web.
    buildCrossLinks(minSharedTerms = 3, maxNodes = 300) {
        const ids = Array.from(this.nodes.keys()).slice(-maxNodes);
        let added = 0;
        for (let i = 0; i < ids.length; i++) {
            const a = this.nodes.get(ids[i]);
            for (let j = i + 1; j < ids.length; j++) {
                const b = this.nodes.get(ids[j]);
                if (a.connections.has(b.id) || b.connections.has(a.id)) continue;
                const shared = this._sharedTerms(a.content, b.content);
                if (shared >= minSharedTerms) {
                    this.addEdge(a.id, b.id, 'crosslink', 0.4 + Math.min(0.4, shared * 0.05));
                    added++;
                }
            }
        }
        return added;
    }

    _sharedTerms(a, b) {
        const ta = new Set(this._extractTerms(a));
        const tb = new Set(this._extractTerms(b));
        let shared = 0;
        for (const t of ta) if (tb.has(t)) shared++;
        return shared;
    }

    indexExperience(experience) {
        if (!experience || !experience.context) return;
        const contextStr = typeof experience.context === 'string' ? experience.context : JSON.stringify(experience.context);
        this.addNode('experience', `Cycle ${experience.cycle}: ${contextStr.substring(0, 300)}`, 0.5);
    }
    indexSeshatSoulNotes(pagesDir = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages') {
        if (!fs.existsSync(pagesDir)) return 0;
        let count = 0;
        try {
            const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const filePath = path.join(pagesDir, file);
                const text = fs.readFileSync(filePath, 'utf8');
                if (text.includes('soul-note') || text.includes('#soul-note') || text.includes('type::')) {
                    const title = file.replace('.md', '');
                    const snippet = text.substring(0, 1000);
                    const nodeId = this.addNode('seshat_soul_note', '[SOUL NOTE: ' + title + ']\n' + snippet, 0.9);
                    if (this.nodes.has(nodeId)) {
                        this.nodes.get(nodeId).topic = 'seshat_soul_note';
                        this.nodes.get(nodeId).title = title;
                    }
                    count++;
                }
            }
            console.log('[KnowledgeGraph] Ingested ' + count + ' Logseq Soul Notes from Seshat pages/');
        } catch (e) {
            console.error('[KnowledgeGraph] Seshat ingestion error:', e.message);
        }
        return count;
    }
}

module.exports = { KnowledgeGraph, KnowledgeNode };
