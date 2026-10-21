#!/usr/bin/env python3
"""Scrapling Bitcoinbook Crawler with Cross-Encoder Reranking.

Crawls bitcoinbook chapters from GitHub, indexes them into chunks,
and provides semantic search with cross-encoder reranking.

Family knowledge topics connected:
  1. Scrapling (web crawling)
  2. Bitcoinbook (crypto/finance knowledge)
  3. Cross-encoder reranking (AI/ML retrieval)

Requires: pip install scrapling sentence-transformers torch
"""

import json
import hashlib
import os
import re
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('bitcoinbook_crawler')

# --- Constants ---
BITCOINBOOK_BASE = 'https://raw.githubusercontent.com/bitcoinbook/bitcoinbook/develop'
CHAPTER_FILES = [
    'ch01_intro.asciidoc',
    'ch02_bitcoin-overview.asciidoc',
    'ch03_bitcoin-core.asciidoc',
    'ch04_keys.asciidoc',
    'ch05_wallets.asciidoc',
    'ch06_transactions.asciidoc',
    'ch07_authorization-authentication.asciidoc',
    'ch08_signatures.asciidoc',
    'ch09_fees.asciidoc',
    'ch10_network.asciidoc',
    'ch11_blockchain.asciidoc',
    'ch12_mining.asciidoc',
    'ch13_security.asciidoc',
    'ch14_applications.asciidoc',
]
CHUNK_SIZE = 512  # tokens approx (chars / 4)
CHUNK_OVERLAP = 64
INDEX_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'bitcoinbook_index.json')
CROSS_ENCODER_MODEL = 'cross-encoder/ms-marco-MiniLM-L-6-v2'


@dataclass
class Chunk:
    id: str
    chapter: str
    section: str
    text: str
    char_start: int
    char_end: int
    url: str
    crawled_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def chunk_text(text: str, chapter: str, url: str, chunk_chars: int = 2048, overlap_chars: int = 256) -> List[Chunk]:
    """Split text into overlapping chunks, preserving section headers."""
    chunks = []
    current_section = 'Introduction'
    lines = text.split('\n')
    buffer = []
    buf_start = 0
    char_pos = 0

    for line in lines:
        # Detect asciidoc section headers
        header_match = re.match(r'^(={2,5})\s+(.+)', line)
        if header_match:
            current_section = header_match.group(2).strip()

        buffer.append(line)
        char_pos += len(line) + 1  # +1 for newline

        if char_pos - buf_start >= chunk_chars:
            chunk_text_str = '\n'.join(buffer)
            chunk_id = hashlib.sha256(f'{chapter}:{buf_start}:{chunk_text_str[:100]}'.encode()).hexdigest()[:16]
            chunks.append(Chunk(
                id=chunk_id,
                chapter=chapter,
                section=current_section,
                text=chunk_text_str,
                char_start=buf_start,
                char_end=char_pos,
                url=url
            ))
            # Keep overlap
            overlap_lines = []
            overlap_len = 0
            for bl in reversed(buffer):
                overlap_lines.insert(0, bl)
                overlap_len += len(bl) + 1
                if overlap_len >= overlap_chars:
                    break
            buffer = overlap_lines
            buf_start = char_pos - overlap_len

    # Flush remaining
    if buffer:
        chunk_text_str = '\n'.join(buffer)
        chunk_id = hashlib.sha256(f'{chapter}:{buf_start}:{chunk_text_str[:100]}'.encode()).hexdigest()[:16]
        chunks.append(Chunk(
            id=chunk_id,
            chapter=chapter,
            section=current_section,
            text=chunk_text_str,
            char_start=buf_start,
            char_end=char_pos,
            url=url
        ))
    return chunks


def crawl_chapters(chapter_files: Optional[List[str]] = None) -> List[Chunk]:
    """Crawl bitcoinbook chapters using Scrapling and chunk them."""
    try:
        from scrapling import Fetcher
        fetcher = Fetcher()
    except ImportError:
        log.warning('Scrapling not installed — falling back to urllib')
        fetcher = None

    if chapter_files is None:
        chapter_files = CHAPTER_FILES

    all_chunks = []
    for ch_file in chapter_files:
        url = f'{BITCOINBOOK_BASE}/{ch_file}'
        log.info(f'Crawling: {url}')
        try:
            if fetcher:
                response = fetcher.get(url)
                text = response.text if hasattr(response, 'text') else str(response)
            else:
                import urllib.request
                with urllib.request.urlopen(url) as resp:
                    text = resp.read().decode('utf-8')

            chapter_name = ch_file.replace('.asciidoc', '')
            chunks = chunk_text(text, chapter_name, url)
            all_chunks.extend(chunks)
            log.info(f'  → {len(chunks)} chunks from {chapter_name}')
        except Exception as e:
            log.error(f'  ✗ Failed to crawl {ch_file}: {e}')

    return all_chunks


def save_index(chunks: List[Chunk], path: Optional[str] = None):
    """Persist chunk index to JSON."""
    path = path or INDEX_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = {
        'version': '1.0.0',
        'created_at': datetime.now(timezone.utc).isoformat(),
        'total_chunks': len(chunks),
        'chapters': list(set(c.chapter for c in chunks)),
        'chunks': [asdict(c) for c in chunks]
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    log.info(f'Index saved: {path} ({len(chunks)} chunks)')
    return path


def load_index(path: Optional[str] = None) -> List[Chunk]:
    """Load chunk index from JSON."""
    path = path or INDEX_PATH
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [Chunk(**c) for c in data['chunks']]


def rerank_with_cross_encoder(query: str, chunks: List[Chunk], top_k: int = 5) -> List[dict]:
    """Rerank chunks using a cross-encoder model for precise relevance scoring."""
    try:
        from sentence_transformers import CrossEncoder
    except ImportError:
        log.error('sentence-transformers not installed. pip install sentence-transformers')
        # Fallback: simple keyword overlap scoring
        return _keyword_fallback(query, chunks, top_k)

    log.info(f'Loading cross-encoder: {CROSS_ENCODER_MODEL}')
    model = CrossEncoder(CROSS_ENCODER_MODEL)

    pairs = [[query, c.text[:1000]] for c in chunks]  # Truncate for speed
    scores = model.predict(pairs)

    scored = []
    for i, (chunk, score) in enumerate(zip(chunks, scores)):
        scored.append({
            'rank': 0,
            'score': float(score),
            'chunk_id': chunk.id,
            'chapter': chunk.chapter,
            'section': chunk.section,
            'text_preview': chunk.text[:300],
            'url': chunk.url
        })

    scored.sort(key=lambda x: x['score'], reverse=True)
    for i, s in enumerate(scored[:top_k]):
        s['rank'] = i + 1

    return scored[:top_k]


def _keyword_fallback(query: str, chunks: List[Chunk], top_k: int) -> List[dict]:
    """Simple keyword overlap fallback when cross-encoder is unavailable."""
    query_terms = set(query.lower().split())
    scored = []
    for chunk in chunks:
        text_lower = chunk.text.lower()
        overlap = sum(1 for t in query_terms if t in text_lower)
        scored.append({
            'rank': 0,
            'score': overlap / max(len(query_terms), 1),
            'chunk_id': chunk.id,
            'chapter': chunk.chapter,
            'section': chunk.section,
            'text_preview': chunk.text[:300],
            'url': chunk.url
        })
    scored.sort(key=lambda x: x['score'], reverse=True)
    for i, s in enumerate(scored[:top_k]):
        s['rank'] = i + 1
    return scored[:top_k]


def search(query: str, index_path: Optional[str] = None, top_k: int = 5) -> List[dict]:
    """Full pipeline: load index → rerank → return top results."""
    chunks = load_index(index_path)
    log.info(f'Searching {len(chunks)} chunks for: "{query}"')
    results = rerank_with_cross_encoder(query, chunks, top_k)
    return results


# --- CLI Interface ---
if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Usage:')
        print('  python scrapling_bitcoinbook_crawler.py crawl   — Crawl and index chapters')
        print('  python scrapling_bitcoinbook_crawler.py search "your query"  — Search with reranking')
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == 'crawl':
        chunks = crawl_chapters()
        save_index(chunks)
        print(f'\n✓ Indexed {len(chunks)} chunks from {len(CHAPTER_FILES)} chapters.')
    elif cmd == 'search':
        query = ' '.join(sys.argv[2:]) if len(sys.argv) > 2 else 'How does Bitcoin mining work?'
        results = search(query)
        print(f'\n=== Top {len(results)} results for: "{query}" ===\n')
        for r in results:
            print(f"  #{r['rank']} [{r['score']:.4f}] {r['chapter']} / {r['section']}")
            print(f"    {r['text_preview'][:120]}...")
            print()
    else:
        print(f'Unknown command: {cmd}')
