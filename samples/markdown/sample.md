# Northwind Coffee Co. — Barista Handbook

A **single-file** Markdown sample. Drag it into the viewer to see it rendered,
then flip to *source* to read the raw text.

## Espresso, dialed in

> Good espresso is 25 seconds, give or take. Taste, adjust, repeat.

1. Dose **18 g** into the basket
2. Distribute & tamp level
3. Pull to **~36 g** out in **25–30 s**

### Grind reference

| Drink        | Grind    | Ratio | Time   |
| ------------ | -------- | ----- | ------ |
| Espresso     | Fine     | 1:2   | 25–30s |
| Pour-over    | Medium   | 1:16  | 3:00   |
| French press | Coarse   | 1:12  | 4:00   |

### Opening checklist

- [x] Flush the group heads
- [x] Calibrate the grinder
- [ ] Steam pitcher rinse
- [ ] Update the specials board

### Tasting code

```js
const shot = { dose: 18, yield: 36, seconds: 27 };
const ratio = shot.yield / shot.dose;   // 2.0
console.log(`1:${ratio.toFixed(1)} in ${shot.seconds}s`);
```

Links: [the whole family](https://file-viewer.us/) · inline `code` · ~~decaf~~.
