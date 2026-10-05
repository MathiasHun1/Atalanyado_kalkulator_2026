# 2026-os átalányadó-kalkulátor – megvalósítási terv

## Cél és kiindulópont

Készíts működő, magyar nyelvű, böngészőben használható Angular alkalmazást, amely a `C:\Users\Lenovo T14\Downloads\atalanyado_2026_kalkulator.xlsx` munkafüzet számításait és kitöltési lehetőségeit reprodukálja. A cél a 2026-os átalányadózó egyéni vállalkozó bevételének, jövedelmének, szja-előlegének, tb-járulékának és szochójának havi, negyedéves és éves áttekintése. A projektben jelenleg csak az Angular CLI kezdőalkalmazása van; a `package.json` Angular 22.2.x-et, TypeScript 6.0.x-et és Vitestet tartalmaz.

**Ebben a tervben nincs alkalmazáskód.** A következő session feladata az implementáció.

Az Excel az elvárt működés referenciaanyaga, de az adószabályoknál a NAV 2026-os tájékoztatója az elsődleges forrás:

- [NAV 100. információs füzet, 2026](https://nav.gov.hu/pfile/file?path=%2Fugyfeliranytu%2Fnezzen-utana%2Finf_fuz%2F2026%2F100.-Az-egyeni-vallalkozok-atalanyadozasanak-alapveto-szabalyai-2026.-02.-20.) – különösen 2–4. oldal (bevételi értékhatár, költséghányad, adómentes rész), 6–9. oldal (göngyölítés és minimumalap), 12. oldal (mellékállás és nyugdíjas jogállás).
- A felhasználó által adott PDF 8–9. oldalán a NAV számítási mintája szerepel: `C:\Users\Lenovo T14\Downloads\100 Az egyéni vállalkozók átalányadózásának alapvető szabályai 20260114.pdf`.

Az app 2026-ra szól; ne általánosítsuk automatikusan más adóévekre.

## Funkciók

### Beállítások

Az Excelnek megfelelően választható legyen:

| Mező | Alapérték | Megjegyzés |
| --- | ---: | --- |
| Jogállás | Főfoglalkozású | Választék: főfoglalkozású, heti 36 órás munkaviszony vagy nappali tanulmányok melletti („mellékállású”), saját jogú nyugdíjas. Az első verzióban az egész évre egyetlen jogállás érvényes. |
| Minimumalap típusa | Garantált bérminimum | A felhasználó jelezte, hogy rá ez vonatkozik; általános használatra a minimálbér is választható. |
| Költséghányad | 45% | Választék: 45%, 80%, 90%. A jogosultságot a felhasználó állapítja meg a tevékenysége alapján. |
| Átalányadózás aktív napjai | 365 | A bevételi értékhatár időarányosításához; 2026 nem szökőév. |

Rögzített 2026-os paraméterek: minimálbér **322 800 Ft/hó**, garantált bérminimum **373 200 Ft/hó**, adómentes átalányjövedelem **1 936 800 Ft**, szja **15%**, tb **18,5%**, szocho **13%**. A havi minimumalap a választott bérminimum; 2026-ban a szochónál nincs 112,5%-os szorzó. Ezeket egy jól látható „2026-os szabályok” területen mutassa az app.

### Havi bevitel

Mind a 12 hónaphoz:

1. Megszerzett vállalkozói bevétel, egész forint; az üres mező jelentése „még nincs kitöltve”, a `0` jelentése valódi nulla bevétel.
2. Volt-e legalább egy napig biztosítási jogviszony az adott hónapban (`igen`/`nem`). Az Excelben ez `1`/`0`.
3. A minimumalaphoz figyelembe veendő napok száma, 0–30. Teljes biztosított hónap: 30. Jogosító kieső időnél – például február 4–28. közötti táppénznél – 3. Teljes havi szünetelésnél biztosított = nem és napok = 0. **Részleges szünetelés önmagában nem arányosítja a minimumalapot:** ilyenkor 30 nap.
4. Szabad szöveges megjegyzés a kieső időhöz vagy szüneteléshez.

Egyértelműen jelölje a bevitel és a számított értékek közti különbséget. A táblázat mobilon is használható legyen, szükség esetén vízszintes görgetéssel vagy havi kártyanézettel.

### Számított mezők

Havonta: átalányban megállapított jövedelem, év eleje óta göngyölt átalányjövedelem, havi adóköteles jövedelem, göngyölt adóköteles jövedelem, negyedéves göngyölítésből kapott havi alap, tényleges tb-/szocho-alap, havi szja, tb, szocho, összes közteher.

Összesítések: negyedévenként szja-előleg/tb/szocho/összesen; az eddig kitöltött hónapok összege és a teljes év összege, ha mind a 12 hónap ki van töltve. A bevételi értékhatár ellenőrzése látható figyelmeztetéssel. Ne nevezze „éves végösszegnek” a részben kitöltött év eredményét.

Magyarázó szöveg legyen közvetlenül a göngyölt alap mellett: **az adómentes határ átlépése nem emeli automatikusan a tb-t vagy a szochót**. A tényleges havi alap főfoglalkozásban a göngyölt havi alap és a havi minimum közül a nagyobbik. A korábbi negyedévekben már figyelembe vett minimumalapok is levonódnak a következő negyedév göngyölítéséből.

### A kitöltött táblázat letöltése PDF-ként

Legyen jól látható **„Letöltés PDF-ként”** gomb. A gomb a böngészőben aktuálisan látható, már újraszámolt adatokból készítsen ténylegesen letölthető PDF-fájlt; a felhasználónak ne kelljen nyomtatóként PDF-et választania. A PDF készítése helyben történjen, pénzügyi adatokat ne küldjön külső szolgáltatásnak.

A PDF tartalmazza a 2026-os címet, a készítés dátumát, a választott jogállást/költséghányadot/minimumalapot, a 12 havi bevitelt és számított értéket, a negyedéves és az éves vagy „eddig kitöltött” összesítést, a bevételi értékhatár állapotát, valamint rövid módszertani és korlátokra vonatkozó megjegyzést a NAV-forrás címével. Az üres hónapok maradjanak üresként jelölve, ne alakuljanak át 0 Ft-os hónappá. Hiányos negyedévnél a PDF is jelezze, hogy az érintett tb-/szochoeredmény még nem végleges; határtúllépésnél a figyelmeztetés a PDF-en is látszódjon.

A havi táblázat és az összesítések jól olvasható, többoldalas nyomtatási elrendezést kapjanak. A magyar ékezetek, a forintformázás, az oszlopfejlécek és az oldaltörések legyenek rendben; lehetőség szerint kijelölhető szöveg kerüljön a PDF-be. Javasolt fájlnév: `atalanyado-kalkulator-2026-ÉÉÉÉHHNN.pdf`. Az export ugyanazt a számítási eredményt használja, mint a képernyő, nem vezet be külön adóképleteket.

## Számítási szabály és sorrend

Az összes pénzösszeget egész forintként kezeld. Az Excel `ROUND(...,0)`-jával egyező kerekítést alkalmazd a nemnegatív összegekre. A számítást tiszta, Angular-független függvényekben végezd; a megjelenítés csak ezek eredményét fogyassza.

1. **Havi jövedelem** = kerekítés(`havi bevétel × (1 − költséghányad)`).
2. **Göngyölt jövedelem** = januártól az adott hónapig számolt havi jövedelmek összege.
3. **Göngyölt adóköteles jövedelem** = max(0; göngyölt jövedelem − 1 936 800). **Havi adóköteles jövedelem** = aktuális göngyölt adóköteles − előző havi göngyölt adóköteles. Az első hónapnál az előző érték 0.
4. **Negyedéves göngyölített havi alap**: a negyedév utolsó hónapjáig göngyölt adóköteles jövedelemből vond le az év **korábbi negyedéveiben tényleges járulék-/szocho-alapként már figyelembe vett** összeget. A nemnegatív különbözetet oszd el a tárgynegyedév azon hónapjainak számával, amelyekben legalább egy napig fennállt a biztosítás; a hányadost egész forintra kerekítsd. Ha ilyen hónap nincs, az alap 0. Ezt a negyedéves havi átlagot rendeld a negyedév valamennyi biztosított hónapjához. A számítási függőség miatt a negyedéveket időrendben dolgozd fel.
5. **Tényleges havi alap**: főfoglalkozású és biztosított hónapban max(göngyölt havi alap; kerekítés(havi minimumalap × minimumhoz figyelembe veendő napok / 30)). Mellékállású és biztosított hónapban a göngyölt havi alap, kötelező minimum nélkül. Nyugdíjasnál vagy teljes hónapban nem biztosítottként 0. A 2026-os NAV tájékoztató szerint a tb és a szocho számítása itt azonos logikájú; a szochónál nincs 112,5%-os minimumszorzó.
6. **Havi közterhek**: szja = kerekítés(havi adóköteles jövedelem × 15%); tb = kerekítés(tényleges havi alap × 18,5%); szocho = kerekítés(tényleges havi alap × 13%). A havi és negyedéves összesítő a kerekített havi értékeket adja össze, az Excelnek megfelelően.
7. **Éves bevételi értékhatár**: 45% vagy 80% költséghányadnál 38 736 000 Ft × aktív napok / 365; a 90%-os, jogosult kiskereskedelmi esetnél 193 680 000 Ft × aktív napok / 365; az eredmény egész forintra kerekítve. Ha a bevétel nagyobb a határnál, mutass feltűnő figyelmeztetést: az átalányadózásra való jogosultságot ellenőrizni kell, és a normál kalkuláció nem tekinthető érvényes végleges eredménynek.

**Hiányzó adatok:** a negyedéves göngyölített és tényleges alapot csak akkor mutasd véglegesnek, ha az adott negyedév mindhárom bevételi mezője ki van töltve (a 0 is kitöltött érték). Előtte jelenjen meg „negyedév még hiányos” állapot. A havi szja a már megadott bevételekből kiszámítható, de a negyedéves és éves közteher-összesítést ne mutasd teljesnek.

## Magyarázat és korlátok a felületen

- Az adómentes 1 936 800 Ft az **átalányjövedelemre**, nem a bevételre vonatkozik.
- Főfoglalkozás esetén az adómentes jövedelemrész időszakában is lehet minimum tb- és szochofizetés.
- A 45%, 80%, 90% költséghányad feltételeit az app nem tudja tevékenységi kód nélkül ellenőrizni. A jogállásnak és a minimumalap típusának helyességét is a felhasználó állítja be.
- Az első verzió az Excelhez hasonlóan **nem kezeli** az szja-kedvezményeket, a családi járulékkedvezményt, a HIPA-t, az áfát, a nyugdíjas anyák különös szocho-szabályát, a jogállás/költséghányad évközi változását és a támogatások speciális bevételi kezelését. Ezeket a felületen, az eredmény mellett röviden jelezni kell.
- A „bevétel mínusz közteher” nem tényleges nettó nyereség: a valódi költségeket nem vonja le.
- Az app tájékoztató kalkulátor. A bevallás és a fizetés előtt a NAV-bevallás adataival egyeztetni kell. A forráslink és a 2026-os érvényesség látható legyen.

## Felhasználói élmény és adatkezelés

Egyetlen főoldal elegendő: fejléc és forrás, beállítások, havi táblázat, negyedéves összesítő, éves/eddigi összesítő, PDF-letöltés, módszertani magyarázat. Magyar forint formázás, egyértelmű mezőcímkék, billentyűzettel kezelhető mezők, hibajelzések a mezők mellett. A göngyölt havi alaphoz rövid „hogyan jött ki?” részletező nézet tartozzon: göngyölt adóköteles jövedelem, előző negyedévek tényleges alapja, biztosított hónapok száma, összehasonlítás a minimummal.

Az adatok alapértelmezés szerint a böngészőben maradjanak. Helyi automatikus mentés (`localStorage`) és „adatok törlése” művelet javasolt; ne küldje az adatokat szerverre. A mentett séma legyen verziózott, hogy későbbi változáskor biztonságosan kezelhető legyen. Más eszközön való folytatáshoz opcionális JSON export/import készülhet a fő funkciók után. A felhasználó valódi bevételi számait ne írjuk tesztbe vagy dokumentációba.

## Javasolt implementációs sorrend

1. Az Angular kezdőoldal cseréje a magyar nyelvű kalkulátor felületére; a meglévő projektbe dolgozz, ne inicializálj új projektet. A `package.json` most `untitled` néven tartja nyilván a projektet; ha átnevezed, az Angular konfigurációt és parancsokat következetesen igazítsd hozzá.
2. A beviteli adatok, szabályparaméterek és eredmények típusainak kialakítása. Válaszd külön a „hiányzó” és a `0` bevételt.
3. A fenti számítás tiszta függvényekben, negyedévenkénti sorrendben. A korábbi negyedévek **tényleges** alapja kerüljön levonásra; ez a kulcsszabály.
4. A beviteli mezők, validáció, számított havi sorok, negyedéves/éves összesítések, részletező magyarázat és forráslink kialakítása.
5. Helyi mentés és visszatöltés; részben kitöltött negyedév és határtúllépés látható állapotai.
6. PDF-export a számítás közös eredményéből; magyar karakterek, hosszú havi táblázat, többoldalas tördelés és hiányos év állapotának kezelése.
7. Célzott automatikus tesztek, majd `npm test` és `npm run build`. Végül kézi ellenőrzés asztali és mobil szélességen, valamint a letöltött PDF megnyitása és összevetése a képernyővel.

## Elfogadási ellenőrzések

1. **NAV 8–9. oldali minta:** a PDF-ben szereplő havi átalányjövedelmek és a 322 800 Ft-os minimum mellett a kumulált tényleges alap az I. negyedév végén 677 880 Ft, a II. végén 1 646 280 Ft, a III. végén 2 291 880 Ft, a IV. végén 3 217 240 Ft. A III. negyedévi göngyölt havi alap 83 460 Ft, a IV. negyedévi 40 440 Ft. A februári 3 minimum-napot, az egész augusztusi szünetelést és a decemberi 26 minimum-napot is ellenőrizd.
2. **Garantált bérminimum:** ha a főfoglalkozású vállalkozó 2026-ban teljes hónapban biztosított és a göngyölt alap kisebb a minimumnál, a tényleges alap 373 200 Ft, a tb 69 042 Ft, a szocho 48 516 Ft/hó.
3. **Keretátlépés önmagában nem elég:** szintetikus adattal igazold, hogy az szja-köteles jövedelem megjelenhet, miközben a tb/szocho még a minimumon marad, mert a korábbi negyedévek tényleges alapját le kell vonni.
4. **Minimum fölé emelkedés:** olyan bevétellel is tesztelj, ahol a göngyölt havi alap meghaladja a választott minimumot; ilyenkor a tényleges alap és mindkét közteher nő.
5. **Jogállások:** mellékállásúként nincs kötelező havi minimum; nyugdíjasként a normál tb és szocho 0. Az éves szja-számítás jogállástól függetlenül működik.
6. **Hiányzó hónap, nulla hónap, szünetelés:** az üres bevétel ne legyen egyenértékű a nullával; teljes havi szünetelésnél nincs havi járulékalap; részleges szünetelés ne csökkentse automatikusan a minimumalapot.
7. **Határok és kerekítés:** 1 936 800 Ft adómentes jövedelem pontos határa, 45/80/90% választás, időarányos bevételi limit és a havi, majd összesített kerekítések egyezzenek az Excellel.
8. **PDF-letöltés:** a gomb `.pdf` fájlt tölt le; a fájl megnyitható, a 12 hónap és az összesítés olvasható, az ékezetek helyesek, és a számok megegyeznek a képernyőn látottakkal. Külön ellenőrizd teljesen kitöltött és részben kitöltött évvel, valamint bevételihatár-túllépés esetén. A PDF-készítés közben nincs hálózati kérés a pénzügyi adatokkal.

## Elkészültnek akkor tekinthető

A felhasználó a 12 hónapot kitöltheti, az eredmény minden változtatásra újraszámolódik, a számítás magyarázható, a részleges év nincs teljes évként feltüntetve, a releváns korlátok és NAV-forrás láthatók, a helyi mentés és a kitöltött táblázat PDF-letöltése működik, és a fenti ellenőrzések, a teszt és a build sikeresek.
