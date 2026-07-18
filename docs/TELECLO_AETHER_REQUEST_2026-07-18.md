# Message To TeleClo: Aether Style Slice

Use this as the next message to TeleClo.

```text
Принято. Сухой UI-pack routing smoke без генерации принят.

Запиши, пожалуйста, этот smoke result как green для Kingdom Duel route:
- active skill: asset-pack-pipeline v9;
- route: ui_pack;
- scope: ordinary 2D UI/gameplay asset;
- not character animation;
- no generation happened during smoke.

Production scope пока сужаем до одного style-slice:

1. Сначала только `public/assets/gems/aether.webp`.
2. После ревью и утверждения Aether — отдельно пойдём к `glass-ward`, `sun-bloom`, `crown-strike`.
3. Enemy icons, overlays, portraits, arena/world frame — не сейчас.

После записи green-result переходи к Aether candidate.

Требования к Aether:
- final runtime path: `public/assets/gems/aether.webp`;
- square source, желательно 512x512+ master;
- WebP final;
- special 5+ match tile;
- magical prism / star-core / rainbow glass charge;
- AeroCandy / Frutiger Aero glossy glass;
- должен отличаться от Sun, Moon, Crown и Shade на 36-44 px;
- strong silhouette, no tiny illustration detail;
- no embedded text;
- no baked tile frame / UI chrome.

Review artifact:
- 1-3 Aether candidates;
- thumbnail/contact sheet at примерно 36-44 px;
- dimensions + alpha/background note;
- recommendation which candidate to integrate first.

Не делай пока полный pack и не генерируй spell icons до Aether review.
```
