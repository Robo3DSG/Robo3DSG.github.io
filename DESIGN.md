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

## Teaser video: investigation (2026-11-20, item 1)

Goal: one full trajectory with a continuously updating scene graph, for Franka and GR1, in the style of Fig. 1 (overview.png), with the static figure moved below the video.

Findings (read-only on libero-spatial-sg):
- Franka: the paper's Fig. 1 graph panel is rendered from the interactive viewer bundle `main_overleaf_1711_2/supp_media/viewer_demo_r1_g0_L000_a000.html` (per-step point clouds and graph, built by `tools/demo_viewer/build.py` from the LIBERO HDF5 replay `demo_graph/replay.py`) with headless Chrome (`/usr/bin/google-chrome` is installed). `supp_media/trajectory.mp4` (924x880, 8 s) and 122 PNG frames in `figures/anim/` already exist; the page video `scene_graph_trajectory.mp4` is this clip scaled to 640x610. So Franka needs no new simulation: re-drive the viewer per control step in headless Chrome, add the recorded agentview frame and the instruction, and encode the full demo (not an 8 s excerpt).
- GR1: the Fig. 1 GR1 panel came from `render_gr1_overview.py` (RoboCasa, on another machine; script not in this repo) using `gr1_geometry.npz` (robot and object mesh samples). The local LeRobot copy `SpatialCasa-GR1/train/*` holds only ego-view video, 29-d robot state and actions per step, with NO object poses and no per-step graph. A live graph therefore needs one RoboCasa replay of an episode (set the scene from the episode record, replay the recorded actions, log object poses each step), then sgrel on those poses. RoboCasa is not installed locally.
- No existing generator produces a per-step GR1 graph video.

Chosen approach: (1) Franka: new `tools/render_teaser_franka.py` = Chrome-driven viewer frames + agentview + instruction banner, ffmpeg to H.264, about 640x... per panel, local, 1 slot, 4 threads, est. 15-25 min. (2) GR1: same compositor, fed by a per-step pose log from one RoboCasa replay (needs the machine that has robocasa, est. 1 h incl. setup, one episode, then local compositing 15 min). Fallback if replay is not possible: a GR1 clip with the recorded ego view and a graph built from t=0 scene file only for the start/end frames (not live) - not recommended.
Output: static/videos/teaser_franka.mp4, teaser_gr1.mp4 (<= 3 MB each, constant aspect, poster jpg). Nothing heavy is rendered until the go.

### Teaser videos: result (2026-11-20)
- Order in `#overview`: two full-trajectory videos (Franka, GR1), then the paper Fig. 1 (overview.png) below them.
- Franka: `tools/render_teaser_franka.py` (headless Chrome drives the demo viewer once, composes header + 3-edge timeline; 160 steps, 920x874, 0.7 MB, about 1 min locally).
- GR1: `tools/gr1_replay_log.py` (RoboCasa replay of recorded training episode 291 of CuttingboardToPan, run on the CPU server, about 1 min) then `tools/render_teaser_gr1.py` (point-cloud graph + recorded head camera + timeline; 260 steps, 1272x834, 1.6 MB, 40 s). `tools/relations_gr1_harness.py` is a copy of the harness relation rules. Replay check: replayed 29-d robot state vs dataset state, mean abs diff 0.0013, max 0.068 (only the first steps and finger closing); target lifted at step 87, released at 167. Only 4 of 14 clean episodes tried replayed successfully (RoboCasa contact is not deterministic), so the episode was picked by replay success.
- All figures and videos keep their native aspect ratio: width/height attributes match the file, `height:auto`, `object-fit:contain`; gallery tiles use the clip's own ratio (1:1 Franka and rollouts, 8:5 GR1).
- New benchmark figures (copied and compressed from the paper and release assets): task_template.jpg (crop of paper figure, panels a-c), sub_factors_gr1.jpg, level_recipes.jpg, levels_gr1.jpg.

## Raw images + HTML text: inventory and plan (2026-11-21, step A; awaiting go)

Goal: every figure is a raw image (no text in pixels); titles, panel labels, axis labels, legends, captions are page text (HTML/CSS grid or inline SVG). Originals move to `static/_old/`.

| # | Asset (static/) | Baked text now | Source | Plan |
|---|---|---|---|---|
| 1 | videos/teaser_franka.mp4 + poster | instruction + step/phase header, timeline row labels + axis caption, 3D node labels | tools/render_teaser_franka.py (Chrome viewer + PIL) | (a) re-render with no header/labels; HTML caption line (instruction, robot), HTML row labels left of the bars via CSS grid (same row heights), HTML axis caption; node labels: hide in the viewer if it has a toggle, else keep and say so (open item) |
| 2 | videos/teaser_gr1.mp4 + poster | instruction/step header, "head camera" tag, node + edge ("right of 4.4 cm") labels, timeline labels | tools/render_teaser_gr1.py (PIL) | (a) same: drop all `dr.text`/node/edge labels in the script; HTML header, row labels, and a colour legend (tier colours); edge values are dropped from pixels (they are in the caption) |
| 3 | images/overview.png | logo + title, 3 stats, 4 dimension cards, "Franka arm"/"GR1 humanoid" side labels, (a)-(h) tags, node labels in the two graph panels | paper fig_overview (composite); panels cropped from it | (b) crop 2 graph panels and 8 thumbnails (rings stay: graphics, not text); HTML grid: title, stats, dimension cards (VSR/SSU/OCD/SCR colours), side labels, (a)-(h) tags as HTML badges. Graph-panel node labels: use the re-rendered text-free graph frames of #1/#2 (Franka t=80 frame, GR1 frame) instead of the crops |
| 4 | images/task_template.jpg | panel titles (a)(b)(c), per-panel captions, 3D box labels ("bowl 1", "cookie box"), plus a stray cut-off row "(d)/(e)" at the bottom (bug) | crop of paper figure | (b) 3 crops of the raw scene without label boxes if a clean frame exists in `figures/fig_dims` / demo assets; otherwise crop with the box labels (small, in-scene; report) and drop stray row; HTML titles + captions |
| 5 | images/sub_factors_gr1.jpg | column heads (base/easy/medium/hard), row names, per-tile settings ("light x1.35", instructions, gaps) | release asset grid (4 cols x 8 rows, regular layout) | (b) slice 32 tiles from the grid (regular geometry), re-pack as 8 row-strips (4 tiles each, one jpg per row, <= 400 KB) and an HTML table: row names, column heads, tile captions |
| 6 | images/levels_gr1.jpg | row (seen/easy/medium/hard) and column names, companion lists | release asset grid (4 x 9) | (b) same: 4 row-strips + HTML grid with labels/companions; mobile: horizontal scroll inside the figure (min-width) |
| 7 | images/level_recipes.jpg | titles, column groups, cell letters T/E/M/H, legend | paper fig; numbers = level recipes in main_overleaf_2011/tables/gen_v5_levels.tex (+ perturbation_settings.tex) | (c) HTML/CSS grid of 4 matrices (cells coloured by level, letter in text, primary ringed), legend in HTML; cell values parsed from the table, cited in a comment |
| 8 | images/organization.png | everything (grids, sunburst labels, legend) | figures/tikz_benchmark_organization.tex + figures/benchmark_distribution.json | (c) inline SVG: relation-cell grids from the tikz cell lists, sunburst with arcs from benchmark_distribution.json counts, all text as SVG/HTML text |
| 9 | images/drop_per_dimension.png | all axes, labels, legend | figures/tikz_results_drop_mean.tex (pgfplots coords) | (c) inline SVG dot-plot from the coordinates in that tex (cited) |
| 10 | images/finding_distance.png | axes, titles, row names, n.r. | figures/tikz_finding_distance.tex / figures/finding_distance.tex | (c) inline SVG bars + error bars from the tex numbers |
| 11 | images/finding_target_updates.png | legend, headers, axis ticks, row names, values | figures/tikz_finding_target_updates.tex, tables/finding_target_updates_full.tex | (c) inline SVG bar charts + HTML legend/icons (rings drawn as SVG) |
| 12 | images/scene_graph.png | all panel titles, layer names, node labels, legend, panel (c) cards and values | paper fig_hierarchy (figures/fig_hierarchy_scene.png = raw 3D layer scene?; tikz_hierarchy.tex) | (b)/(c): (a) layered scene: use fig_hierarchy_scene.png raw if it is text-free, else leave it and report; (b) strip: crop 5 mini-panels (graph renders carry no text except pills) + HTML step labels and pills; (c) rebuild the 3 cards as plain HTML (cards, mono code block, tick list, metric table); mini tree in (c) as inline SVG. Layer/node names over (a) as HTML only if a clean raw exists; otherwise OPEN ITEM (needs re-render of the layered scene without text) |
| 13 | videos/scene_graph_trajectory.mp4 | title quote, step/phase title, node labels, timeline with labels + axis | trajectory.mp4 of the paper (tools in supp_media) | (a) replaced by the new text-free teaser_franka render, or re-render with the same script; HTML overlays as in #1. Else drop from the page (duplicates #1) - needs your call |
| 14 | images/gr1_tasks.jpg | 12 task names burned in the black bars on top of each tile | 12 renders (tile grid 4x3, 256x256 + bars) | (b) crop the 12 tiles, HTML grid with task names as figcaptions |
| 15 | images/posters/*.jpg (gallery 18 + 2 rollouts), videos/franka|gr1|rollouts/*.mp4 | none (checked frames) | raw renders | (d) leave as is (instruction/tags are already HTML) |
| 16 | teaser posters (2) | same as #1/#2 | | regenerate from new videos |

Notes: rings (green/red target circles) and arrows inside raw renders are graphics, not text; they stay. Where a raw text-free source does not exist locally and only a re-simulation would give it, I will report it instead of simulating (candidates: #12 panel (a), #4 box labels, #1 node labels).
Order of work if approved: #14, #5, #6, #7 (cheap, pure HTML) -> #9-#11, #8 (SVG from tex) -> #1, #2, #13 (re-render) -> #3, #12, #4.

### Raw images + HTML text: result (2026-11-21)
All figures are now raw pixels; every title, label, legend, axis and caption is page text. Originals are in `static/_old/` (nothing deleted). Generators (run from the page root): `tools/build_figures_grid.py` (tile grids + level matrix), `tools/build_figures_svg.py` (four charts as inline SVG from the paper's tikz/json numbers, sources cited in the docstring), `tools/build_figures_scene_graph.py` (gs `-dFILTERTEXT` text-free render of `fig_teaser_hierarchy.pdf` + SVG text from `pdftohtml -xml`), `tools/render_teaser_franka.py` / `render_teaser_gr1.py` (text-free videos; Franka viewer "names" checkbox switched off). `tools/_swap.py`, `_reinject.py`, `_frag/` are the helpers/fragments used to patch index.html.
- Lightbox: `img.zoomable` as before; HTML/SVG figures (`.hfig`) open a clone of their body in a white card.
- Videos: instruction line, timeline row legend and node-colour legend are HTML; `scene_graph_trajectory.mp4` is the new text-free Franka render scaled to 640 px.
- Known leftovers: rings/arrows in the renders (graphics); in-scene object tags of the task-template figure were inpainted and are now HTML tags placed in % of the scene; the GR1 per-step edge values (cm) are no longer drawn in the video.

## Fixed-canvas scaling (2026-11-21)
Problem: after the raw-image + HTML-text conversion, page text re-flowed with the window while the images scaled, so labels drifted, wrapped and overlapped (only right at about 1400 px).
Mechanism: every composite figure that places text relative to images is one fixed canvas. Markup: `<div class="fc" data-w="W"><div class="fc-in">...</div></div>` (for figures: `.hfig-body.fc`). `.fc-in` is laid out once at the design width W (px); `main.js` scales it with `transform: scale(width / W)` (ResizeObserver on the box and on the inner block, so image loads also refit) and sets the outer height, so the aspect ratio is exact and nothing moves relative to the image at any width. No-JS fallback: the canvas keeps width W and scrolls.
- Canvas CSS uses px only (rem and `clamp(..vw..)` converted to the values the figures had at 1400 px) and no media queries; the old responsive breakpoints for `.ov`, `.tt-grid`, `.lvl-grid`, `.rec-wrap`, `.tile-grid` and `.chart-svg` were removed.
- Design widths: overview 1132, task template 772, sub-factors 560, level recipes 1132, levels 1132, GR1 tasks 552, teaser pair 1101 (see below), scene-graph trajectory video + legend 578.
- Inline SVG figures (scene graph Fig. 2, organisation, three result charts) already scale by viewBox; the 600 px font-size override for `.chart-svg` and the 880 px `min-width` of the scene-graph SVG were removed, so their text scales with the drawing.
- Task template: tag font fixed at 9 px in canvas units, tags sit under their rings at the original paper positions; in (c) the ramekin tag moved above the ramekin so it no longer covers "bowl 2".
- Lightbox: shows a clone of the same canvas at the same design width (SVG figures: at their on-page width), scaled with the same transform to fit the screen; nothing re-flows.
- Plain captions (figcaption, video title line, node-colour legend) still wrap normally.
- Check: `tools/shoot_figures.py OUTDIR` (needs a python with `websockets`, e.g. ~/miniconda3/bin/python; CDP screenshots of every figure at 1600/1280/1000/768/600/400 px + lightbox) and `tools/contact_sheet.py OUTDIR` (contact sheet per figure); no horizontal page scroll at 400 px. At 400 px wide figures become small; the lightbox gives the large view (on a portrait phone a wide figure stays width-limited).
- Backups of the pre-change files: `static/_old/index_pre_fixedcanvas.html`, `style_pre_fixedcanvas.css`, `main_pre_fixedcanvas.js`.

## Teaser pair as one canvas (2026-11-21)
User feedback: the two teaser demos did not read as side by side (two canvases of different widths, stacked below 800 px).
- `#teaser-videos` is now one `figure.teaser-pair.hfig` with one canvas `.fc[data-w=1101]` > `.tp-grid`: two columns (438.41 / 638 px, gap 24) and three rows (title, video, timeline legend), so titles, video tops and legend blocks share rows. Both videos are 372 px tall (370 content + border), width from their own ratio (920x780, 1272x740): no crop, no stretch. Never stacks; scales like an image.
- The two clip captions are joined into one normal figcaption under the canvas (text unchanged).
- `data-sync`: both videos load together and start from frame 0 once both can play, then loop at their own lengths (16 s / 26 s). `data-lb-video`: the lightbox keeps the videos and continues from the on-page frame.
- Limit: at 400 px the canvas text is about 4-5 px; the lightbox gives the large view. Backups: `static/_old/*_pre_teaserpair.*`.

## Dimension rollouts (2026-11-22)
Reviewer feedback: the per-dimension examples should be rollouts that play one video at a time, not still tiles.
- In `#benchmark`, under the four dimension cards, "Examples per dimension": one player per dimension (VSR, SSU, OCD, SCR, paper colours). Header (tag, name, numbered step buttons) in normal flow; then one fixed canvas `.fc[data-w=984]` with the Franka clip (372x372) and the GR1 clip (595x372, 8:5) side by side at the same height, each with an HTML badge (robot + sub-factor, GR1/Franka-specific name for the extra bowl/can); then the captions of all steps stacked in one grid cell (only the current one visible, so the height is that of the longest and nothing below moves when the step changes).
- Sequence per dimension: sub-factor A, then sub-factor B, looping. Both robots show the same step; the block advances when both clips have ended (the shorter clip holds its last frame). Step buttons jump; the active button carries a progress line (longer clip). Plays only while the canvas is visible (IntersectionObserver), muted + playsinline; the current clips load with `preload=auto`, the next step's clips are prefetched with `preload=metadata` only. JS: `static/js/main.js`, "Dimension rollouts".
- Clips: the existing gallery demos `static/videos/{franka,gr1}/<sub-factor>.mp4` (one per robot and sub-factor, 80-460 KB, no re-encode) and their posters; instructions are the gallery captions. They are training demonstrations, labelled "training demonstration (seen setting)". No easy/medium/hard clips exist yet, so the players show one clip per sub-factor; the clean baseline is not repeated in every player (it is in the gallery).
- The previous GR1 sub-factor grid (base/easy/medium/hard stills) is kept below the players inside a collapsed `<details>` ("All settings"); the level grid (levels_gr1) stays visible further down.
- Generator: `tools/build_dim_rollouts.py` (idempotent, replaces the block between the `dim-rollouts:begin/end` comments). Backups: `static/_old/*_pre_dimrollout.*`.
