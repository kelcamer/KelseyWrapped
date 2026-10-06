# Kelsey Wrapped

A year of protein shakes, leg curls and spite, read out of a gym log and a food
diary and roasted one card at a time.

Live: https://kelcamer.github.io/KelseyWrapped/

Tap the right side of a card (or press →) to go on, the left side to go back.
It ends on an itemised receipt.

## Where the numbers come from

`src/data.json` is generated, not hand-written. A private script reads the raw
gym log and nutrition spreadsheet (kept outside this repo) and writes only:

- counts, totals, averages and dates for the gym log, with no note text;
- food-diary notes, minus any day that mentions health, cycle or meds.

The script refuses to write the file if any private term shows up in it.

Vite, no framework. `npm run build`; pushing to `main` deploys to GitHub Pages.
