# MASAKRA na Starym Majdanie: Oficjalne Zasady Gry

## 1. Cel Gry
Wędrowycz-Gemini to gra strategiczna, w której gracze (Hersztowie) dowodzą czterema bandami: Wampirami, Wilkołakami, Duchami i Bardakami. Celem jest zdobycie jak największej liczby punktów zwycięstwa w ciągu 12 rund, unikając furii Jakuba Wędrowycza.

## 2. Elementy Gry
*   **Plansza:** Siatka 6x6 regionów, na której toczy się walka.
*   **Zastępy plugastw Nocy:** Wampiry (V), Wilkołaki (W), Duchy (G) oraz Bardaki (B) walczące o dominację.
*   **Jakub:** Unikalny pionek, który niszczy wszystko na swojej drodze.
*   **Panel Jakuba:** Boczny panel zarządzania statystykami i furią Jakuba Wędrowycza.
*   **Panel posiłków Band:** Panel wskazujący limit i stan pionków poszczególnych band na planszy.
*   **Zestawy (Taktyczne Oddziały Szturmowe):** Pojedyncze małe taktyczne oddziały szturmowe składające się z członków różnych band. Za wystawienie takiego oddziału na planszę hersztowie poszczególnych band otrzymują punkty zwycięstwa.

## 3. Przebieg Gry
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
    W przypadku remisu (np. przy rozstrzyganiu punktów, wyborze celów Jakuba lub na koniec gry), postępujemy według **Hierarchii Band**.
*   **Furia (Gniew Jakuba):**
    Wskaźnik określający poziom agresji Jakuba wobec danej bandy. Każdy zlikwidowany przez niego pionek danej bandy zmniejsza furię na tę bandę o 1. Gdy furia spadnie do 0, Jakub przestaje ją ścigać i atakować. Oznacza to, że wartość furii wyznacza maksymalną liczbę pionków danej bandy, jaką Jakub może zabić w danej rundzie.
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
1.  **Akcja:** Gracz może wystawić zestaw pionków w pustym regionie (pod warunkiem, że w puli posiłków znajduje się wystarczająca liczba pionków danej bandy, aby całkowicie skompletować oddział; w przeciwnym razie zagranie takiego zestawu jest niedozwolone) lub podkablować nim Jakubowi.
2.  **Punktacja Natychmiastowa (Rozproszona):** Punkty otrzymują wszyscy Hersztowie za pionki swojej bandy z wystawionego zestawu, zgodnie z logiką danej bandy. Gracz wystawiający nie musi otrzymać żadnych punktów, jeśli w zestawie nie ma pionków jego bandy.
3.  **Pasowanie:** Gracz może spasować. Musi wtedy odrzucić nadmiarowe zestawy (zostawiając max 3). Za każdy odrzucony zestaw otrzymuje +1 pkt, podkablowując nim Jakubowi (każdy pionek w zestawie zasila furię Jakuba na odpowiednią bandę).

### Faza IV: Faza Jakuba
Po spasowaniu wszystkich graczy, Jakub rusza do akcji:

1.  **Zasilanie Furii:** Jakub absorbuje zestawy pobrane na starcie rundy oraz te odrzucone przez graczy. Każdy pionek zwiększa Furię na daną bandę.
    *   **Zasięg:** Zasięg Jakuba to teraz **1 + liczba band, na które Furia wynosi co najmniej 10**.
    *   Maksymalny zasięg Jakuba to **5**.
2.  **Czystka:** Jakub zabija pionki w swoim regionie. Za każdego zabitego pionka, aktualny Herszt tej bandy traci 1 punkt.
3.  **Ruch i Łowy:** Jakub skanuje regiony w swoim zasięgu. Przemieszcza się do regionu z największą liczbą jednostek bandy, na którą ma największą Furię. Każdy ruch zmniejsza aktualny zasięg o 1 (minimum 1).
4.  **Koniec Fazy:**
    *   **Bonus za Przetrwanie:** Jeżeli po zakończeniu ruchu i czystki Jakuba, w jego aktualnym regionie znajdują się jakiekolwiek pionki graczy, ich aktualny Herszt otrzymuje **2 punkty bonusowe** za każdy taki pionek.
    *   **Reset Zasięgu:** Po zakończeniu akcji Jakuba, jego **zasięg wraca do 1**.
    *   Zestawy Jakuba trafiają na stos kart odrzuconych.
    *   **Rundy 1-9:** Hersztowie wracają do puli. Kolejność graczy: najmniej punktów = pierwszy.
    *   **Runda 10:** Gracze **zachowują** swoich Hersztów do ostatecznego punktowania.

### Faza V: Faza Wydarzeń
Odkrywamy wydarzenie, które wpływa na obecny stan planszy.

## 4. Zakończenie Gry i Punktacja Końcowa
Po zakończeniu fazy Jakuba w **10. rundzie**, następuje ostateczne podsumowanie. Gracze otrzymują bonusy za bandy, którymi dowodzili w ostatniej rundzie:
1.  **Wampiry:** 2 punkty za każdy region, w którym znajduje się co najmniej jeden wampir (niezależnie od ich liczby w danym regionie).
2.  **Wilkołaki:** 1 punkt za każdy swój pionek na planszy.
3.  **Duchy:** 2 punkty za każdy region, w którym są same; 1 punkt za każdy inny region, w którym mają Przewagę.
4.  **Bardaki:** 1 punkt za każdy region, w którym ma Przewagę (więcej pionków niż jakakolwiek inna pojedyncza banda).
5.  Zwycięża gracz z największą sumą punktów. W przypadku remisu, postępujemy według **Hierarchii Band**.

## 5. Charakterystyka Band i Punktacja Zestawów
Punkty za wystawienie zestawu (odległość liczona według zasad zdefiniowanych w Głównych Pojęciach, punkty mogą przybierać wartości ujemne):
*   **Wampiry (V):** Punkty = `(4 - odległość) * liczba wampirów`. W przypadku maksymalnej odległości od Jakuba równej 5, punkty za wampiry są ujemne (`-1` za każdego wampira).
*   **Wilkołaki (W):** Punkty = `floor(suma_wilkołaków / 3) + 1`. Jeżeli Jakub jest w odległości **0 lub 1** od regionu docelowego, Wilkołaki otrzymują dodatkowy **+1 punkt**. (Suma wilkołaków obejmuje pionki z zestawu oraz te już stojące w celu i u sąsiadów).
*   **Duchy (G):** Punkty za pionka = `2 - (odległość do najbliższej krawędzi)`.
    *   Krawędź (odległość 0): **2 punkty** za pionka.
    *   1 pole od krawędzi: **1 punkt** za pionka.
    *   Centrum (2 pola od krawędzi): **0 punktów**.
    *   **Kara Jakuba:** Jeżeli region jest w zasięgu Jakuba, odejmij **1 punkt** od wartości każdego pionka (kara ta może sprawić, że punkty za pionka staną się ujemne).
*   **Bardaki (B):** Punkty = `Liczba Bardaków w zestawie`. Jeżeli region jest w odległości **0 lub 1** od Jakuba (wliczając skosy / odległość ≤ 1), Bardaki otrzymują **0 punktów** za każdego Bardaka w zestawie.

---
*Zasady te stanowią fundament logiki symulatora Wedrowycz-Gemini.*
