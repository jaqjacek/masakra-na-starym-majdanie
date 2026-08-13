import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const raceMapCS = {
  'Wampiry': 'Upíři',
  'Wilkołaki': 'Vlkodlaci',
  'Duchy': 'Duchové',
  'Bardaki': 'Bardaci',
  'vampire': 'Upíři',
  'werewolf': 'Vlkodlaci',
  'ghost': 'Duchové',
  'bardak': 'Bardaci',
  'V': 'Upíři',
  'W': 'Vlkodlaci',
  'G': 'Duchové',
  'B': 'Bardaci'
};

const raceMapEN = {
  'Wampiry': 'Vampires',
  'Wilkołaki': 'Werewolves',
  'Duchy': 'Ghosts',
  'Bardaki': 'Bardaks',
  'vampire': 'Vampires',
  'werewolf': 'Werewolves',
  'ghost': 'Ghosts',
  'bardak': 'Bardaks',
  'V': 'Vampires',
  'W': 'Werewolves',
  'G': 'Ghosts',
  'B': 'Bardaks'
};

const translateLog = (text, lang, tFunc) => {
  if (!text) return '';
  if (lang === 'pl') return text;
  
  let t = text;

  if (lang === 'cs') {
    // Phase & Round Headers
    t = t.replace(/--- Start of SETUP ---/gi, "--- Začátek PŘÍPRAVY ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Začátek FÁZE VŮDCŮ ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Začátek FÁZE HRÁČŮ ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Začátek FÁZE JAKUBA ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Začátek FÁZE UDÁLOSTÍ ---")
         .replace(/--- Start of (.*?) ---/gi, "--- Začátek $1 ---");

    t = t.replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Začátek Fáze Hráčů (Kolo $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Začátek Fáze Hráčů ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Začátek Fáze Vůdců ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Začátek Fáze Jakuba ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Lov Jakuba Zahájen ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Zahájení Fáze Událostí ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FÁZE ZÁVĚREČNÉHO BODOVÁNÍ (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- FÁZE UDÁLOSTÍ ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- ZÁVĚREČNÉ BODOVÁNÍ (12. Kolo) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Kolo $1 / $2 ---");

    t = t.replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Kolo $1: Ruce hráčů doplněny na $2 sad.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Balíček událostí došel. Odhozené události byly zamíchány zpět do balíčku.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "V balíčku nejsou žádné dostupné události.");

    // Events & Effects
    t = t.replace(/WYLOSOWANO WYDARZENIE: \[(\d+)\] (.*)/g, (m, id, title) => {
      const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
      return `VYLOSOVÁNA UDÁLOST: [${id}] ${translatedTitle}`;
    });

    t = t.replace(/--- Ręczne Wydarzenie: \[(\d+)\] (.*) ---/g, (m, id, title) => {
      const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
      return `--- Manuální Událost: [${id}] ${translatedTitle} ---`;
    });

    t = t.replace(/Efekt: (.*)/g, (m, desc) => {
      return `Efekt: ${desc}`;
    });

    t = t.replace(/Aktywowano wydarzenie: (.*)/g, "Aktivována událost: $1")
         .replace(/Zmiany furii: (.*?) \(Zasięg zaktualizowany do (\d+)\)/g, (m, changes, r) => {
           let ch = changes.replace(/Wampiry/g, 'Upíři').replace(/Wilkołaki/g, 'Vlkodlaci').replace(/Duchy/g, 'Duchové').replace(/Bardaki/g, 'Bardaci');
           return `Změny zuřivosti: ${ch} (Dosah aktualizován na ${r})`;
         })
         .replace(/Zmiany limitów band: (.*)/g, (m, changes) => {
           let ch = changes.replace(/Wampiry/g, 'Upíři').replace(/Wilkołaki/g, 'Vlkodlaci').replace(/Duchy/g, 'Duchové').replace(/Bardaki/g, 'Bardaci');
           return `Změny limitů band: ${ch}`;
         })
         .replace(/Brak zmian furii\./g, "Žádné změny zuřivosti.")
         .replace(/Brak zmian limitów band\./g, "Žádné změny limitů band.")
         .replace(/Wsparcie: Rozdano po (\d+) dodatkowym zestawie każdemu graczowi \(Suma: (\d+)\)\./g, "Podpora: Rozdáno po $1 dodatečné sadě každému hráči (Celkem: $2).")
         .replace(/Wsparcie: Brak dostępnych zestawów do rozdania\./g, "Podpora: Žádné dostupné sady k rozdání.")
         .replace(/Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \(Suma: (\d+)\)\./g, (m, sectors, sum) => {
           let s = sectors.replace(/Wampiry/g, 'Upíři').replace(/Wilkołaki/g, 'Vlkodlaci').replace(/Duchy/g, 'Duchové').replace(/Bardaki/g, 'Bardaci');
           return `Velká Čistka: Eliminovány figurky v sektorech: ${s} (Celkem: ${sum}).`;
         })
         .replace(/Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania\./g, "Velká Čistka: Žádné figurky v cílových sektorech k eliminaci.")
         .replace(/Przeniesiono pionki z \((\d+),(\d+)\) do \((\d+),(\d+)\): (.*?) \(Suma: (\d+)\)\./g, (m, x1, y1, x2, y2, pawns, sum) => {
           let p = pawns.replace(/Wampiry/g, 'Upíři').replace(/Wilkołaki/g, 'Vlkodlaci').replace(/Duchy/g, 'Duchové').replace(/Bardaki/g, 'Bardaci');
           return `Přesunuty figurky z (${x1},${y1}) do (${x2},${y2}): ${p} (Celkem: ${sum}).`;
         })
         .replace(/Brak pionków w sektorze \((\d+),(\d+)\) do przeniesienia\./g, "Žádné figurky v sektoru ($1,$2) k přesunu.");

    // General Choice & Resignation
    t = t.replace(/Gracz (\d+) wybrał Generała bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
      return `Hráč ${p1} vybral Vůdce bandy: ${raceMapCS[p2] || p2}`;
    });
    t = t.replace(/Gracz (\d+) wybrał Generała: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
      return `Hráč ${p1} vybral Vůdce: ${raceMapCS[p2] || p2}`;
    });
    t = t.replace(/Gracz (\d+) zrezygnował z bycia Generałem bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
      return `Hráč ${p1} rezignoval z pozice Vůdce bandy: ${raceMapCS[p2] || p2}`;
    });

    // Player Actions & Board
    t = t.replace(/Gracz (\d+) dobrał zestawy\./g, "Hráč $1 dobral sady.")
         .replace(/Gracz (\d+) wystawił Zestaw (.*?) w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g, (m, p1, sId, x, y, logSum, board) => {
           let b = board.replace(/V:/g, 'U:').replace(/W:/g, 'V:').replace(/G:/g, 'D:').replace(/B:/g, 'B:');
           return `Hráč ${p1} nasadil Sadu ${sId} v sektoru [${x},${y}] [${logSum}] | Plán: ${b}`;
         })
         .replace(/Ręcznie: Zestaw (.*?) wystawiony w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g, (m, sId, x, y, logSum, board) => {
           let b = board.replace(/V:/g, 'U:').replace(/W:/g, 'V:').replace(/G:/g, 'D:').replace(/B:/g, 'B:');
           return `Manuálně: Sada ${sId} nasazena v sektoru [${x},${y}] [${logSum}] | Plán: ${b}`;
         })
         .replace(/Gracz (\d+) wystawił Zestaw (.*?) \[(.*?)\] \| Plansza: (.*)/g, (m, p1, sId, logSum, board) => {
           let b = board.replace(/V:/g, 'U:').replace(/W:/g, 'V:').replace(/G:/g, 'D:').replace(/B:/g, 'B:');
           return `Hráč ${p1} nasadil Sadu ${sId} [${logSum}] | Plán: ${b}`;
         })
         .replace(/Gracz (\d+) wystawił Zestaw (.*?) w regionie \[(\d+),(\d+)\]\./g, "Hráč $1 nasadil Sadu $2 v sektoru [$3,$4].")
         .replace(/Ręcznie: Rozdano Zestaw (.*?) Graczowi (\d+)/g, "Manuálně: Rozdána Sada $1 Hráči $2")
         .replace(/Ruch: (.*?) przeniesiony z \[(\d+),(\d+)\] do \[(\d+),(\d+)\]/g, (m, type, x1, y1, x2, y2) => {
           return `Pohyb: ${raceMapCS[type] || type} přesunut z [${x1},${y1}] do [${x2},${y2}]`;
         })
         .replace(/Dodano (.*?) w sektorze \[(\d+),(\d+)\]/g, (m, type, x, y) => {
           return `Přidáno ${raceMapCS[type] || type} v sektoru [${x},${y}]`;
         });

    // Pass & Snitch
    t = t.replace(/Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\./g,
          "Hráč $1 pasoval a prásknul $2 nadbytečných sad. Zuřivost Jakuba aktualizována.")
         .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?)\. Furia zaktualizowana \| Range: (\d+)/g,
          "Hráč $1 prásknul Jakubovi sadu $2. Zuřivost aktualizována | Dosah: $3")
         .replace(/Zestaw (.*?) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)/g,
          "Sada $1 byla prásknuta Jakubovi. Zuřivost aktualizována | Dosah: $2")
         .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?) za 1 pkt\./g,
          "Hráč $1 prásknul Jakubovi sadu $2 za 1 bod.")
         .replace(/Zestaw (.*?) został podkablowany Jakubowi za 1 pkt\./g,
          "Sada $1 byla prásknuta Jakubovi za 1 bod.")
         .replace(/Zestaw (.*?) został podkablowany Jakubowi\./g,
          "Sada $1 byla prásknuta Jakubovi.")
         .replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Hráč $1 provedl prázdný tah a pasoval.")
         .replace(/Gracz (\d+) spasował turę\./g, "Hráč $1 pasoval.")
         .replace(/Gracz (\d+) spasował\./g, "Hráč $1 pasoval.");

    // Jakub Actions
    t = t.replace(/Jakub przejął Zestaw (.*?)\. Furia\/Zasięg zaktualizowane natychmiast\./g, "Jakub převzal Sadu $1. Zuřivost/Dosah okamžitě aktualizovány.")
         .replace(/Jakub przejął Zestaw (.*?)\. Furia zaktualizowana natychmiast\./g, "Jakub převzal Sadu $1. Zuřivost okamžitě aktualizována.")
         .replace(/Jakub przejął Zestaw (.*?) z puli\./g, "Jakub převzal Sadu $1 ze zásoby.")
         .replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Zuřivost Jakuba opadla. Lov dokončen.")
         .replace(/Jakub kończy swoje łowy\./g, "Jakub končí svůj lov.")
         .replace(/Zasięg Jakuba zresetowany do 1\./g, "Dosah Jakuba resetován na 1.")
         .replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
          "NEZKROTNÝ ZVÍŘECÍ MAGNETISMUS! (To nezastavíš) Všechny bandy ze sektorů $1 byly přitaženy do sektoru Jakuba [$2,$3]!")
         .replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
           return `Jakub se přesouvá na [${x},${y}] v dosahu ${r}, pronásleduje ${raceMapCS[race] || race} (Zuřivost: ${anger} | Sektor obsahuje ${count} jednotek).`;
         })
         .replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
           return `Jakub zabil ${kCount}x ${raceMapCS[race] || race} v sektoru [${x},${y}]. Zuřivost klesá na ${anger}.`;
         });

    // Witnesses & Mercy
    t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, (m, p, race, pts) => {
           return `🔥 Svědek Jakubův: ${p} (${raceMapCS[race] || race}) získává ${pts} bonusových bodů za přežití poblíž Jakuba.`;
         })
         .replace(/Punkty Świadka Jakuba przyznane:/g, "Body Svědka Jakubova uděleny:")
         .replace(/😇 Faza Miłosierdzia Jakuba:/g, "😇 Fáze Milosrdenství Jakuba:")
         .replace(/😇 Miłosierdzie Jakuba: (.*?) \((.*?)\) otrzymuje \+(\d+) pkt za pozostałą furię\./g, (m, p, race, pts) => {
           return `😇 Milosrdenství Jakuba: ${p} (${raceMapCS[race] || race}) získává +${pts} bodů za zbývající zuřivost.`;
         })
         .replace(/Gracz (\d+) \((.*?)\) otrzymuje (\d+) pkt\. z Fazy Miłosierdzia \(pozostało (\d+) furii u Jakuba\)\./g, (m, p, race, pts, rem) => {
           return `Hráč ${p} (${raceMapCS[race] || race}) získává ${pts} bodů z Fáze Milosrdenství (zbylo ${rem} zuřivosti u Jakuba).`;
         });

    // End Game Scoring & Winner
    t = t.replace(/Punktacja Końcowa: Gracz (\d+) \(\+(\d+) za bandę (.*?)\);/g, (m, p, pts, race) => {
           return `Závěrečné Bodování: Hráč ${p} (+${pts} za bandu ${raceMapCS[race] || race});`;
         })
         .replace(/Gracz (\d+) \((.*?)\) zdobywa (\d+) punktów bonusowych \(Bonus Końcowy\)\./g, (m, p, race, pts) => {
           return `Hráč ${p} (${raceMapCS[race] || race}) získává ${pts} bonusových bodů (Závěrečný Bonus).`;
         })
         .replace(/KONIEC GRY! Zwycięzca: Gracz (\d+) z liczbą punktów: (\d+)\./g, "KONEC HRY! Vítěz: Hráč $1 s počtem bodů: $2.")
         .replace(/KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\d+)!/g, "KONEC HRY! REMÍZA mezi hráči: $1 s počtem bodů: $2!");

    t = t.replace(/\(Wampiry\)/g, "(Upíři)")
         .replace(/\(Wilkołaki\)/g, "(Vlkodlaci)")
         .replace(/\(Duchy\)/g, "(Duchové)")
         .replace(/\(Bardaki\)/g, "(Bardaci)");

    return t;
  }
  
  // English translations (default fallback)
  t = t.replace(/--- Start of SETUP ---/gi, "--- Start of SETUP ---")
       .replace(/--- Start of GENERAL PHASE ---/gi, "--- Start of GENERALS PHASE ---")
       .replace(/--- Start of PLAYER PHASE ---/gi, "--- Start of PLAYERS PHASE ---")
       .replace(/--- Start of JAKUB PHASE ---/gi, "--- Start of JAKUB'S PHASE ---")
       .replace(/--- Start of EVENT PHASE ---/gi, "--- Start of EVENT PHASE ---");

  t = t.replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Start of Player Phase (Round $1) ---")
       .replace(/--- Start Fazy Graczy ---/g, "--- Start of Player Phase ---")
       .replace(/--- Start Fazy Generałów ---/g, "--- Start of Generals Phase ---")
       .replace(/--- Start Fazy Jakuba ---/g, "--- Start of Jakub's Phase ---")
       .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Jakub's Hunt Started ---")
       .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Event Phase Started ---")
       .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FINAL SCORING PHASE (08:00) ---")
       .replace(/--- FAZA EVENTU ---/g, "--- EVENT PHASE ---")
       .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- FINAL SCORING (Round 12) ---")
       .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Round $1 / $2 ---");

  t = t.replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Round $1: Refilled players' hands to $2 sets.")
       .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Reshuffling discard pile back into draw pile.")
       .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Reshuffling discard pile back into draw pile.")
       .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Event deck exhausted. Reshuffled discarded events back into the deck.")
       .replace(/Brak dostępnych wydarzeń w talii\./g, "No available events in the deck.");

  t = t.replace(/WYLOSOWANO WYDARZENIE: \[(\d+)\] (.*)/g, (m, id, title) => {
    const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
    return `DRAWN EVENT: [${id}] ${translatedTitle}`;
  });

  t = t.replace(/--- Ręczne Wydarzenie: \[(\d+)\] (.*) ---/g, (m, id, title) => {
    const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
    return `--- Manual Event: [${id}] ${translatedTitle} ---`;
  });

  t = t.replace(/Efekt: (.*)/g, "Effect: $1")
       .replace(/Aktywowano wydarzenie: (.*)/g, "Activated event: $1")
       .replace(/Zmiany furii: (.*?) \(Zasięg zaktualizowany do (\d+)\)/g, (m, changes, r) => {
         let ch = changes.replace(/Wampiry/g, 'Vampires').replace(/Wilkołaki/g, 'Werewolves').replace(/Duchy/g, 'Ghosts').replace(/Bardaki/g, 'Bardaks');
         return `Anger changes: ${ch} (Range updated to ${r})`;
       })
       .replace(/Zmiany limitów band: (.*)/g, (m, changes) => {
         let ch = changes.replace(/Wampiry/g, 'Vampires').replace(/Wilkołaki/g, 'Werewolves').replace(/Duchy/g, 'Ghosts').replace(/Bardaki/g, 'Bardaks');
         return `Band limit changes: ${ch}`;
       })
       .replace(/Brak zmian furii\./g, "No anger changes.")
       .replace(/Brak zmian limitów band\./g, "No band limit changes.")
       .replace(/Wsparcie: Rozdano po (\d+) dodatkowym zestawie każdemu graczowi \(Suma: (\d+)\)\./g, "Support: Distributed $1 extra set to each player (Total: $2).")
       .replace(/Wsparcie: Brak dostępnych zestawów do rozdania\./g, "Support: No sets available to distribute.")
       .replace(/Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \(Suma: (\d+)\)\./g, (m, sectors, sum) => {
         let s = sectors.replace(/Wampiry/g, 'Vampires').replace(/Wilkołaki/g, 'Werewolves').replace(/Duchy/g, 'Ghosts').replace(/Bardaki/g, 'Bardaks');
         return `Great Wipe: Eliminated pawns in sectors: ${s} (Total: ${sum}).`;
       })
       .replace(/Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania\./g, "Great Wipe: No pawns in targeted sectors to eliminate.")
       .replace(/Przeniesiono pionki z \((\d+),(\d+)\) do \((\d+),(\d+)\): (.*?) \(Suma: (\d+)\)\./g, (m, x1, y1, x2, y2, pawns, sum) => {
         let p = pawns.replace(/Wampiry/g, 'Vampires').replace(/Wilkołaki/g, 'Werewolves').replace(/Duchy/g, 'Ghosts').replace(/Bardaki/g, 'Bardaks');
         return `Moved pawns from (${x1},${y1}) to (${x2},${y2}): ${p} (Total: ${sum}).`;
       })
       .replace(/Brak pionków w sektorze \((\d+),(\d+)\) do przeniesienia\./g, "No pawns in sector ($1,$2) to move.");

  t = t.replace(/Gracz (\d+) wybrał Generała bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} chose General of: ${raceMapEN[p2] || p2}`;
  });
  t = t.replace(/Gracz (\d+) wybrał Generała: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} chose General: ${raceMapEN[p2] || p2}`;
  });
  t = t.replace(/Gracz (\d+) zrezygnował z bycia Generałem bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} resigned from being General of: ${raceMapEN[p2] || p2}`;
  });

  t = t.replace(/Gracz (\d+) dobrał zestawy\./g, "Player $1 drew sets.")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
        "Player $1 placed Set $2 in sector [$3,$4] [$5] | Board: $6")
       .replace(/Ręcznie: Zestaw (.*?) wystawiony w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
        "Manually: Set $1 placed in sector [$2,$3] [$4] | Board: $5")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) \[(.*?)\] \| Plansza: (.*)/g,
        "Player $1 placed Set $2 [$3] | Board: $4")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) w regionie \[(\d+),(\d+)\]\./g,
        "Player $1 placed Set $2 in region [$3,$4].")
       .replace(/Ręcznie: Rozdano Zestaw (.*?) Graczowi (\d+)/g,
        "Manually: Distributed Set $1 to Player $2")
       .replace(/Ruch: (.*?) przeniesiony z \[(\d+),(\d+)\] do \[(\d+),(\d+)\]/g, (m, type, x1, y1, x2, y2) => {
         return `Move: ${raceMapEN[type] || type} moved from [${x1},${y1}] to [${x2},${y2}]`;
       })
       .replace(/Dodano (.*?) w sektorze \[(\d+),(\d+)\]/g, (m, type, x, y) => {
         return `Added ${raceMapEN[type] || type} in sector [${x},${y}]`;
       });

  t = t.replace(/Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\./g,
        "Player $1 passed and snitched with $2 excess sets. Jakub's fury updated.")
       .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?)\. Furia zaktualizowana \| Range: (\d+)/g,
        "Player $1 snitched to Jakub with set $2. Fury updated | Range: $3")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)/g,
        "Set $1 was snitched to Jakub. Fury updated | Range: $2")
       .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?) za 1 pkt\./g,
        "Player $1 snitched to Jakub with set $2 for 1 pt.")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi za 1 pkt\./g,
        "Set $1 was snitched to Jakub for 1 pt.")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi\./g,
        "Set $1 was snitched to Jakub.")
       .replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Player $1 made an empty move and passed.")
       .replace(/Gracz (\d+) spasował turę\./g, "Player $1 passed.")
       .replace(/Gracz (\d+) spasował\./g, "Player $1 passed.");

  t = t.replace(/Jakub przejął Zestaw (.*?)\. Furia\/Zasięg zaktualizowane natychmiast\./g, "Jakub took Set $1. Fury/Range updated immediately.")
       .replace(/Jakub przejął Zestaw (.*?)\. Furia zaktualizowana natychmiast\./g, "Jakub took Set $1. Fury updated immediately.")
       .replace(/Jakub przejął Zestaw (.*?) z puli\./g, "Jakub took Set $1 from pool.")
       .replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Jakub's fury subsided. Hunt completed.")
       .replace(/Jakub kończy swoje łowy\./g, "Jakub finishes his hunt.")
       .replace(/Zasięg Jakuba zresetowany do 1\./g, "Jakub's range reset to 1.")
       .replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
        "UNSTOPPABLE ANIMAL MAGNETISM! (You can't stop this) All bands from sectors $1 pulled to Jakub's sector [$2,$3]!")
       .replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
         return `Jakub moves to [${x},${y}] with range ${r}, chasing ${raceMapEN[race] || race} (Anger: ${anger} | Region contains ${count} units).`;
       })
       .replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
         return `Jakub killed ${kCount}x ${raceMapEN[race] || race} in sector [${x},${y}]. Anger drops to ${anger}.`;
       });

  t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, (m, p, race, pts) => {
         return `🔥 Jakub Witness: ${p} (${raceMapEN[race] || race}) gets ${pts} bonus points for surviving near Jakub.`;
       })
       .replace(/Punkty Świadka Jakuba przyznane:/g, "Jakub Witness points awarded:")
       .replace(/😇 Faza Miłosierdzia Jakuba:/g, "😇 Jakub's Mercy Phase:")
       .replace(/😇 Miłosierdzie Jakuba: (.*?) \((.*?)\) otrzymuje \+(\d+) pkt za pozostałą furię\./g, (m, p, race, pts) => {
         return `😇 Jakub's Mercy: ${p} (${raceMapEN[race] || race}) receives +${pts} pts for remaining fury.`;
       })
       .replace(/Gracz (\d+) \((.*?)\) otrzymuje (\d+) pkt\. z Fazy Miłosierdzia \(pozostało (\d+) furii u Jakuba\)\./g, (m, p, race, pts, rem) => {
         return `Player ${p} (${raceMapEN[race] || race}) receives ${pts} pts from Mercy Phase (${rem} fury remaining on Jakub).`;
       });

  t = t.replace(/Punktacja Końcowa: Gracz (\d+) \(\+(\d+) za bandę (.*?)\);/g, (m, p, pts, race) => {
         return `Final Scoring: Player ${p} (+${pts} for band ${raceMapEN[race] || race});`;
       })
       .replace(/Gracz (\d+) \((.*?)\) zdobywa (\d+) punktów bonusowych \(Bonus Końcowy\)\./g, (m, p, race, pts) => {
         return `Player ${p} (${raceMapEN[race] || race}) gets ${pts} bonus points (Final Bonus).`;
       })
       .replace(/KONIEC GRY! Zwycięzca: Gracz (\d+) z liczbą punktów: (\d+)\./g, "GAME OVER! Winner: Player $1 with score: $2.")
       .replace(/KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\d+)!/g, "GAME OVER! TIE between players: $1 with score: $2!");

  t = t.replace(/\(Wampiry\)/g, "(Vampires)")
       .replace(/\(Wilkołaki\)/g, "(Werewolves)")
       .replace(/\(Duchy\)/g, "(Ghosts)")
       .replace(/\(Bardaki\)/g, "(Bardaks)");

  return t;
};

const HistoryPanel = ({ logs = [] }) => {
  const { t, lang } = useTranslation();
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const displayLogs = logs.slice(-100);

  return (
    <div className="history-panel">
      <h3>{t('history_panel_title', { defaultValue: 'Game History (last 100)' })}</h3>
      <div className="history-log-container" ref={containerRef}>
        {displayLogs.length > 0 ? (
          displayLogs.map((log, index) => (
            <div key={index} className="history-log-item">
              <span className="log-time">[{log.time}] </span>
              <span className="log-text">{translateLog(log.text, lang, t)}</span>
            </div>
          ))
        ) : (
          <div className="history-empty">{t('history_empty', { defaultValue: 'No events yet...' })}</div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
