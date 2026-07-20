# Question Generation Prompt

## Files to attach

**The live question bank is `app/src/data/`. It has no upstream — edit it
directly.** These paths used to point at copies in this folder; those were an
earlier generation with different questions and different answer keys, and have
been deleted so nobody regenerates the live test from them.

- `app/src/data/math.json` — exact JSON format, field names, and structure for math questions
- `app/src/data/reading.json` — exact JSON format and structure for reading questions
- `app/src/data/passages.json` — passage structure and format
- `app/src/data/skills.json` — all valid skill IDs and labels (use these exactly)

Note the counts below say 35 math; the live bank is **33** (see
`ibew-blueprint.md`). Adjust before reusing this prompt.

---

## MATH PROMPT

Use this prompt to generate all 35 math questions in one session.

---

I'm building an IBEW electrical apprenticeship aptitude test prep platform. I need you to write 35 original math questions for a practice test.

The test covers algebra and functions only — no geometry, no trigonometry, no statistics. All questions must be solvable by hand with no calculator. Difficulty should be distributed as follows: 12 easy, 15 medium, 8 hard.

Use the attached `math.json` for the exact JSON format required — match every field exactly including `id`, `section`, `question`, `options`, `correct_answer`, `difficulty`, `primary_skill`, `skill_tags`, and `media` (set `media` to null for all questions).

Use the attached `skills.json` for valid `primary_skill` and `skill_tags` values. Every question must use skill IDs exactly as they appear in that file. Cover as many skills as possible across the 35 questions — do not concentrate too many questions on a single skill.

Requirements:
- IDs must be m001 through m035
- Each question has exactly 4 options (A, B, C, D) and exactly one correct answer
- Distractors must be plausible — use common arithmetic mistakes, sign errors, and wrong operations, not random numbers
- Word problems should use real-world contexts relevant to electrical work where natural: wages, wire lengths, material costs, voltage, ratios, job scheduling
- Difficulty should scale correctly: easy questions test one direct operation, medium require 2-3 steps, hard require multi-step reasoning or working backwards
- Do not copy or paraphrase any existing test prep material
- Return valid JSON only, matching the structure in math.json exactly — no explanation, no commentary, just the JSON array of question objects

Write all 35 questions.

---

## READING PROMPTS

Run one session per passage in the order below. Each session produces 6 questions.
Copy the full prompt text, fill in the bolded fields, and paste the passage at the bottom.

---

### BASE READING PROMPT (use for passages 1–4)

I'm building an IBEW electrical apprenticeship aptitude test prep platform. I need you to write 6 reading comprehension questions for the passage below.

Use the attached `reading.json` for the exact JSON format required — match every field exactly including `id`, `section`, `passage_id`, `question_number`, `question`, `options`, `correct_answer`, `difficulty`, `primary_skill`, and `skill_tags`.

Use the attached `skills.json` for valid `primary_skill` and `skill_tags` values. The 6 questions must cover these skill types (one each):
- `detail_retrieval` — a question answered by finding a specific fact stated in the passage
- `main_idea` — a question about the central point or purpose of the passage
- `inference` — a question requiring a conclusion not stated directly in the passage
- `vocabulary_in_context` — a question asking what a specific word or phrase means as used in the passage
- `author_perspective` — a question about the author's tone, attitude, or point of view
- `evidence_support` — a question asking which part of the passage best supports a given claim

Requirements:
- Difficulty distribution across the 6 questions: 2 easy, 3 medium, 1 hard
- Each question has exactly 4 options (A, B, C, D) and exactly one correct answer
- Wrong answer choices must be plausible — use partial truths, common misreadings, and out-of-scope inferences
- Do not add questions that require outside knowledge — every answer must be findable in or inferable from the passage
- Return valid JSON only, matching the structure in reading.json exactly — no explanation, no commentary, just the JSON array of 6 question objects

---

## SESSION 1 — Technical Passage
**Passage ID:** p001 | **Question IDs:** r001–r006 | **Question numbers:** 1–6
*Source: "Lightning Conductors" by Richard Anderson — Project Gutenberg (public domain)*

Benjamin Franklin constructed the first practical lightning conductor at his Philadelphia residence in the summer of 1752. The apparatus consisted entirely of iron with a sharp steel point projecting seven or eight feet above the roof, while the lower end penetrated more than five feet into the ground. To satisfy his scientific curiosity about electrical flow, Franklin devised an ingenious system using two bells connected to the conductor. He found the bells rang sometimes when there was no lightning or thunder, but only a dark cloud over the rod.

Through careful observation, Franklin discovered that electrical current fluctuated significantly during storms. He initially theorized that thunderclouds maintained a negative electrical state, but subsequent investigations revealed they shifted between negative and positive charges throughout a single storm. These findings proved invaluable for refining conductor design.

Franklin later erected a superior lightning conductor over the home of his friend Mr. West, a Philadelphia merchant. This improved model featured an iron rod one-half inch in diameter with a brass wire ten inches long at the summit, tapering to a sharp point. When a severe thunderstorm struck the residence, visible lightning struck the conductor's point and dissipated harmlessly into the ground. Upon examination, Franklin observed that the brass wire had partially melted and shortened, teaching him that summit conductors required sufficient thickness to withstand intense heat.

---

## SESSION 2 — Literary/Narrative Passage
**Passage ID:** p002 | **Question IDs:** r007–r012 | **Question numbers:** 7–12
*Source: "The Road" by Jack London — Project Gutenberg (public domain)*

When the train slows down for a stop, half a dozen platforms from where I had decked her I come down. No one is on the platform. When the train comes to a standstill, I slip off to the ground. Ahead, and between me and the engine, are two moving lanterns. The shacks are looking for me on the roofs of the cars. I note that the car beside which I am standing is a "four-wheeler" — by which is meant that it has only four wheels to each truck. I duck under the train and make for the rods, and I can tell you I am mighty glad that the train is standing still.

It is the first time I have ever gone underneath on the Canadian Pacific, and the internal arrangements are new to me. I try to crawl over the top of the truck, between the truck and the bottom of the car. But the space is not large enough for me to squeeze through. Feeling with my hands in the darkness, I learn that there is room between the brake-beam and the ground. It is a tight squeeze. I have to lie flat and worm my way through. Once inside the truck, I take my seat on the rod and wonder what the shacks are thinking has become of me.

I do not know how long I have been under there, when I become aware that the train is moving. I know I am safe. I can feel the rod I am sitting on. My hands grip a rod above. I am in the clear, and I am riding the rods. There is nothing to do but to wait for the next stop, creep out, and deck her again.

---

## SESSION 3 — Informational/Historical Passage
**Passage ID:** p003 | **Question IDs:** r013–r018 | **Question numbers:** 13–18
*Source: 1911 Encyclopædia Britannica, "Apprenticeship" — Wikisource (public domain)*

Apprenticeship is a contract whereby one person, called the master, binds himself to teach, and another, called the apprentice, undertakes to learn, some trade or profession. This educational arrangement emerged during the medieval period as a foundational element of trade guilds and corporations, which sought to protect skilled workers from feudal lords while maintaining exclusive professional privileges. The system incorporated both masters entitled to practice their crafts and apprentices undergoing instruction.

During the Middle Ages, apprenticeships typically lasted seven years — a duration deemed necessary for thorough professional training. Upon completing this period, apprentices became masters themselves with full membership rights in their respective corporations. This framework applied across Europe with considerable consistency, though England proved slower to adopt such rigid structures due to traditional resistance toward trade restrictions. Parliament first acknowledged apprenticeships in 1388 and 1405, eventually codifying the seven-year standard through a 1562 statute that mandated no person could exercise any trade or mystery without completing such training.

The system underwent dramatic transformation following England's Industrial Revolution. Economic theories championing free trade, particularly those of Adam Smith, gradually undermined monopolistic structures. An 1814 statute repealed the Elizabethan apprenticeship requirements, permitting individuals to pursue mechanical trades without formal training. However, learned professions like law and medicine retained and intensified their apprenticeship requirements, maintaining quality standards through formal training and examination. While some skilled trades experienced decline in apprentice numbers due to organizational difficulties and financial obstacles, the system persisted in modified forms across Europe, eventually attracting renewed interest as the nineteenth century progressed.

---

## SESSION 4 — Argumentative Passage
**Passage ID:** p004 | **Question IDs:** r019–r024 | **Question numbers:** 19–24
*Source: "The Iron Heel" by Jack London — Project Gutenberg (public domain)*

With the introduction of machinery and the factory system in the latter part of the eighteenth century, the great mass of the working people was separated from the land. The old system of labor was broken down. The working people were driven from their villages and herded in factory towns. The mothers and children were put to work at the new machines. Family life ceased. The conditions were frightful. It is a tale of blood.

"I know, I know," Bishop Morehouse interrupted with an agonized expression on his face. "It was terrible. But it occurred a century and a half ago."

"And there, a century and a half ago, originated the modern proletariat," Ernest continued. "And the Church ignored it. While a slaughter-house was made of the nation by the capitalist, the Church was dumb. It did not protest, as to-day it does not protest."

"But we move in cycles," the Bishop urged. "The worse conditions of labor a century ago were merely a temporary fluctuation. We have emerged from that low point and are rising toward the light. Conditions of labor are improving. The laborer today is better off than he was then."

"I deny it," Ernest answered. "There is not a single standard of living that obtains today that did not obtain a century ago. The only difference is that there are more people today who are compelled to live under those miserable standards. The increase in population, combined with the greater productivity of the machines, has resulted in the increase of misery and not in its diminution."

---

## SESSION 5 — Dual Passage
**Passage 1 ID:** p005a | **Passage 2 ID:** p005b | **Shared passage_id for questions:** p005
**Question IDs:** r025–r030 | **Question numbers:** 25–30

Use this variant prompt instead of the base prompt:

I'm building an IBEW electrical apprenticeship aptitude test prep platform. I need you to write 6 reading comprehension questions for a paired passage set — two related passages presented together.

Use the attached `reading.json` for the exact JSON format. Set `passage_id` to `p005` for all 6 questions.

The 6 questions must include:
- 2 questions that can be answered from Passage 1 alone
- 2 questions that can be answered from Passage 2 alone
- 2 questions that require comparing, contrasting, or synthesizing both passages

Cover these skills across the 6 questions: `dual_passage`, `main_idea`, `inference`, `evidence_support`, `author_perspective`, `detail_retrieval`.

Difficulty distribution: 2 easy, 3 medium, 1 hard. All other requirements same as the base prompt.

**Passage 1** — *1922 Encyclopædia Britannica, "Trade Unions" — Wikisource (public domain)*

Trade unions emerged as organized associations of wage-earners for the purpose of maintaining or improving the conditions of their employment. Members pooled resources through contributions to build funds that supported unemployed colleagues and those on strike. Beyond these immediate concerns, unions negotiated wage rates, working hours, and employment conditions with employers. During the early twentieth century, trade unions expanded their activities considerably, taking on educational initiatives, political engagement, and experimental ventures in workers' control of industry.

The growth of trade unionism during this era was remarkable. British trade union membership rose from approximately 2.4 million in 1910 to over 8 million by 1919, representing a transformation in labor organization. This expansion occurred across multiple sectors — from traditionally organized industries like mining and railroads to newer areas such as agriculture, postal service, and professional occupations. By 1921, trade unions had achieved unprecedented social and political influence, securing representation on government committees and industrial councils that shaped national policy.

**Passage 2** — *History of Electrical Safety Standards (public domain historical record)*

In 1895, five different electrical installation codes were established to protect workers and ensure consistent practices across the country. However, this fragmented approach proved problematic, so in 1897 a committee developed and published the National Electrical Code, providing a uniform standard that electricians could apply nationwide. The National Fire Protection Association took on sponsorship of the NEC, recognizing that unsafe electrical conditions frequently caused fires.

The research of Charles Dalziel in 1956 fundamentally transformed how the industry understood electrical hazards. After investigating electric shock, he authored "The Effects of Electric Shock on Man," establishing crucial benchmarks for electrical safety. His invention of GFCI outlets and breakers proved so effective at preventing deaths that the NEC mandated their use. Following the passage of the Occupational Safety and Health Act in 1970, OSHA was established to enforce safe working conditions. The resulting NFPA 70E standard, published in 1979, became the foundation of modern electrical safety practices. Both passages describe how workers in the electrical industry sought protection — one through collective organization, the other through codified safety standards.

---

## SESSION 6 — Data/Table Passage
**Passage ID:** p006 | **Question IDs:** r031–r036 | **Question numbers:** 31–36

Use the base reading prompt but replace the skill list with these (better suited for data interpretation):
- `detail_retrieval` — reading a specific value from the table
- `data_table_reading` — interpreting what the data shows overall
- `inference` — drawing a conclusion from a trend in the data
- `main_idea` — identifying what the table as a whole is about
- `evidence_support` — identifying which row or value supports a given claim
- `vocabulary_in_context` — asking what a term in the table header or note means

**Passage — Electrician Employment and Wages in the United States**

The following table presents data on electrician employment and average annual wages in the United States from 2000 to 2020, based on Bureau of Labor Statistics occupational employment surveys. Wages are shown in nominal dollars (not adjusted for inflation). The unemployment rate column reflects the national civilian unemployment rate for that year.

| Year | Employed Electricians | Avg Annual Wage | % Change in Employment | National Unemployment Rate |
|------|-----------------------|-----------------|------------------------|---------------------------|
| 2000 | 659,000               | $41,370          | —                      | 4.0%                       |
| 2005 | 705,000               | $47,520          | +6.9%                  | 5.1%                       |
| 2010 | 527,000               | $51,840          | −25.2%                 | 9.6%                       |
| 2015 | 619,000               | $54,110          | +17.5%                 | 5.3%                       |
| 2020 | 729,000               | $60,370          | +17.8%                 | 8.1%                       |

Note: Employment figures are rounded to the nearest thousand. Wage figures represent the mean (average) wage across all electrician specialties, including residential wiremen, inside wiremen, and linemen. The 2010 decline in employment corresponds with the 2008–2009 financial crisis and associated contraction in construction activity.

---

## SESSION ORDER SUMMARY

| # | Type | Passage ID | Question IDs | Q Numbers |
|---|------|-----------|--------------|-----------|
| 1 | Technical | p001 | r001–r006 | 1–6 |
| 2 | Literary/Narrative | p002 | r007–r012 | 7–12 |
| 3 | Informational | p003 | r013–r018 | 13–18 |
| 4 | Argumentative | p004 | r019–r024 | 19–24 |
| 5 | Dual Passage | p005 | r025–r030 | 25–30 |
| 6 | Data/Table | p006 | r031–r036 | 31–36 |

---

## IMPORTANT — AFTER GENERATION

1. **Verify every math answer yourself.** Claude occasionally makes arithmetic errors on multi-step problems. Work through each hard and medium question manually before using it.

2. **Read every reading question against the passage.** Make sure the correct answer is supported by the text and wrong answers are genuinely wrong.

3. **Add each passage to `passages.json`** before the app can display it — the platform loads passage text from that file, not from this prompt.

4. **Replace `src/data/math.json` and `src/data/reading.json`** with the reviewed files — those are the copies the app actually reads at runtime.
