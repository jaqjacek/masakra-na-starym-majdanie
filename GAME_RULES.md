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
*   **Rozdawanie Setów:** Jeżeli w puli ogólnej znajdują się co najmniej 4 zestawy, każdy gracz otrzymuje po jednym. Proces powtarza się, dopóki w puli jest wystarczająco dużo zestawów, aby rozdzielić je po równo między graczy.
*   **Recykling:** Zestawy zagrane lub odrzucone w poprzednich rundach wracają do puli ogólnej przed rozdaniem.

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

1.  **Wzrost Złości:** Jakub losuje dodatkową agresję dla każdej rasy:
    *   Vampire: +1 do 3
    *   Werewolf: +2 do 3
    *   Ghost: +2 do 4
    *   Bardak: +3 do 5
    *   *Limit złości:* Maksymalnie 9 na każdą rasę.
2.  **Czystka (Killing Spree):**
    *   Jakub zabija wszystkie pionki graczy w swoim aktualnym regionie.
    *   Za każdego zabitego pionka, odpowiedni Generał **traci 1 punkt**, a złość Jakuba na tę rasę spada o 1.
    *   Zabite pionki wracają do puli ogólnej.
3.  **Ruch:**
    *   Jeżeli Jakub ma jeszcze złość (>0), szuka celu w sąsiednich regionach (ortogonalnie).
    *   Priorytet ruchu: region z największą ilością pionków rasy, na którą Jakub jest najbardziej wściekły.
    *   Jakub przemieszcza się i powtarza czystkę, aż skończy mu się złość lub w zasięgu nie będzie już żadnych pionków.
4.  **Koniec Fazy:** Generałowie wracają do puli (stają się dostępni do wyboru w kolejnej rundzie).
5.  **Nowa Kolejność:** Gracze są szeregowani wg punktów: **najmniejsza liczba punktów = pierwsze miejsce w kolejce**. Remisy nie zmieniają obecnej relacji między remisującymi.

---

## 4. Zakończenie Gry i Punktacja Końcowa
Po zakończeniu 6. rundy następuje ostateczne podsumowanie:
1.  W aktualnej kolejności (ustalonej po ostatniej fazie Jakuba) gracze po raz ostatni wybierają Generała nacji.
2.  **Bonus Końcowy:** Gracz otrzymuje **1 punkt za każdy pionek** swojej wybranej nacji, który pozostał na planszy (przetrwał 6 nocy).
3.  Zwycięża gracz z największą łączną sumą punktów.

---

## 5. Charakterystyka Nacji i Punktacja Setów
Punkty za wystawienie zestawu zależą od odległości regionu od Jakuba (Manhattan distance):

*   **Vampire (V):** Moc 3. Punkty = `(Liczba V w secie) + (2 - odległość)`. *Najsilniejsze blisko Jakuba.*
*   **Werewolf (W):** Moc 2. Punkty = `(Liczba W w secie) + 1` tylko jeśli `odległość <= 2`. W innym wypadku 0 pkt.
*   **Ghost (G):** Moc 1. Punkty = `(Liczba G w secie) + (1 jeśli odległość > 2, inaczej -1)`. *Lubią spokój z dala od Jakuba.*
*   **Bardak (B):** Moc 1. Punkty = `Łączna liczba wszystkich pionków w zestawie`. *Zawsze solidne punkty.*

---

*Zasady te stanowią fundament logiki symulatora Wedrowycz-Gemini.*
