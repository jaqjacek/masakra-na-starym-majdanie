# Wedrowycz-Gemini: Oficjalne Zasady Gry

## 1. Cel Gry
Wędrowycz-Gemini to gra strategiczna, w której gracze (Generałowie) dowodzą czterema nacjami: Vampirami, Wilkołakami, Duchami i Bardakami. Celem jest zdobycie jak największej liczby punktów zwycięstwa (Victory Points) w ciągu 8 rund, unikając gniewu Jakuba Wędrowycza.

## 2. Elementy Gry
*   **Plansza:** Siatka 5x5 regionów.
*   **Nacje:** Vampire (V), Werewolf (W), Ghost (G), Bardak (B).
*   **Jakub:** Unikalny pionek poruszający się po planszy, niszczący jednostki.
*   **Zestawy (Sets):** Karty zawierające kombinacje pionków o różnej mocy.

## 3. Przebieg Gry
Gra toczy się przez **8 rund**. Każda runda składa się z trzech faz:

### Faza I: Setup
1.  **Rozdysponowanie Zestawów:** Każdy gracz otrzymuje zestawy pionków z talii Draw Pile. Gracze dążą do posiadania optymalnych kombinacji jednostek.
2.  **Zasoby Jakuba:** Jakub również pobiera 2 zestawy, które zwiększą jego agresję w danej rundzie.

### Faza II: Faza Graczy (Player Phase)
Gracze wykonują tury naprzemiennie (wg aktualnej kolejności):
1.  **Wybór Generała:** Gracz wybiera nację, którą dowodzi w tej rundzie (V, W, G lub B).
2.  **Akcja:** Gracz może wystawić zestaw pionków w pustym regionie.
3.  **Punktacja Natychmiastowa (Rozproszona):** Punkty otrzymują wszyscy generałowie za pionki swojej nacji z wystawionego zestawu, zgodnie z logiką danej nacji. Gracz wystawiający nie musi otrzymać żadnych punktów, jeśli w zestawie nie ma pionków jego nacji.
4.  **Pasowanie:** Gracz może spasować. Musi wtedy odrzucić nadmiarowe zestawy (zostawiając max 3). Za każdy odrzucony zestaw otrzymuje +1 pkt, a zestaw trafia do Jakuba.

### Faza III: Faza Jakuba
Po spasowaniu wszystkich graczy, Jakub rusza do akcji:

1.  **Zasilanie Złości:** Jakub absorbuje zestawy pobrane na starcie rundy oraz te odrzucone przez graczy. Każdy pionek zwiększa Anger (złość) na daną rasę. 
    *   **Zasięg (Range):** Zasięg Jakuba to teraz **1 + suma punktów złości powyżej 9** (dla każdej rasy: `anger - 9`).
    *   Złość nie jest już resetowana do 5 po osiągnięciu 10 punktów.
2.  **Czystka (Killing Spree):** Jakub zabija pionki w swoim regionie. Za każdego zabitego pionka, aktualny Generał tej nacji traci 1 punkt.
3.  **Ruch i Łowy:** Jakub skanuje regiony w swoim Range. Przemieszcza się do regionu z największą liczbą jednostek nacji, na którą jest najbardziej wściekły. Każdy ruch zmniejsza aktualny Range o 1.
4.  **Koniec Fazy:**
    *   **Rambo Survivor Bonus:** Jeżeli po zakończeniu ruchu i czystki Jakuba, w jego aktualnym regionie znajdują się jakiekolwiek pionki graczy, ich aktualny Generał otrzymuje **2 punkty bonusowe** za każdy taki pionek.
    *   **Reset Zasięgu:** Po zakończeniu akcji Jakuba, jego **Range spada do 0**.
    *   Zestawy Jakuba trafiają na Discard Pile.
    *   **Rundy 1-7:** Generałowie wracają do puli. Kolejność graczy: najmniej punktów = pierwszy.
    *   **Runda 8:** Gracze **zachowują** swoich generałów do ostatecznego punktowania.

## 4. Zakończenie Gry i Punktacja Końcowa
Po zakończeniu fazy Jakuba w **8. rundzie**, następuje ostateczne podsumowanie. Gracze otrzymują bonusy za nacje, którymi dowodzili w ostatniej rundzie:
1.  **Vampire:** 2 punkty za każdy swój pionek na planszy.
2.  **Werewolf:** 1 punkt za każdy swój pionek na planszy.
3.  **Ghost:** 2 punkty za każdy region, w którym są same; 1 punkt za każdy inny region, w którym jest ich więcej niż jakiejkolwiek innej nacji z osobna (Pluralizacja).
4.  **Bardak:** 1 punkt za każdy region, w którym jest ich więcej niż jakiejkolwiek innej nacji z osobna (Pluralizacja).
5.  Zwycięża gracz z największą sumą punktów.

## 5. Charakterystyka Nacji i Punktacja Setów
Punkty za wystawienie zestawu (odległość liczona wg King's Move):
*   **Vampire (V):** Punkty = `4 - odległość`.
*   **Werewolf (W):** Punkty = `floor(suma_wilkołaków / 3) + 1`. Jeżeli Jakub jest w odległości **0 lub 1** od regionu docelowego, Wilkołaki otrzymują dodatkowy **+1 punkt**. (Suma wilkołaków obejmuje pionki z zestawu oraz te już stojące w celu i u sąsiadów).
*   **Ghost (G):** Punkty za pionka = `2 - (odległość do najbliższej krawędzi)`.
    *   Krawędź (odległość 0): **2 punkty** za pionka.
    *   1 pole od krawędzi: **1 punkt** za pionka.
    *   Centrum (2 pola od krawędzi): **0 punktów**.
    *   **Kara Jakuba:** Jeżeli region jest w Range Jakuba, odejmij **1 punkt** od wartości za każdego pionka (min. 0).
*   **Bardak (B):** Punkty = `Liczba Bardaków w zestawie`. Jeżeli region jest w odległości **0 lub 1** od Jakuba (wliczając skosy), Bardaki otrzymują **0 punktów**.

---
*Zasady te stanowią fundament logiki symulatora Wedrowycz-Gemini.*
