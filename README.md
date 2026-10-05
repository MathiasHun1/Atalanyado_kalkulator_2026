# 2026-os átalányadó-kalkulátor

Magyar nyelvű, böngészőben futó Angular 22 és Angular Material alkalmazás átalányadózó egyéni vállalkozók 2026-os bevételének és közterheinek áttekintésére.

## Indítás

```bash
npm install
npm start
```

Ezután a `http://localhost:4200/` címen használható. Az alkalmazás nem hív API-t; a bevitt adatok verziózott sémával a böngésző `localStorage` tárában maradnak. Az „Adatok törlése” gomb visszaállítja az alapállapotot.

## Ellenőrzés

```bash
npm test -- --watch=false
npm run build
```

A számítás a `src/app/calculator.ts` tiszta függvényében van. A `calculator-state.service.ts` kezeli a signal állapotot, a validációt és a helyi mentést. A felület külön beállítás-, havi adat- és összesítő komponensekből áll. A tesztek között szerepel a NAV tájékoztató 8–9. oldali negyedéves mintája.

## Forrás és határok

Az alkalmazás kizárólag a 2026-os évre készült. A szabályok elsődleges forrása a [NAV 100. információs füzetének 2026. február 20-i változata](https://nav.gov.hu/pfile/file?path=/ugyfeliranytu/nezzen-utana/inf_fuz/2026/100.-Az-egyeni-vallalkozok-atalanyadozasanak-alapveto-szabalyai-2026.-02.-20). A kalkulátor tájékoztató jellegű; a fő korlátok és a bevételi értékhatár figyelmeztetése a felületen olvashatók. Bevallás előtt az eredményt a NAV adataival egyeztetni kell.
