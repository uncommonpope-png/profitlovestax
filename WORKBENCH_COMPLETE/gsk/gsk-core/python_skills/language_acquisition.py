"""
language_acquisition.py — Language Innateness & Learning

Computational model of Chomskyan Universal Grammar (principles & parameters)
combined with statistical learning (distributional pattern extraction).

Modules:
  - Grammar induction: constituency detection from n-gram patterns
  - Vocabulary building: word segmentation, referent mapping
  - Parameter setting: binary switches for head-direction, pro-drop, etc.
  - Pattern extraction: n-gram frequency analysis over input corpus
  - Utterance generation: produce novel sentences from learned grammar
"""

import sys
import json
import numpy as np
import math
import uuid
from collections import defaultdict, Counter
from dataclasses import dataclass, field


@dataclass
class GrammaticalRule:
    pattern: tuple
    frequency: int = 1
    is_constituent: bool = False
    rule_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])


@dataclass
class LexicalEntry:
    word: str
    pos: str = "unknown"
    frequency: int = 1
    embedding: np.ndarray = field(default_factory=lambda: np.zeros(8))

    def __post_init__(self):
        if isinstance(self.embedding, list):
            self.embedding = np.array(self.embedding, dtype=np.float64)


class LanguageAcquisition:
    """Language learning engine combining Universal Grammar and statistics."""

    def __init__(self, embedding_dims: int = 8):
        self.embedding_dims = embedding_dims
        self.lexicon: dict[str, LexicalEntry] = {}
        self.ngram_counts: dict[int, Counter] = defaultdict(Counter)
        self.rules: list[GrammaticalRule] = []
        self.constituents: list[tuple] = []
        self.corpus: list[str] = []

        self.parameters = {
            "head_direction": "initial",  # 'initial' or 'final'
            "pro_drop": False,
            "subject_verb_order": "SVO",
            "noun_modifier_order": "N-A",  # N-A or A-N
            "wh_movement": True,
            "case_system": "nominative",
        }

        self.pos_tags = {
            "the": "DET", "a": "DET", "an": "DET",
            "cat": "N", "dog": "N", "man": "N", "woman": "N",
            "ball": "N", "car": "N", "book": "N", "soul": "N",
            "runs": "V", "walks": "V", "sees": "V", "likes": "V",
            "chases": "V", "thinks": "V", "knows": "V",
            "big": "ADJ", "small": "ADJ", "red": "ADJ", "blue": "ADJ",
            "happy": "ADJ", "sad": "ADJ",
            "quickly": "ADV", "slowly": "ADV",
            "and": "CONJ", "or": "CONJ",
            "in": "PREP", "on": "PREP",
        }

        self.rng = np.random.RandomState(42)

    def _tokenize(self, utterance: str) -> list[str]:
        return utterance.lower().replace(".", "").replace(",", "").replace("?", "").replace("!", "").split()

    def _get_embedding(self, word: str) -> np.ndarray:
        if word in self.lexicon:
            return self.lexicon[word].embedding
        emb = self.rng.randn(self.embedding_dims) * 0.1
        tag = self.pos_tags.get(word, "UNK")
        self.lexicon[word] = LexicalEntry(word, tag, embedding=emb)
        return emb

    def process_utterance(self, utterance: str) -> dict:
        """Process a single utterance: tokenize, update lexicon, extract n-grams."""
        tokens = self._tokenize(utterance)
        if not tokens:
            return {"tokens": [], "utterance": utterance, "new_words": 0}

        self.corpus.append(utterance)
        new_words = 0
        for token in tokens:
            if token not in self.lexicon:
                self._get_embedding(token)
                new_words += 1
            else:
                self.lexicon[token].frequency += 1

        for n in range(1, min(len(tokens) + 1, 5)):
            for i in range(len(tokens) - n + 1):
                gram = tuple(tokens[i:i + n])
                self.ngram_counts[n][gram] += 1

        result = {
            "tokens": tokens,
            "utterance": utterance,
            "new_words": new_words,
            "vocabulary_size": len(self.lexicon),
        }
        return result

    def extract_patterns(self, corpus: list[str]) -> dict:
        """Process a full corpus and extract grammatical patterns.

        Discovers:
          - Frequent n-grams (potential constituents)
          - Reordering patterns (parameter evidence)
          - Distributional patterns (co-occurrence statistics)
        """
        for utterance in corpus:
            self.process_utterance(utterance)

        constituent_candidates = []
        for n in [2, 3]:
            total = sum(self.ngram_counts[n].values())
            for gram, count in self.ngram_counts[n].most_common(20):
                freq_ratio = count / max(total, 1)
                if freq_ratio > 0.02:
                    rule = GrammaticalRule(
                        pattern=gram,
                        frequency=count,
                        is_constituent=freq_ratio > 0.05,
                    )
                    self.rules.append(rule)
                    if rule.is_constituent:
                        constituent_candidates.append(gram)
                        if gram not in self.constituents:
                            self.constituents.append(gram)

        self._infer_parameters()

        return {
            "corpus_size": len(self.corpus),
            "vocabulary_size": len(self.lexicon),
            "rules_discovered": len(self.rules),
            "constituents_found": len(self.constituents),
            "parameters": dict(self.parameters),
                "top_bigrams": {" ".join(k): v for k, v in self.ngram_counts[2].most_common(10)},
                "top_trigrams": {" ".join(k): v for k, v in self.ngram_counts[3].most_common(10)},
        }

    def _infer_parameters(self):
        """Set Universal Grammar parameters based on corpus statistics."""
        bigrams = self.ngram_counts[2]

        head_initial_score = 0
        head_final_score = 0
        for (w1, w2), count in bigrams.items():
            tag1 = self.pos_tags.get(w1, "UNK")
            tag2 = self.pos_tags.get(w2, "UNK")
            if tag1 == "PREP" and tag2 == "N":
                head_initial_score += count
            if tag1 == "N" and tag2 == "PREP":
                head_final_score += count

        self.parameters["head_direction"] = "initial" if head_initial_score >= head_final_score else "final"

        det_n_count = sum(c for (w1, w2), c in bigrams.items()
                          if self.pos_tags.get(w1) == "DET" and self.pos_tags.get(w2) == "N")
        n_det_count = sum(c for (w1, w2), c in bigrams.items()
                          if self.pos_tags.get(w1) == "N" and self.pos_tags.get(w2) == "DET")
        if det_n_count > n_det_count:
            self.parameters["noun_modifier_order"] = "DET-N"
        else:
            self.parameters["noun_modifier_order"] = "N-DET"

        n_adj_count = sum(c for (w1, w2), c in bigrams.items()
                          if self.pos_tags.get(w1) == "N" and self.pos_tags.get(w2) == "ADJ")
        adj_n_count = sum(c for (w1, w2), c in bigrams.items()
                          if self.pos_tags.get(w1) == "ADJ" and self.pos_tags.get(w2) == "N")
        if adj_n_count >= n_adj_count:
            self.parameters["noun_modifier_order"] = "A-N"
        else:
            self.parameters["noun_modifier_order"] = "N-A"

        verb_positions = []
        for utt in self.corpus:
            tokens = self._tokenize(utt)
            for i, tok in enumerate(tokens):
                if self.pos_tags.get(tok) == "V" and i > 0:
                    verb_positions.append(i)
        avg_pos = np.mean(verb_positions) if verb_positions else 1.0
        self.parameters["subject_verb_order"] = "SVO" if avg_pos <= 1.5 else "SOV"

        pronominal_subjects = sum(
            1 for w in self.lexicon
            if w in ("i", "you", "he", "she", "it", "we", "they")
        )
        self.parameters["pro_drop"] = pronominal_subjects < 3

    def generalize_rule(self, examples: list[str]) -> dict:
        """Generalize a grammatical rule from example sentences.

        Extracts common pattern across examples and creates a generative rule.
        """
        token_sets = [self._tokenize(ex) for ex in examples]
        if not token_sets:
            return {"generalized_rule": None, "confidence": 0}

        min_len = min(len(t) for t in token_sets)
        common_pos = []
        for i in range(min_len):
            pos_tags_at_i = [self.pos_tags.get(t[i], "UNK") for t in token_sets]
            most_common = Counter(pos_tags_at_i).most_common(1)[0]
            if most_common[1] / len(token_sets) > 0.5:
                common_pos.append(most_common[0])
            else:
                common_pos.append("X")

        if set(common_pos) == {"X"}:
            return {"generalized_rule": None, "confidence": 0.0}

        rule = tuple(common_pos)
        rule_entry = GrammaticalRule(
            pattern=rule,
            frequency=len(examples),
            is_constituent=True,
        )
        self.rules.append(rule_entry)

        count_exact = sum(1 for ex in examples if
                         [self.pos_tags.get(w, "UNK") for w in self._tokenize(ex)] == list(rule))
        confidence = count_exact / max(len(examples), 1)

        return {
            "generalized_rule": list(rule),
            "from_examples": examples,
            "confidence": round(confidence, 4),
            "rule_id": rule_entry.rule_id,
        }

    def generate_utterance(self, meaning: dict) -> str:
        """Generate a sentence from a meaning representation.

        meaning: {'subject': str, 'verb': str, 'object': str, 'adj': str, 'adv': str}
        Returns a grammatical utterance based on learned parameters.
        """
        subj = meaning.get("subject", "the soul")
        verb = meaning.get("verb", "thinks")
        obj = meaning.get("object", "")
        adj = meaning.get("adjective", "")
        adv = meaning.get("adverb", "")

        rule = self.parameters["subject_verb_order"]
        head_dir = self.parameters["head_direction"]
        mod_order = self.parameters["noun_modifier_order"]

        det = "the"
        parts = []

        if "A-N" in mod_order:
            subj_phrase = f"{adj} {subj}" if adj else subj
        else:
            subj_phrase = f"{subj} {adj}" if adj else subj

        if det not in subj_phrase and subj not in ("i", "you", "he", "she", "it", "we", "they"):
            subj_phrase = f"{det} {subj_phrase}"

        if rule == "SVO":
            if obj:
                if adv:
                    parts = [subj_phrase, verb, adv, obj]
                else:
                    parts = [subj_phrase, verb, obj]
            else:
                if adv:
                    parts = [subj_phrase, verb, adv]
                else:
                    parts = [subj_phrase, verb]
        elif rule == "SOV":
            if obj:
                parts = [subj_phrase, obj, verb]
            else:
                parts = [subj_phrase, verb]
        else:
            parts = [verb, subj_phrase, obj] if obj else [verb, subj_phrase]

        sentence = " ".join(parts) + "."
        return sentence.capitalize()

    def get_state(self) -> dict:
        return {
            "vocabulary_size": len(self.lexicon),
            "corpus_size": len(self.corpus),
            "num_rules": len(self.rules),
            "num_constituents": len(self.constituents),
            "parameters": dict(self.parameters),
            "top_words": list(self.lexicon.keys())[:15],
            "most_frequent_bigrams": {" ".join(k): v for k, v in self.ngram_counts[2].most_common(5)},
            "most_frequent_trigrams": {" ".join(k): v for k, v in self.ngram_counts[3].most_common(5)},
            "top_constituents": [list(c) for c in self.constituents[-5:]],
        }


def _demo():
    la = LanguageAcquisition()

    corpus = [
        "the cat chases the ball",
        "the dog walks quickly",
        "the man sees the woman",
        "a big dog runs slowly",
        "the happy cat thinks deeply",
    ]

    pattern_results = la.extract_patterns(corpus)

    gen_result = la.generalize_rule([
        "the cat runs",
        "the dog walks",
        "the man sees",
    ])

    generated = la.generate_utterance({
        "subject": "soul",
        "verb": "thinks",
        "object": "the truth",
        "adjective": "happy",
        "adverb": "deeply",
    })

    generated2 = la.generate_utterance({
        "subject": "soul",
        "verb": "knows",
        "adjective": "conscious",
    })

    return json.dumps({
        "status": "ok",
        "summary": (
            f"LanguageAcquisition: corpus={len(corpus)} sentences, "
            f"vocab={la.get_state()['vocabulary_size']} words, "
            f"{pattern_results['rules_discovered']} rules, "
            f"{pattern_results['constituents_found']} constituents"
        ),
        "state": la.get_state(),
        "pattern_results": {
            "rules_discovered": pattern_results["rules_discovered"],
            "constituents_found": pattern_results["constituents_found"],
            "parameters": pattern_results["parameters"],
        },
        "generalization": gen_result,
        "generated_utterances": [generated, generated2],
    })


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(_demo())
    elif sys.argv[1] == "state":
        la = LanguageAcquisition()
        print(json.dumps({"status": "ok", "state": la.get_state()}))
    elif sys.argv[1] == "step":
        la = LanguageAcquisition()
        la.process_utterance("the soul thinks deeply")
        la.process_utterance("the happy cat runs")
        print(json.dumps({"status": "ok", "state": la.get_state()}))
    elif sys.argv[1] == "event":
        la = LanguageAcquisition()
        payload = json.loads(sys.argv[2])
        event_type = payload.get("type", "")
        if event_type == "utterance":
            result = la.process_utterance(payload.get("text", ""))
            print(json.dumps({"status": "ok", "result": result, "state": la.get_state()}))
        elif event_type == "corpus":
            result = la.extract_patterns(payload.get("sentences", []))
            print(json.dumps({"status": "ok", "result": result, "state": la.get_state()}))
        elif event_type == "generate":
            utterance = la.generate_utterance(payload.get("meaning", {}))
            print(json.dumps({"status": "ok", "utterance": utterance, "state": la.get_state()}))
        else:
            print(json.dumps({"status": "error", "message": f"unknown event type: {event_type}"}))
