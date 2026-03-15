# Wędrowycz-Gemini: Oficjalne Zasady Gry

## 1. Cel Gry
Gracze wcielają się w role Generałów dowodzących armiami potworów (Wampiry, Wilkołaki, Duchy, Bardaki). Celem jest zdobycie jak największej liczby punktów poprzez strategiczne wystawianie zestawów pionków na planszę oraz przetrwanie czystek dokonywanych przez Jakuba Wędrowycza.

---

## 2. Inicjalizacja Gry (Tylko na starcie)
1.  **Wybór Zestawu:** Wybierany jest predefiniowany szablon zestawów (np. `set_1`).
2.  **Zasoby Startowe:** Każdy gracz otrzymuje **30 punktów** oraz **2 losowe zestawy** (sets) z puli.
3.  **Pozycja Jakuba:** Jakub zostaje umieszczony w losowym regionie wnętrza planszy (koordynaty X/Y od 1 do 3).
4.  **Kolejność:** Początkowa kolejność graczy jest losowana.

---

## 3. Cykl Rundy (6 Tur: od 00:00 do 06:00)
Gra trwa dokładnie 6 rund. Każda runda składa się z trzech faz:

### Faza I: Setup (Przygotowanie)
*   **Rozdawanie Setów:** Jeżeli w puli ogólnej (stos aktywny + odrzucony) znajduje się co najmniej 4 zestawy, każdy gracz otrzymuje po jednym. Proces ten powtarza się w systemie "round-robin", dopóki każdy z graczy nie otrzyma w tej fazie **3 dodatkowych zestawów** lub pula przestanie wystarczać na sprawiedliwy podział.
*   **Recykling:** Zestawy zagrane lub odrzucone w poprzednich rundach wracają do puli ogólnej jako zestawy odrzucone. Kiedy stos aktywny (Draw Pile) staje się pusty, wszystkie zestawy ze stosu odrzuconego (Discard Pile) zostają wtasowane i stają się aktywne.

### Faza II: Faza Graczy
Faza ta dzieli się na wybór roli oraz pętlę akcji.

1.  **Wybór Generała:** W aktualnej kolejności każdy gracz wybiera jedną z dostępnych nacji (Vampire, Werewolf, Ghost, Bardak). Wybranej nacji nie może przejąć inny gracz.
2.  **Pętla Akcji:** Gracze wykonują akcje po kolei, dopóki wszyscy nie spasują. Dostępne akcje:
    *   **Wystawienie Zestawu:** Gracz kładzie zestaw na pusty region (brak pionków graczy). 
        *   *Warunek:* W puli ogólnej muszą być dostępne wszystkie pionki opisane w zestawie.
        *   *Punktacja:* Gracz natychmiast otrzymuje punkty wg wzorów nacji (patrz sekcja 5).
    *   **Odrzucenie Zestawu:** Gracz oddaje zestaw do puli ogólnej i otrzymuje **+1 punkt**.
    *   **Pas:** Gracz kończy swoje działania w tej fazie. Po spasowaniu nie można już wykonywać akcji.
*   **Limit:** Na koniec fazy gracz może zachować **maksymalnie 2 zestawy** na kolejną rundę. Nadmiarowe zestawy muszą zostać odrzucone (bez punktów lub automatycznie z bonusem +1, zależnie od strategii).

### Faza III: Faza Jakuba
Po spasowaniu wszystkich graczy, Jakub rusza do akcji:

1.  **Zasilanie Złości (Nowość):**
    *   Jakub pobiera **2 losowe zestawy** z puli Draw Pile na start fazy.
    *   Wszystkie zestawy **odrzucone przez graczy** (+1 pkt) w tej rundzie również trafiają do Jakuba.
    *   Jakub "absorbuje" te zestawy: każdy pionek w nich zawarty zwiększa jego Anger dla danej rasy.
    *   **Przepełnienie:** Jeżeli Anger rasy osiągnie **10 lub więcej**, zostaje zresetowany do **5**, a **Range (zasięg)** Jakuba rośnie o **1**.
2.  **Czystka (Killing Spree):**
    *   Jakub zabija pionki graczy w swoim aktualnym regionie, zaczynając od rasy, na którą ma największy Anger.
    *   Za każdego zabitego pionka, gracz który jest **aktualnie Generałem tej nacji**, traci **1 punkt**.
    *   Każdy zabity pionek zmniejsza Anger Jakuba na tę rasę o 1.
    *   Zabite pionki wracają do puli ogólnej (Discard Pile).
3.  **Ruch i Łowy:**
    *   Jeżeli Jakub ma jeszcze złość na jakąś rasę, a nie ma jej już w jego regionie, skanuje wszystkie regiony w swoim **Range** (zasięgu).
    *   Zasięg obejmuje ruchy ortogonalne i **diagonalne** (King's Move).
    *   Jakub przemieszcza się bezpośrednio do regionu z największą liczbą jednostek najbardziej znienawidzonej rasy (tie-break: V>W>G>B).
    *   Powtarza czystkę, aż skończy mu się złość lub w zasięgu nie będzie celów.
4.  **Koniec Fazy:**
    *   Range Jakuba spada o 1 (minimum 1).
    *   Wszystkie zestawy Jakuba trafiają do Discard Pile.
    *   Generałowie wracają do puli.
    *   Kolejność graczy: najmniejsza liczba punktów = pierwszy.

---

## 4. Zakończenie Gry i Punktacja Końcowa
Po zakończeniu 6. rundy następuje ostateczne podsumowanie:
1.  W aktualnej kolejności (ustalonej po ostatniej fazie Jakuba) gracze po raz ostatni wybierają Generała nacji.
2.  **Bonus Końcowy:**
    *   **Vampire:** 2 punkty za każdy swój pionek na planszy.
    *   **Werewolf:** 1 punkt za każdy swój pionek na planszy.
    *   **Ghost:** 2 punkty za każdy region, w którym są same; 1 punkt za każdy inny region, w którym jest ich więcej niż jakiejkolwiek innej nacji z osobna (Pluralizacja).
    *   **Bardak:** 2 punkty za każdy region, w którym mają przewagę (więcej własnych pionków niż wszystkich pozostałych nacji razem wziętych).
3.  Zwycięża gracz z największą łączną sumą punktów.

---

## 5. Charakterystyka Nacji i Punktacja Setów
Punkty za wystawienie zestawu zależą od odległości regionu od Jakuba (Manhattan distance):

*   **Vampire (V):** Moc 3. Punkty = `(Liczba V w secie) + (3 - odległość)`. *Najsilniejsze blisko Jakuba.*
*   **Werewolf (W):** Moc 2. Punkty = `(Liczba W w secie) + 1` tylko jeśli `odległość <= 2`. W innym wypadku 0 pkt.
*   **Ghost (G):** Moc 1. Punkty:
    *   **Na brzegach planszy (X/Y = 1 lub 5):** Liczba G w secie. Jeżeli region jest w aktualnym zasięgu Jakuba (Range), odejmij **1 punkt** od sumy.
    *   **Wewnątrz planszy:** Liczba G w secie + (1 jeśli odległość > 2, inaczej -1).
*   **Bardak (B):** Moc 1. Punkty = `Łączna liczba wszystkich pionków w zestawie`. *Zawsze solidne punkty.*

---

*Zasady te stanowią fundament logiki symulatora Wedrowycz-Gemini.*
