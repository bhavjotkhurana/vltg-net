# VLTG Question-Bank Blueprint — aligned to the real IBEW/NJATC aptitude test

Source of truth for the question rebuild (task #3) and the scoring rework (task #4).
Grounded in the public structure of the electrical Training ALLIANCE (NJATC) aptitude
test. Actual items and official norms are proprietary; these are **original** items
calibrated to the real test's topics, style, and difficulty.

## Test shape (real exam)

| Section | Questions | Time (real) | Marking |
|---|---|---|---|
| Algebra & Functions | **33** | 46 min (~84s/q) | correct only, no penalty |
| Reading Comprehension | **36** | 51 min (~85s/q) | correct only, no penalty |
| **Total** | **69** | 97 min | Stanine 1–9, 4 = qualify, 5 = avg |

Current bank is 35 math + 36 reading = 71 → **drop math to 33**, reading stays 36.

## Metadata to populate on EVERY item (currently missing)

- `topic` — human-readable topic label (currently `null` on all items).
- `expected_time_seconds` — currently unset on all items; required for the timing
  benchmark (task #5). Targets: easy ~50s, medium ~85s, hard ~130s (math);
  reading ~60/85/120s. Section budgets must stay near the real 46/51-min caps.
- Keep: `primary_skill`, `skill_tags`, `difficulty`, worked `explanation`,
  quality `distractors` (each wrong option maps to a real misconception).

---

## MATH — 33 questions (skill IDs from skills.json)

Real framing: four algebra sub-areas + number series. Weighted toward linear
equations, algebraic manipulation, and functions/graphs, with numeric foundations
as the easier items.

| primary_skill | Count | Difficulty spread (E/M/H) |
|---|---|---|
| arithmetic_basic | 3 | 3 / 0 / 0 |
| order_of_operations | 3 | 2 / 1 / 0 |
| fractions | 3 | 1 / 2 / 0 |
| algebraic_substitution | 3 | 1 / 2 / 0 |
| linear_equations | 5 | 0 / 4 / 1 |
| inequalities | 2 | 0 / 2 / 0 |
| systems_of_equations | 2 | 0 / 1 / 1 |
| polynomials | 3 | 0 / 1 / 2 |
| factoring | 2 | 0 / 0 / 2 |
| quadratics | 2 | 0 / 0 / 2 |
| graph_interpretation | 3 | 1 / 2 / 0 |
| number_sequences | 2 | 1 / 1 / 0 |
| **Total** | **33** | **9 / 16 / 8** |

Notes:
- No calculator on the real test — keep arithmetic clean, answers exact.
- "Functions" = linear functions: slope, plotting, reading a line's equation/graph
  (→ `graph_interpretation`).
- Number series = pattern/next-term (→ `number_sequences`).

## READING — 36 questions across ~12 passages (2–4 questions each)

Corrected to the real test's structure (verified via AIR / electrical training
ALLIANCE materials and IBEW local prep sheets): **300–500-word passages, each
followed by 2–4 questions.** Topics span **safety, trades history, and general
civic / science** material — NOT electrical-technical-heavy. Passages are
**original** (written for VLTG) to avoid copyright issues and hit a modern adult
reading level; the official test's passages are proprietary/secured (developed by
AIR) and cannot be reused regardless of how they were sourced.

12 original passages, question counts summing to 36:

| # | Title / topic | Type | Q |
|---|---|---|---|
| p001 | Workplace hazard communication & PPE | safety | 3 |
| p002 | The rise of the apprenticeship | historical | 3 |
| p003 | How suspension bridges work | scientific | 4 |
| p004 | The origins of Labor Day | civic/historical | 2 |
| p005 | Ladder safety | safety | 3 |
| p006 | The water cycle | scientific | 4 |
| p007 | First day on the job (narrative) | narrative | 3 |
| p008 | How a bill becomes law | civic | 2 |
| p009 | Standard time and the railroads | historical | 3 |
| p010 | The case for vocational education | argumentative | 4 |
| p011 | Renewable energy, an overview | scientific | 3 |
| p012 | The human circulatory system | scientific | 2 |

Question-type distribution (skill IDs), across all 36 — narrowed to the real
test's core types:

| primary_skill | Count |
|---|---|
| detail_retrieval | 10 |
| inference | 9 |
| main_idea | 7 |
| vocabulary_in_context | 6 |
| author_perspective | 4 |
| **Total** | **36** |

Difficulty spread target: 11 easy / 18 medium / 7 hard.
Reading level: workplace/adult, contemporary (not archaic public-domain prose).

## Skill taxonomy reconciliation — PRUNE unused reading skills

The reading rebuild uses only the 5 core skills above (matching the real test:
main idea, supporting detail, inference, vocabulary-in-context, author's
purpose/tone). **Prune** the other 7 reading skills from skills.json so the results
page never shows permanently-empty skills: `sentence_purpose`,
`paragraph_function`, `evidence_support`, `rhetorical_techniques`, `dual_passage`,
`data_table_reading`, `experiment_interpretation`. Verified no kept skill lists a
pruned skill as a prerequisite, so the prereq graph stays intact.

## Out of scope here (tracked elsewhere)
- Stanine scoring model → task #4.
- Self-paced timing + benchmark using `expected_time_seconds` → task #5.
