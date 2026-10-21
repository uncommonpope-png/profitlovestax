import logging
from pathlib import Path
from one_soul.profit.muscles.registry import Skill

logger = logging.getLogger("NotebookIntelSkill")

class NotebookIntelSkill(Skill):
    name = "notebook_intel"
    description = "Notebook-style context management: chunks and analyzes massive documents for deep reasoning."

    async def execute(self, query: str, document_path: str = "THE-PROFIT-BIBLE.md", master=None) -> str:
        logger.info(f"📓 Deep Reasoning with Notebook Intelligence on {document_path}...")

        path = Path(document_path)
        if not path.exists():
            return f"Error: Document {document_path} not found."

        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            # Simplified chunking/searching for Notebook-style reasoning
            # In a full implementation, we'd use a vector search or high-context LLM window

            relevant_chunks = []
            paragraphs = content.split("\n\n")
            for p in paragraphs:
                if any(word.lower() in p.lower() for word in query.split()):
                    relevant_chunks.append(p)

            if not relevant_chunks:
                return "Notebook Intel: No relevant context found in document."

            context = "\n---\n".join(relevant_chunks[:5]) # Top 5 chunks

            if master:
                # Ask Ollama to reason based on the chunked context
                prompt = f"Based on this SACRED CONTEXT from {document_path}, answer the query: {query}\n\nCONTEXT:\n{context}"
                answer = await master.skills.run_skill("ollama_thought", prompt=prompt, task_type="deep")
                return f"Notebook Analysis:\n{answer}"

            return f"Retrieved Context:\n{context}"

        except Exception as e:
            logger.error(f"Notebook Intel failed: {e}")
            return f"Error: {e}"
