# Robo3DSG project page: design note

Reference pages surveyed for structure only (no code, text or assets reused): LIBERO-plus, LIBERO, VLABench, RoboCasa.
Common pattern: hero with resource buttons, a teaser figure/video, abstract, benchmark design (dimensions, tasks),
dataset statistics, results/leaderboard, rollout or failure-case videos, BibTeX. LIBERO-plus organises results as numbered
findings; VLABench shows example tasks per capability dimension; RoboCasa groups demo videos per skill/embodiment.

Sections chosen, in order, and why:
1. Hero: title, subtitle, "Anonymous authors (under review)", buttons Paper (arXiv) / Dataset / Code, all "coming soon" (double-blind).
2. Overview figure (paper Fig. 1) + stat tiles: one glance at scale (38,098 demos, 400 cells, 2 robots, 4 dimensions).
3. Abstract: verbatim paper abstract.
4. Task template: identical candidates make the relation the only signal; three abilities (binding, acuity, production).
5. Benchmark design: four dimension cards with their two sub-factors, the level ladder, the perturbation-settings table, Fig. 3.
6. Two embodiments: Franka (LIBERO tabletop) and GR1 (RoboCasa counter), settings table, the 12 GR1 tasks.
7. Hierarchical 3D scene graph: paper Fig. 2 + the per-step graph trajectory video (the paper's distinctive contribution).
8. Gallery: demos from both robots for every sub-factor, plus labelled zero-shot rollouts; vanilla-JS filters by robot,
   dimension and clip type; videos lazy-load and play only while visible.
9. Results: Franka (11 policies) and GR1 (6 policies) tables as HTML with the paper's exact numbers; RSR definition; Fig. 4.
10. Key findings: five short takeaways with two finding figures (LIBERO-plus style numbered findings).
11. BibTeX (anonymous placeholder until de-anonymisation).

Style: GloVLA template (style.css, Space Grotesk / Inter / JetBrains Mono, orange accent); dimension colours follow the paper
(VSR blue, SSU magenta, OCD teal, SCR orange). No external CDN, trackers or fonts; works at <= 600 px.
A combined two-subset view is deferred (user will decide later).
