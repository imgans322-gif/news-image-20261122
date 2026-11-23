# The World in One Image — Sunday 22 November 2026

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/imgans322-gif/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/imgans322-gif/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

An entry for [make.fun's news-image-20261122 bounty](https://make.fun/bounty/news-image-20261122):
one image that sums up the world news of Sunday 22 November 2026.

`main.ts` (Node 22, no dependencies, no network) draws a front-page poster of the
day pixel by pixel with a small software rasteriser and a 5x7 bitmap font, then
writes it as a PNG to `$MAKEFUN_OUTPUT_DIR/entry.png`. The run is deterministic:
two runs write identical bytes.

The day's stories, as reported that day: the COP31 climate talks in Antalya
collapse with no deal after the EU rejects a text that never mentions fossil
fuels; suspected Ukrainian sea drones hit a Russian warship at Benghazi; a
Russian strike partly collapses a flats block in Dymer near Kyiv; Mexican
forces capture cartel boss "El Chapo Isidro"; US Democrats secure at least 258
House seats, their largest majority since 1992. Ticker: BepiColombo enters
Mercury orbit, Rohingya welcome the World Court verdict, an Indonesia factory
fire, and a Nigeria boat capsize.

## Run

```
MAKEFUN_OUTPUT_DIR=/output node main.ts
```
