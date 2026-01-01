# Beitar Yaakov Haifa Dashboard

A modern, responsive fan dashboard for the Beitar Yaakov Haifa Football Club.
Built with Next.js, Tailwind CSS, and Puppeteer.

## Features

-   **Upcoming Games**: Automatically sorted by date.
-   **Recent Results**: Latest match outcomes across all age groups.
-   **Team Pages**: Dedicated pages for each of the 14 club teams.
-   **Automated Sync**: Daily updates from the IFA website via GitHub Actions.
-   **RTL Support**: Fully optimized for Hebrew.

## Tech Stack

-   **Frontend**: Next.js 14, React, Tailwind CSS.
-   **Data**: JSON database (`db.json`) synced via Puppeteer.
-   **Hosting**: Vercel (recommended).
-   **Automation**: GitHub Actions.

## Setup

1.  **Clone**: `git clone <repo-url>`
2.  **Install**: `npm install`
3.  **Run**: `npm run dev`

## Data Synchronization

The data is synced daily at 05:00 UTC. To run manually:

```bash
node scripts/sync_data.js
```
