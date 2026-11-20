# Cigario — CEO-approved visual design contract (LOCKED)

**Approval source:** the six-phone “Cigario · Common Inventory Flow” presentation approved by the CEO in conversation on November 19, 2026. The repository's original master reference is `cigario_luxury_inventory_app_flow.png` supplied in conversation; it must be copied to the team's licensed design asset store and version-controlled under `design/reference/` before visual sign-off. **Do not reconstruct or substitute the reference using AI without approval.**

## Non-negotiable visual identity

| Token | Baseline | Role |
|---|---|---|
| `--bg` | `#101a15` | nearly-black deep forest-green shell |
| `--surface` | `#1a3023` | primary green elevated cards |
| `--surface-2` | `#203927` | actions/selected controls |
| `--ivory` | `#f8f0e2` | editorial detail cards and forms |
| `--ivory-2` | `#e9dfcf` | neutral secondary card |
| `--gold` | `#c89a59` | bronze/gold primary accent |
| `--gold-light` | `#e4bc7e` | highlights and icon details |
| `--ink` | `#19251d` | content text on ivory |
| `--white` | `#faf5ea` | high-contrast text on dark |
| `--muted` | `#b5b9a9` | secondary text |

These are **implementation samples approximated from the approved raster**, not guaranteed original design-source values. Adjust only during pixel-comparison review with the actual reference and CEO approval.

### Typography
- Serif editorial headlines and Cigario wordmark (Georgia as fallback until font rights/identity confirmed).
- Crisp sans-serif UI labels, tabular inventory totals, compact metadata.
- Weight hierarchy not artificial all-caps everywhere.

### Geometry
- Bottom bar: 5 equally weighted destinations: Discover · Scan · Humidor · Journal · Account.
- Approximate 18–22 px content radius, 10–14 px input radius, 44 px minimum tap targets.
- Ivory inner detail/form panels against forest-green shells.
- Full-bleed cinematic cigar photography only where licensed; preserve legibility and load performance.
- Safe areas on iOS and Android; scrollable views never obscured by navigation.
- Keep stages consistent: Home → Search → Detail → Add → Humidor → Lot Review.
- Use restrained bronze chevrons/dividers and micro-interactions. Support reduced motion.

### Screens to QA
1. Discover Home: name, search, search/scan/review CTAs, humidor totals.
2. Search: query, filter chips, product rows, descriptors, bookmark.
3. Cigar Detail: large hero, strength, notes, wrapper/binder/filler, Add to Humidor.
4. Add to Humidor: quantity, format, acquisition date, cost basis, location, source, notes, save.
5. My Humidor: search, filter, lot cards, in-stock count, acquisition date, storage location.
6. Item Review/Journal: Overview/Journal/History, stock, personal review, consumption event.

### Change control
A UI change is blocked if it replaces dark green/ivory/copper, removes a core screen, changes the bottom navigation model, or noticeably alters the reference's information hierarchy. Use screenshots of iPhone and Android target viewports, compare with CEO-approved reference, document deliberate deviations in a design decision record.

No arbitrary light-mode conversion or dramatic rebrand. Accessibility fixes are permitted but must stay visually coherent.
