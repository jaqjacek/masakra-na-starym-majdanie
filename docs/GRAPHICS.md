# Baza Grafik: Nocny Szturm MASAKRA na Starym Majdanie

Prompty i status assetów (Nanobanana 2 / Imagine). Gra w v1.21.0 używa plików z `src/assets/icons/` i `src/assets/img/`. Ten dokument **nie** blokuje pracy nad AI graczy.

**W grze już są:** ikony band i Jakuba (`*_128x128.png`, SVG), portrety generałów (`general_*_raw.jpg`), tło planszy (5 locale), okładka, przykłady punktacji i fazy Jakuba, panele, popupy wydarzeń.

Poniższe statusy `do generacji` / `do dopracowania` dotyczą wariantów i key artu, nie runtime.

## 1. Logo / Okładka Główna (Key Art)
*   **Nazwa:** `main_logo_masakra_pro`
*   **Cel:** Ikoniczna grafika tytułowa (Key Art) wysokiej jakości.
*   **Opis:** Późna noc. Głównym elementem jest rozpadająca się drewniana chałupa w stylu PRL. W otwartych drzwiach stoi Jakub: stary dziad w radzieckiej uszatce, z kożuchem zarzuconym na ramiona i w gumofilcach. Ma szyderczy, złośliwy uśmiech, stoi w rozkroku, trzymając oburącz starą siekierę. Na udeptanej ziemi przed nim widać cztery wyraźne cienie postaci spoza kadru: muskularnego wilkołaka, ducha w prześcieradle ze szpiczastym czubem i łańcuchami, wampira z wysokim kołnierzem i szpiczastymi uszami, oraz innego dziada z rozbitą butelką nad głową. Całość oświetla jedna pochodnia przy framudze, nadając scenie pomarańczową poświatę.
*   **Styl:** `oil-painting` / `modern` (wysoki detal, filmowe oświetlenie, tekstura starego płótna).
*   **Prompt:** `A high-contrast, dark atmospheric horror oil painting in a gritty, rural style. The composition is a direct, symmetric front-facing view of a decaying wooden PRL-era cabin that fills the entire width of the frame. The cabin features small, grime-covered windows on both sides of the central doorway. In the center, Jakub—an 80-year-old, extremely skinny but wiry man—stands in the open doorway in a wide, aggressive power-stance with his legs spread far apart, his knees deeply bent into a slight squat, and his body hunched and leaning forward as if ready to pounce. He wears a tattered Soviet-style ushanka and a heavy, dirty sheepskin coat (kożuch) over his broad, bony shoulders. He holds a rusted, notched executioner's axe with both hands, his face fixed in a wide, malicious, sinister grin with narrow sly eyes. A single flickering torch on the door frame casts a violent orange glow over him and a rusted horseshoe nailed upright to the door. In the foreground, four figures are closing in, symmetrically arranged to leave a clear path of cracked dirt in the center twice the width of the doorway: on the far left, a massive naked werewolf with a wrestler's physique tilted back in a howling pose, and a sheet-ghost with a tall pointed hood clutching heavy rusted chains; on the far right, a tall vampire with an exaggerated high collar stretching his hands toward Jakub, and a ragged old man in a beret holding a nail-studded wooden plank high in one hand and a pocket knife in the other. All figures are lunging toward the center doorway. The surrounding neglected farmstead and dark forest are only slightly visible in the thick midnight fog and darkness. Heavy impasto brushstrokes, gritty Polish rural horror aesthetic.`

*   **Status:** `do generacji` (wersja PRO)

## 2. Bandy - Pionki (Pawns)
*   **Styl wspólny:** `vintage` / `sketch` (stylizowane na ilustracje z tanich gazet lub kronik milicyjnych z lat 80.).

### A. Wampiry (Arystokracja w błocie)
*   **Prompt:** `A vintage, grainy illustration of a vampire in a tattered, outdated 19th-century tuxedo, stuck in deep mud in a rural Polish field. He looks miserable and out of place in a PRL-era village. Dark, sketchy art style.`
*   **Status:** `do dopracowania`

### B. Wilkołaki (Wiejskie Burki)
*   **Prompt:** `A skinny, mangy werewolf with matted fur, wearing a torn socialist-era worker's cap. He is sitting near a pile of old tires and scrap metal, looking confused. Grainy, black and white vintage photo style.`
*   **Status:** `do dopracowania`

### C. Duchy (Zjawy z PGR-u)
*   **Prompt:** `Translucent, eerie ghosts of former collective farm workers (PGR), wearing spectral flat caps and work jackets. They are floating over a foggy, barren field. Muted blue tones, vintage horror aesthetic.`
*   **Status:** `do dopracowania`

### D. Bardakowie (Lokalna Patologia)
*   **Prompt:** `A group of mean, dirty village thugs from the 1980s, wearing flat caps and cheap jackets, holding blunt tools and bottles. They are standing in front of a concrete pigsty. Gritty, realistic but grotesque style, characteristic of Andrzej Pilipiuk's world.`
*   **Status:** `do dopracowania`

## 3. Inne Elementy UI

### A. Szyld Tytułowy
*   **Nazwa:** `TITLE`
*   **Cel:** Główny szyld tytułowy gry.
*   **Opis:** Drewniany szyld wypełniający cały kadr. Jasne drewno, lekko pożółkłe. Napis wypalony gorącym pogrzebaczem, podzielony na 3 linie. Każda linia zajmuje ok. 30% wysokości i jest wycentrowana. Tekst: "AMMENNY ZAJAZD" (linia 1), "NA" (linia 2), "STARYM MAJDANIE" (linia 3). Czcionka: późny średniowieczny gotyk.
*   **Styl:** `vintage` / `modern` (realistyczna tekstura drewna i śladów wypalenia).
*   **Prompt:** `A close-up, full-frame shot of a weathered, slightly yellowed light wooden plank. The wood has a visible grain and minor cracks. In the center, text is deeply burned into the wood with a charred, blackened finish as if made by a hot iron poker. The text is divided into three centered lines, with each line occupying approximately 30% of the vertical space. The font is a late medieval Gothic blackletter style. Line 1: "AMMENNY ZAJAZD", Line 2: "NA", Line 3: "STARYM MAJDANIE". The lighting is natural, highlighting the texture of the wood and the depth of the burned letters. No extra elements, just the wooden sign with the text.`
*   **Status:** `do generacji`

### B. Podtytuł (Overlay)
*   **Nazwa:** `TITLE_LAYER_2`
*   **Cel:** Warstwa z podtytułem nakładana na szyld.
*   **Opis:** Ręcznie namalowany napis czerwoną krwistą farbą: "MASAKRA". Z liter spływają pionowe zacieki świeżej farby. Napis powinien być agresywny, nieregularny, kontrastujący z tłem.
*   **Styl:** `abstract` / `modern` (wysoki kontrast, tekstura farby).
*   **Prompt:** `The word "MASAKRA" hand-painted in a thick, visceral, blood-red paint. The letters are aggressive, irregular, and slightly messy. Long, realistic drips and streaks of wet red paint run down vertically from the bottom of each letter, creating a gruesome, horror-themed effect. High contrast, sharp focus on the texture of the paint. The background should be a simple neutral or transparent-ready surface to allow for easy compositing. Gritty horror aesthetic.`
*   **Status:** `do generacji`

## 4. Ikony UI (Bandy)
*   **Styl wspólny:** Minimalistyczny, 2-kolorowy design UI, wysoki kontrast, grube obramowania (stroke), styl wektorowy.

### A. Wampir (Vampire)
*   **Opis:** Kwadratowa ikona z grubą czarną ramką i solidnym czerwonym tłem. W centrum czarna sylwetka głowy wampira o spiczastych uszach i wysokim, sztywnym kołnierzu peleryny. Dwa ostre, białe kły są wyraźnie widoczne. Ikona powiększona o 20%, wypełniająca cały rozmiar ikony.
*   **Status:** `wygenerowano`

### B. Wilkołak (Werewolf)
*   **Opis:** Kwadratowa ikona z grubą czarną ramką. Brązowo-pomarańczowe tło (jaśniejsze, bardziej UI-like). W centrum czarna sylwetka włochatego wilkołaka z wyraźnie wygiętym kręgosłupem, w pose wycia do księżyca. Płaski design, grube pociągnięcia.
*   **Status:** `wygenerowano`

### C. Duch (Ghost)
*   **Opis:** Kwadratowa ikona z grubą białą ramką na solidnym czarnym tle. W centrum biała sylwetka duszka (kształt prześcieradła) z rękami i przerażającym wyrazem oczu (czarne otwory). Wysoki kontrast, gładka sylwetka.
*   **Status:** `wygenerowano`

### D. Bardak (Bardak)
*   **Opis:** Kwadratowa ikona z czarną ramką na tle w odcieniach mysiej szarości. Przedstawia mężczyznę w berecie z wrednym wyrazem twarzy, zarośniętą brodą i posturą neandertalczyka. Ciemnoburaczkowy nos, proste wąsy. Jasno srebrny kolor sylwetki kontrastujący z czernią elementów twarzy.
*   **Status:** `wygenerowano`

### E. Jakub (Jakub)
*   **Opis:** Kwadratowa ikona z grubą czarną ramką na solidnym żółtym tle. W centrum czarna sylwetka skrzyżowanych wideł (pitchforks) ustawionych po skosie (diagonal). Płaski, agresywny design 2-kolorowy.
*   **Prompt:** `A minimalist square UI icon with a thick black border. Solid yellow background. In the center, a black silhouette of a pair of rustic wooden pitchforks crossed diagonally. Flat 2-color design, thick strokes, clean vector aesthetic, high contrast. --style modern --type ui-element`
*   **Status:** `do generacji`

## 5. Tło Planszy / Board Background

### A. Mapa podwórka Starego Majdanu
*   **Nazwa / Name:** `board_background`
*   **Baza bez napisów / Unlabeled base:** `src/assets/img/board_background_base.jpg`
*   **Warianty językowe / Localized files:**
    *   `board_background_pl.jpg` — Stodoła, Kurna chata, Warzywnik, Studnia, Antałki, Kopa siana, Kompost, *Stary Majdan*; róża: Pn / E / Pd / W
    *   `board_background_en.jpg` — Barn, Smoke cottage, Vegetable patch, Well, Kegs, Haystack, Compost, *Old Majdan*; N / E / S / W
    *   `board_background_cs.jpg` — Stodola, Kouřová chalupa, Zahrádka, Studna, Sudy, Kupa sena, Kompost, *Starý Majdan*; S / V / J / Z
    *   `board_background_uk.jpg` — Стодола, Курна хата, Город, Криниця, Бочки, Копа сіна, Компост, *Старий Майдан*; Пн / Сх / Пд / Зх
    *   `board_background_tlh.jpg` — tIr qach, tlhIch juH, naH yotlh, ngeng, HIq balmey, magh yuvtlhe', veQ yuvtlhe', *majDan qan* (pIqaD); Dung / nIH / bIng / poS
    *   `board_background.jpeg` — kopia wariantu PL (kompatybilność wsteczna)
*   **Cel / Purpose:** Tło pod siatką 6×6. Sama grafika **nie** rysuje kratek — sektory nakłada CSS. Napisy i róża wiatrów **nie** są w modelu obrazu: baza jest pusta, etykiety i geometria róży składa `scripts/compose_board_backgrounds.py`.
*   **Opis:** Kwadratowa mapa w stylu starego, poplamionego pergaminu. Czarny tusz, kreska jak drzeworyt. Podwórko ogrodzone płotem z żerdzi, otwarte od dołu. Góra-lewo: **stodoła** z dziurą w słomie. Góra-prawo: **kurna chata**. Środek: **studnia**. Lewo: **warzywnik**. Prawo: **kopa siana** i **antałki**. Dół-lewo: **kompost**. Dół-środek: zwalony płot. Dół-prawo: **róża wiatrów 8-kierunkowa**, północ u góry. Tytuł na dołu. Bez postaci i bez siatki sektorów.
*   **Description:** Square farmyard map on stained parchment, black ink woodcut. Wattle fence open at the bottom. Barn, smoke cottage, well, vegetable patch, haystack, kegs, compost, collapsed fence. An 8-point compass rose with north at the top is drawn in code (not by the image model). Title at the bottom. No characters, no sector grid.
*   **Róża wiatrów / Compass:** Kod, nie prompt. 8 ramion, dłuższe ramię północy, północ zawsze u góry. Etykiety zależą od języka (patrz lista plików).
*   **Styl / Style:** `ink-sketch` / `parchment-map`
*   **Prompt (tylko baza, bez liter):** `A square top-down illustrated map of a neglected rural Polish farmyard on stained aged parchment, drawn as high-contrast black ink woodcut sketch lines. A rustic wattle-and-rail fence encloses the yard on the top and sides and opens at the bottom. Top-left: a dilapidated thatched barn with a large hole in the roof, open barn doors, and a wooden trough. Top-right: a small thatched smoke-cottage with tiny windows and a damaged roof. Exact center: a round stone well with a wooden sweep. Mid-left: a tangled vegetable patch. Mid-right: a haystack and three wooden kegs, one smashed on its side. Bottom-left: a compost heap. Bottom-center: a pile of broken fence boards. Bottom-right is empty stained parchment. No letters, no numbers, no compass, no people, no grid.`
*   **Użycie / Usage:** `src/assets/css/board.css` — `html[lang] .board`. Przebudowa: `python3 scripts/compose_board_backgrounds.py`
*   **Status:** `wygenerowano` (baza + 5 locale)

---
*Plik stworzony: 19.04.2026*
*Aktualizacja: 15.08.2026 — tło planszy, poprawiona róża wiatrów, warianty PL/EN/CS/UK/TLH.*
*Status docs 2026-10-06: v1.21.0; runtime assety w `src/assets/`; następna praca to AI graczy, nie grafika.*
