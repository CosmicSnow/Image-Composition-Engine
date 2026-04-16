# AGENTS.md - Image Composition Engine

## Quick Commands

```bash
npm run dev          # REPL mode (interactive terminal)
npm start            # Production mode
npm run lint         # ESLint
node test/engine.test.js  # Run tests
```

## REPL Commands (npm run dev)

```bash
mol $ call imagery.readAssets                              # Populate DB with combinations
mol $ call imagery.createImage '{"count": 1}'               # Create 1 image (no numbers)
mol $ call imagery.createImage '{"count": 100, "workers": 4}'  # Create 100 images, 4 workers
mol $ call imagery.createImageWithNumbers '{"count": 1}'       # Create 1 image with numbers
mol $ call imagery.rescale '{"sourceDir": "./assets/", "outputDir": "./dist/output/", "percentage": 50}'
```

## Actions

- `imagery.readAssets` - Scans `./assets/`, creates all unique combinations in SQLite
- `imagery.createImage` - Creates composite images WITHOUT numbers (params: count, workers)
- `imagery.createImageWithNumbers` - Creates composite images WITH numbers (params: count, workers)
- `imagery.rescale` - Rescales images by percentage (params: sourceDir, outputDir, percentage)

## Important Notes

- Images are 10K (10000x10000) - slow to process
- Use rescale with percentage to create smaller versions
- Database: SQLite at `dist/data/database.sqlite`
- Output images: `dist/output/`
- Assets: `assets/0/` to `assets/5/` (different layer types)
- No environment variables - all params passed explicitly in action calls