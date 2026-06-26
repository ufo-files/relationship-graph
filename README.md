# UAP Relationship Graph

A static, browser-based relationship graph for exploring entities and connections extracted from a corpus of UAP-related transcripts.

Live site: https://ufo-files.github.io/uap-relationship-graph/

## What It Does

The app turns transcript-derived entities into an interactive graph. Categories form the outer structure, entities live inside those categories, and relationships are drawn from co-occurrence and corpus evidence.

The current export includes:

- 36 transcripts
- 162,082 transcript segments
- 10,841 entity mentions
- 3,966 entities
- 3,500 relationships
- 42 categories

## Interface

- Pan and zoom the graph directly.
- Click a category to drill into that portion of the graph.
- Zoom back out to return to the parent graph.
- Click an entity to inspect transcript evidence, relationships, category, count, confidence, and significance.
- Reclassify an entity when the detected category is wrong.
- Mark false positives when an extracted entity should not be tracked.
- Merge duplicates when multiple names refer to the same entity.
- Export reclassification data so it can be applied during a future rebuild.

## Data Files

The app is fully static. All data needed by the browser is committed in this repository.

| File | Purpose |
| --- | --- |
| `index.html` | Graph interface and application shell |
| `app-data.js` | Loader for the exported JSON data |
| `data/entities.json` | Extracted entities, categories, confidence, counts, and evidence references |
| `data/relationships.json` | Entity-to-entity relationship records |
| `data/mentions.json` | Mention-level extraction records |
| `data/segments.json` | Transcript segment evidence used by the inspector |
| `data/graph.json` | Precomputed graph layout and grouping data |
| `data/manifest.json` | Build metadata, input hashes, pipeline hash, counts, and reproducibility notes |
| `data/reclass.json` | Applied reclassification data included with this export |
| `data/reclass-template.json` | Empty reclassification template |

## Reproducibility

This repository is the public static export. The generator deletes the previous report output and recreates it on each rebuild, so a second run is intended to replace the prior report instead of layering new data on top of old data.

The manifest records:

- pipeline name
- generation timestamp
- source file hashes
- pipeline hash
- registry hash
- reclassification counts
- whether review input was applied

No OpenAI API key is required to view this site.

## Reclassification Workflow

The graph includes controls for correcting extraction mistakes:

- **Reclassify** moves an entity to a different category.
- **False positive** removes an entity from future tracking.
- **Merge** combines duplicate entities.

The long-term correction file is `reclass.json`. It stores category changes, false positives, duplicate merges, name-based merges, aliases, omissions, and notes. The private build workspace keeps that file at the project root, outside the generated `report/` folder, so report rebuilds do not delete it.

After reclassifying in the app, download the reclassified data and use it as the next `reclass.json` before rebuilding. The next generated export applies those decisions and replaces the previous report output.

## Extraction Limits

This is an exploratory transcript intelligence tool, not an authority file. The graph is useful for navigation, discovery, and evidence review, but automated extraction can misclassify entities, miss relationships, duplicate names, or preserve claims exactly as they appear in source transcripts.

Treat graph findings as leads. Click into nodes and read the transcript evidence before drawing conclusions.

## Deployment

The site is hosted with GitHub Pages from the `main` branch root.

Repository: https://github.com/ufo-files/uap-relationship-graph
