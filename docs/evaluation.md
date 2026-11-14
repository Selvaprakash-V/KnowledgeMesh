# Evaluation

See `evaluation/README.md`.

Repeatable commands:

```bash
python -m evaluation.run --self-check
python -m evaluation.run
```

The dataset columns are `question`, `expected_answer`, `expected_sources`, and `knowledge_base`. Source-level recall, precision, and MRR are always computed from search hits. RAGAS faithfulness and answer relevance are computed only when that extra dependency is installed and explicitly enabled. Hallucination rate is reported only as `1 - faithfulness` in that case.
