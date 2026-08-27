# SUB BOM Explosion & Material Requirements Planning

A multi-level Bill of Materials (BOM) explosion, Power Query replication engine, and Material Requirements Planning (MRP) web application.

## Features
- **Multi-Level BOM Explosion**: Recursively explodes parent assemblies down to raw sub-components and materials.
- **Power Query Engine Replication**: Matches nested Excel Power Query logic for accurate component demand calculation.
- **Shortage Tracking & Action Lists**: Identifies shortage items instantly and provides one-click copying for ordering/planning.
- **Excel Export & Copying**: Copy 2-column Item & Qty lists directly to clipboard formatted for Excel pasting.

## Deployment to GitHub Pages
This repository is configured with GitHub Actions (`.github/workflows/deploy.yml`). Pushing changes to `main` automatically builds and deploys the app to GitHub Pages using Node 22.
