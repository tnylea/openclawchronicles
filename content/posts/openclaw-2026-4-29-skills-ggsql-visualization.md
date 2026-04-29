---
title: "OpenClaw ggsql Skill: SQL-Powered Data Charts Without Python or R"
excerpt: "The new ggsql skill for OpenClaw lets agents generate scatter plots, bar charts, histograms, and heatmaps using a SQL-like Grammar of Graphics syntax — no Python or R needed."
coverImage: '/assets/images/posts/openclaw-2026-4-29-skills-ggsql-visualization.png'
date: '2026-04-29T23:05:00.000Z'
dateFormatted: April 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-29-skills-ggsql-visualization.png'
---

A new OpenClaw skill called **ggsql** landed on ClawHub today and immediately picked up traction on Hacker News — 7 points and climbing as of this writing. The skill extends SQL with visualization clauses inspired by the Grammar of Graphics, letting agents produce charts from tabular data without needing a Python or R environment.

## What Is ggsql?

ggsql is built around a simple idea: write a SQL-like query, add a `DRAW` clause, get a chart. The underlying library (`ggsql-cli`) is written in Rust and available at [github.com/posit-dev/ggsql](https://github.com/posit-dev/ggsql). The ClawHub skill wraps it with a structured YAML input schema that agents can use directly.

A basic scatter plot looks like this:

```sql
SELECT * FROM 'penguins.csv'
VISUALISE bill_length_mm AS x, bill_depth_mm AS y, species AS fill
DRAW point
LABEL
  title => 'Penguin Bill Dimensions',
  x => 'Bill Length (mm)',
  y => 'Bill Depth (mm)'
```

Output is an SVG or PNG file (plus an embedded base64 image for in-chat display).

## Supported Chart Types

The skill covers the most common chart types you'd reach for in data analysis work:

- **Scatter plot** (point) — x/y mapping, optional fill/color/shape/size
- **Line chart** — time series, grouped by color
- **Bar chart** — auto-count or explicit y values
- **Histogram** — configurable binwidth
- **Boxplot and violin** — categorical x, numeric y
- **Density plot** — distribution curves
- **Heatmap** — tile draw with binned fill scale
- **Pie chart** — via polar projection on bar draw

It also supports **faceting** (small multiples) in both 1D and 2D layouts, and **multi-layer charts** that combine a line and point draw over the same data.

## How to Use It in OpenClaw

Once the skill is installed, you can trigger it with natural language:

- *"Visualize this CSV as a scatter plot with species as color"*
- *"Create a histogram of the revenue column with binwidth 500"*
- *"Draw a heatmap of correlation between X and Y"*

The skill accepts a CSV file path, JSON array, or SQL table reference as input. It handles the VISUALISE/DRAW/LABEL SQL generation internally based on your chart type and column mapping.

For testing without installing the CLI, ggsql provides a [WASM playground](https://ggsql.org/wasm/) with built-in datasets (`ggsql:penguins`, `ggsql:airquality`) and CSV upload support.

## Installation

The CLI itself is a Cargo install:

```bash
cargo install ggsql-cli
```

There's also a Jupyter kernel for notebook workflows:

```bash
uv tool install ggsql-jupyter
ggsql-jupyter --install
```

The ClawHub skill page is at [clawhub.ai/fanzhidongyzby/openclaw-ggsql](https://clawhub.ai/fanzhidongyzby/openclaw-ggsql). The skill is currently in alpha (v0.2.7) and the syntax may evolve, but the core VISUALISE/DRAW contract is stable enough for everyday use.

## Why This Matters

The "no Python/R needed" angle is genuinely useful for OpenClaw deployments where agents operate in lean environments — Docker containers, sandboxed workers, or systems where a full data science stack isn't installed. For those setups, ggsql provides a single Rust binary that can turn a CSV into a publishable chart with a one-line command.

The Grammar of Graphics model also maps naturally to how agents describe data: declarative, composable, and column-centric. Rather than writing imperative matplotlib code, you describe *what* you want to see and let ggsql figure out the geometry.

Whether this becomes the standard charting approach in the OpenClaw skill ecosystem remains to be seen, but the early HN traction suggests it's hitting a real need.
