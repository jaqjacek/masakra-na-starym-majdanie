# MASAKRA na Starym Majdanie: Oficjalne Zasady Gry v1.19.0

## Cel Gry
Wędrowycz-Gemini to gra strategiczna, w której gracze (Hersztowie) dowodzą czterema bandami: Wampirami, Wilkołakami, Duchami i Bardakami. Celem jest zdobycie jak największej liczby punktów zwycięstwa w ciągu 12 rund, unikając furii Jakuba Wędrowycza.


## Elementy Gry
*   **Plansza:** Siatka 6x6 regionów, na której toczy się walka.
*   **Zastępy plugastw Nocy:** Wampiry (V), Wilkołaki (W), Duchy (G) oraz Bardaki (B) walczące o dominację.
*   **Jakub:** Unikalny pionek, który niszczy wszystko na swojej drodze.
*   **Panel Jakuba:** Boczny panel zarządzania statystykami i furią Jakuba Wędrowycza.
*   **Panel posiłków Band:** Panel wskazujący limit i stan pionków poszczególnych band na planszy.
*   **Zestawy (Taktyczne Oddziały Szturmowe):** Pojedyncze małe taktyczne oddziały szturmowe składające się z członków różnych band. Za wystawienie takiego oddziału na planszę hersztowie poszczególnych band otrzymują punkty zwycięstwa.

## Przebieg Gry
Gra toczy się przez **12 rund**. Każda runda składa się z pięciu faz:

### Główne pojęcia

*   **Geometria Planszy (Sąsiedztwo i Odległość):**
    *   **Sąsiedztwo:** Dwa sektory sąsiadują ze sobą, jeśli stykają się wspólną krawędzią (bokiem) lub wspólnym rogiem. Sektory mogą mieć od 3 do 8 sąsiednich sektorów.
    *   **Odległość:** Odległość między sektorami mierzona jest w krokach. Przejście do dowolnego sąsiadującego sektora — w pionie, poziomie lub na ukos (po skosie) — zajmuje dokładnie 1 krok. Odległość między dwoma polami to najmniejsza liczba takich kroków, by dotrzeć z jednego do drugiego.
    *   **Odległość od Jakuba:** Dystans mierzony w krokach między polem, na którym stoi Jakub, a sektorem docelowym, w którym umieszczany jest zestaw.
*   **Hierarchia Band (Starszeństwo):**
    Rozstrzyga wszelkie sytuacje remisu w grze. Starszeństwo band od najwyższego do najniższego:
    **Wampiry > Wilkołaki > Duchy > Bardaki**
*   **Zasada Remisu:**
    W przypadku remisu (np. przy rozstrzyganiu punktów lub na koniec gry), postępujemy według **Hierarchii Band**. Wybór celów Jakuba podlega specjalnej **Kaskadowej** procedurze rozstrzygania remisu (patrz: Szczegółowe Zasady Ruchu i Walki Jakuba).
*   **Furia (Gniew Jakuba):**
    Wskaźnik określający poziom agresji Jakuba wobec danej bandy. Każdy zlikwidowany przez niego pionek danej bandy zmniejsza furię na tę bandę o 1. Gdy furia spadnie do 0, Jakub przestaje ją ścigać i atakować. Oznacza to, że wartość furii wyznacza maksymalną liczbę pionków danej bandy, jaką Jakub może zabić w danej rundzie.
*   **Zasięg Jakuba:**
    Zasięg Jakuba to domyślnie sektor w którym stoi i sektory w odległości 1. Odległość ta zwiększana jest o 1 za każdą nację której poziom Furii > 9. Maksymalny zasięg wynosi 5.
*   **Wizualizacja odległości:**
    ![Przykłady odległości](../src/assets/img/board_distance_example.png)
    *Przykłady odległości. Wampir jest w regionie z Jakubem czyli jest w odległości 0. Wilkołaki są w odległości 1, Duchy są w odległości 2, Bardaki są w odległości 3.*


### Faza I: Przygotowanie
1.  **Rozdysponowanie Zestawów:** Każdy gracz otrzymuje zestawy pionków z talii dobierania. Gracze dążą do posiadania optymalnych kombinacji jednostek.
2.  **Zasoby Jakuba:** Jakub również pobiera 2 zestawy, które zwiększą jego agresję w danej rundzie.
3.  **Punkty Początkowe:** W pierwszej rundzie każdy gracz zaczyna z 20 punktami.

### Faza II: Faza Hersztów (Wybór Dowództwa)
Na początku tej fazy wszyscy dotychczasowi Hersztowie wracają do wspólnej puli wyboru. Następnie gracze ustalają kolejność na podstawie bieżących punktów zwycięstwa. W odwrotnej kolejności – od gracza z najmniejszą liczbą punktów (ostatniego) do lidera (pierwszego) – każdy wybiera jednego wolnego Herszta (bandę). Wybrany Herszt decyduje o tym, za pionki której bandy gracz będzie otrzymywał punkty chwały (przy wystawianiu zestawów) lub tracił je (w przypadku czystki Jakuba) w bieżącej rundzie.

### Faza III: Faza Graczy
Gracze wykonują tury naprzemiennie (wg aktualnej kolejności):
1.  **Akcja:** Gracz może wystawić zestaw pionków w regionie, w którym nie ma pionków żadnej bandy (sektor z samym Jakubem zalicza się jako pusty region; pod warunkiem, że w puli posiłków znajduje się wystarczająca liczba pionków dla każdej z band reprezentowanych w tym zestawie, aby w pełni go skompletować – jeśli brakuje pionków chociaż jednej z tych band, wystawienie zestawu jest niedozwolone) lub podkablować nim Jakubowi. Podkablowanie zestawu odbywa się jawnie, a Furia Jakuba na poszczególne bandy oraz jego zasięg są aktualizowane na bieżąco (za każdy pionek danej bandy znajdujący się w tym zestawie).
2.  **Punktacja Natychmiastowa (Rozproszona):** Punkty otrzymują wszyscy Hersztowie za pionki swojej bandy z wystawionego zestawu, zgodnie z logiką danej bandy. Gracz wystawiający nie musi otrzymać żadnych punktów, jeśli w zestawie nie ma pionków jego bandy.
3.  **Pasowanie:** Gracz może spasować. Musi wtedy odrzucić nadmiarowe zestawy (zostawiając max 3). Za każdy odrzucony zestaw otrzymuje +1 pkt, podkablowując nim Jakubowi (każdy pionek w zestawie zasila furię Jakuba na odpowiednią bandę – to podkablowanie również odbywa się jawnie, a Furia i zasięg Jakuba są aktualizowane na bieżąco).

### Faza IV: Faza Jakuba
Po spasowaniu wszystkich graczy, Jakub rusza do akcji:

1.  **Zasilanie Furii:** Jakub absorbuje zestawy pobrane na starcie rundy oraz te odrzucone przez graczy. Każdy pionek zwiększa Furię na daną bandę.
    *   **Zasięg:** Zasięg Jakuba to teraz **1 + liczba band, na które Furia wynosi > 9**.
    *   Maksymalny zasięg Jakuba to **5**.
2.  **Czystka:** Jakub zabija pionki w swoim regionie. Za każdego zabitego pionka, aktualny Herszt tej bandy traci 1 punkt (szczegółowe zasady i rozliczanie furii znajdują się w sekcji Szczegółowe Zasady Ruchu i Walki Jakuba).
3.  **Ruch i Łowy:** Jakub skanuje regiony w swoim zasięgu i przemieszcza się do nowego sektora (szczegółowe zasady wyboru celu, ruchu i rozstrzygania remisów opisano w sekcji Szczegółowe Zasady Ruchu i Walki Jakuba). Przed każdym ruchem na nowo wyliczany jest aktualny zasięg Jakuba.
4.  **Koniec Fazy:**
    *   **Bonus za Przetrwanie:** Jeżeli po zakończeniu ruchu i czystki Jakuba, w jego aktualnym regionie znajdują się jakiekolwiek pionki graczy, ich aktualny Herszt otrzymuje **2 punkty bonusowe** za każdy taki pionek.
    *   **Reset Zasięgu:** Po zakończeniu akcji Jakuba, jego **zasięg wraca do 1**.
    *   Zestawy Jakuba trafiają na stos kart odrzuconych.
    *   **Rundy 1-11:** Hersztowie wracają do puli. Kolejność graczy: najmniej punktów = pierwszy.
    *   **Runda 12:** Gracze **zachowują** swoich Hersztów do ostatecznego punktowania.

### Faza V: Faza Wydarzeń
Odkrywamy wydarzenie, które wpływa na obecny stan planszy.

## Zakończenie Gry i Punktacja Końcowa
Po zakończeniu fazy Jakuba w **12. rundzie**, następuje ostateczne podsumowanie. Gracze otrzymują bonusy za bandy, którymi dowodzili w ostatniej rundzie:
1.  **Wampiry:** 2 punkty za każdy region, w którym znajduje się co najmniej jeden wampir (niezależnie od ich liczby w danym regionie).
2.  **Wilkołaki:** 1 punkt za każdy swój pionek na planszy.
3.  **Duchy:** 2 punkty za każdy region, w którym są same; 1 punkt za każdy inny region, w którym mają Przewagę.
4.  **Bardaki:** 1 punkt za każdy region, w którym ma Przewagę (więcej pionków niż jakakolwiek inna pojedyncza banda).
5.  Zwycięża gracz z największą sumą punktów. W przypadku jakichkolwiek remisów, zwycięzcą zostaje gracz posiadający generała stojącego najwyżej w **Hierarchii Band**.

## Charakterystyka Band i Punktacja Zestawów
Punkty za wystawienie zestawu (odległość liczona według zasad zdefiniowanych w Głównych Pojęciach, punkty mogą przybierać wartości ujemne):
*   **Wampiry (V):** Punkty = `(4 - odległość) * liczba wampirów`. W przypadku maksymalnej odległości od Jakuba równej 5, punkty za wampiry są ujemne (`-1` za każdego wampira).
*   **Wilkołaki (W):** Punkty = `1 punkt bazowy za każdego wilkołaka w zestawie` + `1 punkt za każde 3 wilkołaki (zaokrąglając w dół) w regionie docelowym i regionach sąsiednich`. Jeżeli Jakub jest w odległości **0 lub 1** od regionu docelowego, Wilkołaki otrzymują dodatkowy **+1 punkt za każdego wystawianego wilkołaka**.
*   **Duchy (G):** Punkty za pionka = `2 - (odległość do najbliższej krawędzi)`.
    *   Krawędź (odległość 0): **2 punkty** za pionka.
    *   1 pole od krawędzi: **1 punkt** za pionka.
    *   Centrum (2 pola od krawędzi): **0 punktów**.
    *   **Kara Jakuba:** Jeżeli region to region z Jakubem lub region sąsiedni (odległość ≤ 1), odejmij **1 punkt** od wartości każdego pionka (kara ta może sprawić, że punkty za pionka staną się ujemne).
*   **Bardaki (B):** Punkty = `Liczba Bardaków w zestawie`. Jeżeli region jest w odległości **0 lub 1** od Jakuba (wliczając skosy / odległość ≤ 1), Bardaki otrzymują **0 punktów** za każdego Bardaka w zestawie.

### Przykłady Punktacji Zestawów
1. ![Przykładowy Wynik 1](../src/assets/img/socre_example_v-1_g2_b2.png)
   *Opis:* Zestaw został wystawiony do brzegowego regionu planszy w odległości 5 od Jakuba. Punktacja za Wampiry to 4 - odległość, czyli Herszt Wampirów otrzymuje **-1 punkt**. Herszt Duchów otrzymuje 2 punkty minus odległość do krawędzi; ponieważ jest to region brzegowy: 2 - 0, czyli **2 punkty**. Herszt Bardaków otrzymuje po 1 punkcie za każdego swojego pionka wystawionego na planszę poza regionem z Jakubem i regionami sąsiednimi (odległość > 1). Ponieważ odległość wynosi 5, dostaje 2 x 1, czyli **2 punkty**.
2. ![Przykładowy Wynik 2](../src/assets/img/socre_example_v8_b0.png)
   *Opis:* Wampiry zostały umieszczone w regionie z Jakubem, czyli odległość wynosi 0. Herszt Wampirów punktuje po 4 punkty za każdego wampira (4 - 0 = 4 pkt za pionka), co daje **8 pkt**. Herszt Bardaków nie punktuje za Bardaków wystawionych do sektora Jakuba oraz sektorów z nim sąsiadujących, czyli otrzymuje **0 pkt**.
3. ![Przykładowy Wynik 3](../src/assets/img/socre_example_w1_b2.png)
   *Opis:* Zestaw został wystawiony w odległości 2 od Jakuba. Herszt Wilkołaków otrzymuje **1 punkt**, ponieważ w regionie docelowym oraz sąsiednich nie ma innych Wilkołaków (za 1 wilkołaka zaokrąglając w dół otrzymuje 0 pkt, plus 1 pkt bazowy = 1 pkt). Nie otrzymuje też dodatkowego bonusowego punktu za bliskość Jakuba (odległość > 1). Herszt Bardaków znajduje się poza regionem z Jakubem i regionami sąsiednimi (odległość > 1), więc otrzymuje po 1 punkcie za każdego Bardaka w zestawie, co daje **2 pkt**.
4. ![Przykładowy Wynik 4](../src/assets/img/socre_example_w3.png)
   *Opis:* Zestaw został wystawiony do regionu w odległości 1 od Jakuba. Herszt Bardaków otrzymuje **0 punktów**, ponieważ jest to sektor zagrożony (odległość ≤ 1). Herszt Duchów liczy odległość od krawędzi (wynosi ona 1), więc bazowo otrzymałby 2 - 1 = 1 pkt za ducha, ale z racji tego, że region to region z Jakubem lub region sąsiedni (odległość ≤ 1), naliczana jest kara -1 pkt za każdego ducha, co daje ostatecznie **0 pkt**. Herszt Wilkołaków otrzymuje 1 punkt za wystawionego Wilkołaka, +1 punkt za bliskość Jakuba (odległość ≤ 1), oraz +1 punkt za to, że łącznie w regionie docelowym oraz sąsiednich znajdują się 4 Wilkołaki (za 4 wilkołaki zaokrąglając w dół otrzymuje 1 pkt). Ostatecznie daje to 1 (bazowy) + 1 (za bliskość) + 1 (za 4 wilkołaki) = **3 pkt**.
5. ![Przykładowy Wynik 5](../src/assets/img/socre_example_w3_b2.png)
   *Opis:* Herszt bardaków nie dostaje żadnych punktów gdyż został wystawiony do regionu z Jakubem lub regionu sąsiedniego (odległość ≤ 1). Herszt wilkołaków dostaje 1 punkt za wystawienie wilkołaka oraz 1 punkt za region z Jakubem lub region sąsiedni (odległość ≤ 1). Następnie zlicza wilkołaki w zasięgu sektora w którym został wystawiony jest ich 6 czyli dodatkowe 2 punkty. Łącznie 4 punkty.
6. ![Przykładowy Wynik 6](../src/assets/img/socre_example_w4_g2.png)
   *Opis:* Hersz bardaków 1 punkt gdyż jest to region poza regionem z Jakubem i regionami sąsiednimi (odległość > 1). Obecny sektor jest w odległości 2 od jakuba czyli każdy wampir dostej 4 -2=2pkt czyli łącznie 4pkt

## Szczegółowe Zasady Ruchu i Walki Jakuba

W Fazie Jakuba jego ruch oraz ataki są w pełni zautomatyzowane i przebiegają według następujących reguł:

1.  **Czystka w obecnym sektorze:** 
    Zanim Jakub wykona jakikolwiek ruch, najpierw niszczy pionki w sektorze, w którym się aktualnie znajduje.
    *   Atakuje wyłącznie te bandy, na które ma **Furię większą niż 0**.
    *   Niszczy pionki danej bandy tylko **do wysokości swojej Furii** wobec tej bandy (tj. maksymalnie tyle pionków, ile wynosi wartość Furii).
    *   Za każdego zabitego w ten sposób pionka danej bandy, jej Herszt traci **1 punkt**, poziom Furii Jakuba na tę bandę **zmniejsza się o 1**, a zabity pionek wraca do puli posiłków tej bandy.
    *   Czystka trwa dopóki w obecnym regionie są pionki band, na które Jakub ma Furię, lub dopóki Furia na te bandy nie spadnie do 0.

2.  **Poszukiwanie Celu i Ruch:**
    Jeśli Jakub wciąż posiada Furię, a w jego obecnym sektorze nie ma już pionków band, na które jest wściekły, decyduje się na ruch:
    *   Jakub wybiera jako cel bandę, na którą ma **najwyższy aktualny poziom Furii** (w przypadku remisu decyduje Hierarchia Band).
    *   Skanuje sektory w swoim aktualnym zasięgu ruchu (który wynosi domyślnie 1 + 1 za każdą bandę, na którą ma furię > 9) w poszukiwaniu pionków tej docelowej bandy.
    *   **Wybór regionu docelowego (Rozstrzyganie remisów):**
        Gdy w zasięgu ruchu Jakuba znajduje się kilka regionów z pionkami poszukiwanej bandy, musimy rozstrzygnąć remis. Jakub kieruje się wtedy stopniem swojej wściekłości:
        1. Sprawdza regiony po kolei pod kątem liczebności band, zaczynając od tej, na którą ma największą Furię. Jeśli na tym samym poziomie Furii jest kilka band, decyduje ogólna hierarchia band.
        2. Porównuje remisowe regiony i szuka tego, w którym znajduje się najwięcej pionków aktualnie sprawdzanej bandy.
        3. Jeśli w którymś regionie jest ich więcej – remis zostaje rozstrzygnięty i Jakub wkracza do tego regionu. W przeciwnym razie przechodzi do kolejnej bandy ze swojej listy gniewu.
        4. Jeśli po sprawdzeniu wszystkich band, na które ma jakąkolwiek Furię, nadal nie można wybrać jednego regionu – następuje absolutny remis i aktywuje się **Niepochamowany Zwierzęcy Magnetyzm** (patrz poniżej).

> [!CAUTION]
> **Niepochamowany Zwierzęcy Magnetyzm (Tego nie pochamujesz)**
>
> Jeśli po sprawdzeniu **wszystkich** band z furią > 0 regiony są nadal w absolutnym remisie, następuje nadzwyczajne zjawisko:
> **Wszystkie pionki (każdej bandy) z WSZYSTKICH remisowych regionów zostają przyciągnięte do sektora, w którym stoi Jakub.**
> Jakub NIE przemieszcza się — zamiast tego ściąga ofiary do siebie.
> W następnym kroku Jakub wykonuje normalną Czystkę w swoim (teraz zatłoczonym) sektorze.
>
> To zdarzenie jest śledzone jako statystyka w przebiegu gry.

    *   Po wybraniu celu Jakub przemieszcza się do tego sektora. Przed każdym ruchem na nowo wyliczany jest aktualny zasięg Jakuba. Po przemieszczeniu się, Jakub natychmiast wykonuje czystkę (punkt 1) w nowym sektorze.

> [!NOTE]
> **Punkty Świadka Jakuba**
>
> Punkty te są przyznawane za odwagę pionków, które przetrwały spotkanie z Jakubem. 
> Tuż przed tym, jak Jakub opuści swój dotychczasowy sektor (rozpoczynając ruch do innego regionu), sprawdzane jest czy w opuszczanym sektorze pozostały jakieś pionki.
>
> Jeśli w sektorze znajdują się pionki bandy, na którą **Furia Jakuba wynosi dokładnie 0**, Herszt tej bandy otrzymuje **1 punkt** za każdy taki ocalały pionek.
> Punkty te są przyznawane także tym pionkom, które zostaną w regionie Jakuba po tym, jak furia na wszystkie bandy spadnie do 0.

> [!NOTE]
> **Faza Miłosierdzia Jakuba**
>
> Faza ta następuje automatycznie na sam koniec Fazy Jakuba (po zakończeniu jego czystek i ruchu).
> Jeżeli na Jakubie pozostały jakieś punkty furii dla danej nacji, a na planszy nie ma już pionków tej nacji w jego zasięgu (lub łowy dobiegły końca), połowa tych punktów furii (w zaokrągleniu w górę) jest przyznawana jako punkty zwycięstwa aktualnemu Hersztowi tej nacji. Pozostałe punkty furii (w zaokrągleniu w dół) zostają na torze furii Jakuba na kolejną rundę.

### Przykład Fazy Jakuba

1. ![Jakub Phase Example Part 1](../src/assets/img/jakub_phase_example_1_part_1.png)
   *Opis 1:* Faza Jakuba zaczyna się od zabika Bardaka na polu z Jakubem. Furia Jakuba na Bardaki spada o 1.

2. ![Jakub Phase Example Part 2](../src/assets/img/jakub_phase_example_1_part_2.png)
   *Opis 2:* Jakub najbardziej pała furią do Bardaków, więc szuka regionu z największą ilością Bardaków w jego zasięgu. Ponieważ żadna z nacji nie ma furii > 9, jego zasięg to 1, więc przeskakuje do regionu w prawo.

3. ![Jakub Phase Example Part 3](../src/assets/img/jakub_phase_example_1_part_3.png)
   *Opis 3:* Jakub zabił wszystkie pionki w regionie i została mu jeszcze furia.

4. ![Jakub Phase Example Part 4](../src/assets/img/jakub_phase_example_1_part_4.png)
   *Opis 4:* Ponieważ ma tyle samo furii na Duchy i Bardaki, rozpoczyna się kaskadowe rozstrzyganie remisu. Hierarchia Band w obrębie tego samego piętra furii mówi: najpierw szukaj Duchów (przed Bardakami). Jakub szuka regionu z największą liczbą Duchów i wybiera region prosto w górę.

5. ![Jakub Phase Example Part 5](../src/assets/img/jakub_phase_example_1_part_5.png)
   *Opis 5:* Jakub zabił 2 Duchy i Bardaka. Jego obecna furia jest skierowana na Bardaki, ale ponieważ nie ma w zasięgu żadnego Bardaka, szuka kolejnej bandy (Duchów), jednak ich również nie ma. Jego faza furii się kończy. Ponieważ po wygaśnięciu furii na polu z Jakubem pozostał Wilkołak, gracz kontrolujący tę bandę otrzymuje Punkty Świadka Jakuba w wysokości 1 pkt za każdego członka bandy.

---

## Najczęściej Zadawane Pytania (FAQ)

### Pytanie: Czy to jest głupia losowa gra?
**ODP:** Tak! Nie podoba się to wypier...z koszulę.

### Pytanie: Jak tu się zdobywa punkty?
**ODP:** To jest nie tyle gra w zdobywanie punktów ile gra w to aby inni stracili ich więcej niż ty.

### Pytanie: Jak rozstrzygać remisy?
**ODP:**
* Przy ustalaniu kolejności graczy: jak jest remis w punktach, to kolejność tych graczy nie zmienia się.
* Przy wyborze celu Jakuba: decyduje Hierarchia Band; w przypadku absolutnego remisu rozpatrujemy Niepochamowany Zwierzęcy Magnetyzm.
* Przy ustalaniu zwycięzcy: decyduje gracz prowadzący herszta bandy według Hierarchii Band.

### Pytanie: Jakieś strategie dla początkujących graczy?
**ODP:**
* Staraj się nie być pierwszym graczem gdyż on nie ma wyboru odnośnie nacji którą kieruje.
* Kabluj Jakubowi na pierwszego gracza.
* Jeżeli uważasz iż w następnej rundzie będziesz tą jakąś nacją rozważ zostawienie sobie zestawów tej nacji na następną rundę.

---
*Zasady te stanowią fundament logiki symulatora MASAKRA na Starym Majdanie.*
