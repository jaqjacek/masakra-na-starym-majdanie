import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const raceMaps = {
  cs: {
    'Wampiry': 'Upíři', 'Wilkołaki': 'Vlkodlaci', 'Duchy': 'Duchové', 'Bardaki': 'Bardaci',
    'vampire': 'Upíři', 'werewolf': 'Vlkodlaci', 'ghost': 'Duchové', 'bardak': 'Bardaci',
    'V': 'Upíři', 'W': 'Vlkodlaci', 'G': 'Duchové', 'B': 'Bardaci'
  },
  de: {
    'Wampiry': 'Vampire', 'Wilkołaki': 'Werwölfe', 'Duchy': 'Geister', 'Bardaki': 'Bardaken',
    'vampire': 'Vampire', 'werewolf': 'Werwölfe', 'ghost': 'Geister', 'bardak': 'Bardaken',
    'V': 'Vampire', 'W': 'Werwölfe', 'G': 'Geister', 'B': 'Bardaken'
  },
  es: {
    'Wampiry': 'Vampiros', 'Wilkołaki': 'Hombres Lobo', 'Duchy': 'Fantasmas', 'Bardaki': 'Bardaks',
    'vampire': 'Vampiros', 'werewolf': 'Hombres Lobo', 'ghost': 'Fantasmas', 'bardak': 'Bardaks',
    'V': 'Vampiros', 'W': 'Hombres Lobo', 'G': 'Fantasmas', 'B': 'Bardaks'
  },
  it: {
    'Wampiry': 'Vampiri', 'Wilkołaki': 'Licantropi', 'Duchy': 'Spettri', 'Bardaki': 'Bardak',
    'vampire': 'Vampiri', 'werewolf': 'Licantropi', 'ghost': 'Spettri', 'bardak': 'Bardak',
    'V': 'Vampiri', 'W': 'Licantropi', 'G': 'Spettri', 'B': 'Bardak'
  },
  fr: {
    'Wampiry': 'Vampires', 'Wilkołaki': 'Loups-Garous', 'Duchy': 'Fantômes', 'Bardaki': 'Bardaks',
    'vampire': 'Vampires', 'werewolf': 'Loups-Garous', 'ghost': 'Fantômes', 'bardak': 'Bardaks',
    'V': 'Vampires', 'W': 'Loups-Garous', 'G': 'Fantômes', 'B': 'Bardaks'
  },
  fi: {
    'Wampiry': 'Vampyyrit', 'Wilkołaki': 'Ihmissudet', 'Duchy': 'Aaveet', 'Bardaki': 'Bardakit',
    'vampire': 'Vampyyrit', 'werewolf': 'Ihmissudet', 'ghost': 'Aaveet', 'bardak': 'Bardakit',
    'V': 'Vampyyrit', 'W': 'Ihmissudet', 'G': 'Aaveet', 'B': 'Bardakit'
  },
  sv: {
    'Wampiry': 'Vampyrer', 'Wilkołaki': 'Varulvar', 'Duchy': 'Spöken', 'Bardaki': 'Bardaker',
    'vampire': 'Vampyrer', 'werewolf': 'Varulvar', 'ghost': 'Spöken', 'bardak': 'Bardaker',
    'V': 'Vampyrer', 'W': 'Varulvar', 'G': 'Spöken', 'B': 'Bardaker'
  },
  ja: {
    'Wampiry': '吸血鬼', 'Wilkołaki': '人狼', 'Duchy': '亡霊', 'Bardaki': 'バルダック',
    'vampire': '吸血鬼', 'werewolf': '人狼', 'ghost': '亡霊', 'bardak': 'バルダック',
    'V': '吸血鬼', 'W': '人狼', 'G': '亡霊', 'B': 'バルダック'
  },
  uk: {
    'Wampiry': 'Вампіри', 'Wilkołaki': 'Вовкулаки', 'Duchy': 'Привиди', 'Bardaki': 'Бардаки',
    'vampire': 'Вампіри', 'werewolf': 'Вовкулаки', 'ghost': 'Привиди', 'bardak': 'Бардаки',
    'V': 'Вампіри', 'W': 'Вовкулаки', 'G': 'Привиди', 'B': 'Бардаки'
  },
  zh: {
    'Wampiry': '吸血鬼', 'Wilkołaki': '狼人', 'Duchy': '幽灵', 'Bardaki': '巴尔达克',
    'vampire': '吸血鬼', 'werewolf': '狼人', 'ghost': '幽灵', 'bardak': '巴尔达克',
    'V': '吸血鬼', 'W': '狼人', 'G': '幽灵', 'B': '巴尔达克'
  },
  ru: {
    'Wampiry': 'Вампиры', 'Wilkołaki': 'Оборотни', 'Duchy': 'Призраки', 'Bardaki': 'Бардаки',
    'vampire': 'Вампиры', 'werewolf': 'Оборотни', 'ghost': 'Призраки', 'bardak': 'Бардаки',
    'V': 'Вампиры', 'W': 'Оборотни', 'G': 'Призраки', 'B': 'Бардаки'
  },
  pt: {
    'Wampiry': 'Vampiros', 'Wilkołaki': 'Lobisomens', 'Duchy': 'Fantasmas', 'Bardaki': 'Bardaks',
    'vampire': 'Vampiros', 'werewolf': 'Lobisomens', 'ghost': 'Fantasmas', 'bardak': 'Bardaks',
    'V': 'Vampiros', 'W': 'Lobisomens', 'G': 'Fantasmas', 'B': 'Bardaks'
  },
  ko: {
    'Wampiry': '뱀파이어', 'Wilkołaki': '늑대인간', 'Duchy': '유령', 'Bardaki': '바르닥',
    'vampire': '뱀파이어', 'werewolf': '늑대인간', 'ghost': '유령', 'bardak': '바르닥',
    'V': '뱀파이어', 'W': '늑대인간', 'G': '유령', 'B': '바르닥'
  },
  en: {
    'Wampiry': 'Vampires', 'Wilkołaki': 'Werewolves', 'Duchy': 'Ghosts', 'Bardaki': 'Bardaks',
    'vampire': 'Vampires', 'werewolf': 'Werewolves', 'ghost': 'Ghosts', 'bardak': 'Bardaks',
    'V': 'Vampires', 'W': 'Werewolves', 'G': 'Ghosts', 'B': 'Bardaks'
  }
};

const getRace = (race, lang) => {
  const map = raceMaps[lang] || raceMaps['en'];
  return map[race] || race;
};

const translateLog = (text, lang, tFunc) => {
  if (!text) return '';
  if (lang === 'pl') return text;

  const targetLang = raceMaps[lang] ? lang : 'en';
  let t = text;

  // 1. General & Phase Headers
  if (targetLang === 'cs') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- Začátek PŘÍPRAVY ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Začátek FÁZE VŮDCŮ ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Začátek FÁZE HRÁČŮ ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Začátek FÁZE JAKUBA ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Začátek FÁZE UDÁLOSTÍ ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Začátek Fáze Hráčů (Kolo $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Začátek Fáze Hráčů ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Začátek Fáze Vůdců ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Začátek Fáze Jakuba ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Lov Jakuba Zahájen ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Zahájení Fáze Událostí ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FÁZE ZÁVĚREČNÉHO BODOVÁNÍ (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- FÁZE UDÁLOSTÍ ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- ZÁVĚREČNÉ BODOVÁNÍ (12. Kolo) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Kolo $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Kolo $1: Ruce hráčů doplněny na $2 sad.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Balíček událostí došel. Odhozené události byly zamíchány zpět do balíčku.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "V balíčku nejsou žádné dostupné události.");
  } else if (targetLang === 'de') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- Beginn VORBEREITUNG ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Beginn ANFÜHRERPHASE ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Beginn SPIELERPHASE ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Beginn JAKUB-PHASE ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Beginn EREIGNISPHASE ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Beginn Spielerphase (Runde $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Beginn Spielerphase ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Beginn Anführerphase ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Beginn Jakub-Phase ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Jakubs Jagd Gestartet ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Beginn der Ereignisphase ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- SCHLUSSWERTUNGSPHASE (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- EREIGNISPHASE ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- SCHLUSSWERTUNG (Runde 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Runde $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Runde $1: Spielerhände auf $2 Sets aufgefüllt.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Ablagestapel wird in den Nachziehstapel gemischt.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Ablagestapel wird in den Nachziehstapel gemischt.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Ereignisstapel leer. Abgelegte Ereignisse wurden eingemischt.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "Keine Ereignisse im Stapel verfügbar.");
  } else if (targetLang === 'ja') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- 準備フェーズ開始 ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- 指揮官フェーズ開始 ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- プレイヤーフェーズ開始 ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- ヤクブフェーズ開始 ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- イベントフェーズ開始 ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- プレイヤーフェーズ開始（第$1ラウンド） ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- プレイヤーフェーズ開始 ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- 指揮官フェーズ開始 ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- ヤクブフェーズ開始 ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- ヤクブの狩り開始 ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- イベントフェーズ開始 ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- 最終得点計算フェーズ (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- イベントフェーズ ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- 最終得点計算（第12ラウンド） ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- ラウンド $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "ラウンド $1: プレイヤーの手札を$2セットに補充。")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "捨て札を山札に混ぜてシャッフル。")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "捨て札を山札に混ぜてシャッフル。")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "イベント山札切れ。捨て札をシャッフルして戻しました。")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "山札に利用可能なイベントがありません。");
  } else {
    // English & standard international default
    t = t.replace(/--- Start of SETUP ---/gi, "--- Start of SETUP ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Start of GENERALS PHASE ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Start of PLAYERS PHASE ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Start of JAKUB'S PHASE ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Start of EVENT PHASE ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Start of Player Phase (Round $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Start of Player Phase ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Start of Generals Phase ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Start of Jakub's Phase ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Jakub's Hunt Started ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Event Phase Started ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FINAL SCORING PHASE (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- EVENT PHASE ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- FINAL SCORING (Round 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Round $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Round $1: Refilled players' hands to $2 sets.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Reshuffling discard pile back into draw pile.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Reshuffling discard pile back into draw pile.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Event deck exhausted. Reshuffled discarded events back into the deck.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "No available events in the deck.");
  }

  // 2. Events Lookups
  t = t.replace(/WYLOSOWANO WYDARZENIE: \[(\d+)\] (.*)/g, (m, id, title) => {
    const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
    const prefix = {
      cs: 'VYLOSOVÁNA UDÁLOST:', de: 'GEZOGENES EREIGNIS:', es: 'EVENTO ROBADO:',
      it: 'EVENTO PESCATO:', fr: 'ÉVÉNEMENT PIOCHÉ :', fi: 'NOSTETTU TAPAHTUMA:',
      sv: 'DRAGEN HÄNDELSE:', ja: '引いたイベント:', uk: 'ВИТЯГНУТА ПОДІЯ:',
      zh: '抽取事件:', ru: 'ВЫТЯНУТО СОБЫТИЕ:', pt: 'EVENTO SORTEADO:', ko: '뽑은 이벤트:',
      en: 'EVENT DRAWN:'
    }[targetLang] || 'EVENT DRAWN:';
    return `${prefix} [${id}] ${translatedTitle}`;
  });

  t = t.replace(/--- Ręczne Wydarzenie: \[(\d+)\] (.*) ---/g, (m, id, title) => {
    const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
    const prefix = {
      cs: 'Manuální Událost:', de: 'Manuelles Ereignis:', es: 'Evento Manual:',
      it: 'Evento Manuale:', fr: 'Événement Manuel :', fi: 'Manuaalinen Tapahtuma:',
      sv: 'Manuell Händelse:', ja: '手動イベント:', uk: 'Ручна Подія:',
      zh: '手动事件:', ru: 'Ручное Событие:', pt: 'Evento Manual:', ko: '수동 이벤트:',
      en: 'Manual Event:'
    }[targetLang] || 'Manual Event:';
    return `--- ${prefix} [${id}] ${translatedTitle} ---`;
  });

  // 3. Event Effects & Anger/Limits
  t = t.replace(/Efekt: (.*)/g, (m, d) => `Effect: ${d}`)
       .replace(/Aktywowano wydarzenie: (.*)/g, (m, name) => `Activated: ${name}`)
       .replace(/Zmiany furii: (.*?) \(Zasięg zaktualizowany do (\d+)\)/g, (m, changes, r) => {
         let ch = changes;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           ch = ch.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Fury changes: ${ch} (Range: ${r})`;
       })
       .replace(/Zmiany limitów band: (.*)/g, (m, changes) => {
         let ch = changes;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           ch = ch.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Limit changes: ${ch}`;
       })
       .replace(/Brak zmian furii\./g, "No fury changes.")
       .replace(/Brak zmian limitów band\./g, "No limit changes.")
       .replace(/Wsparcie: Rozdano po (\d+) dodatkowym zestawie każdemu graczowi \(Suma: (\d+)\)\./g, "Support: +$1 set per player (Total: $2).")
       .replace(/Wsparcie: Brak dostępnych zestawów do rozdania\./g, "Support: No sets available to distribute.")
       .replace(/Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \(Suma: (\d+)\)\./g, (m, sectors, sum) => {
         let s = sectors;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           s = s.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Great Wipe: Eliminated pawns in sectors: ${s} (Total: ${sum}).`;
       })
       .replace(/Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania\./g, "Great Wipe: No pawns to eliminate.")
       .replace(/Przeniesiono pionki z \((\d+),(\d+)\) do \((\d+),(\d+)\): (.*?) \(Suma: (\d+)\)\./g, (m, x1, y1, x2, y2, pawns, sum) => {
         let p = pawns;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           p = p.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Moved (${x1},${y1}) -> (${x2},${y2}): ${p} (Total: ${sum}).`;
       })
       .replace(/Brak pionków w sektorze \((\d+),(\d+)\) do przeniesienia\./g, "No pawns in ($1,$2) to move.")
       .replace(/Przeniesiono: (.*)/g, "Moved: $1")
       .replace(/Zabito: (.*)/g, "Killed: $1")
       .replace(/Kary: (.*)/g, "Penalties: $1")
       .replace(/Uciekli: (.*)/g, "Escaped: $1")
       .replace(/Zdezerterowali: (.*)/g, "Deserted: $1")
       .replace(/Generał Bardaków stracił (\d+) pkt/g, "Bardak General lost $1 pts");

  // 4. Generals Selection / Resignation
  t = t.replace(/Gracz (\d+) wybrał Generała bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} chose General: ${getRace(p2, targetLang)}`;
  });
  t = t.replace(/Gracz (\d+) wybrał Generała: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} chose General: ${getRace(p2, targetLang)}`;
  });
  t = t.replace(/Gracz (\d+) zrezygnował z bycia Generałem bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak|V|W|G|B)/g, (m, p1, p2) => {
    return `Player ${p1} resigned from General of: ${getRace(p2, targetLang)}`;
  });

  // 5. Player Moves & Pass & Snitching
  t = t.replace(/Gracz (\d+) dobrał zestawy\./g, "Player $1 drew sets.")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
        "Player $1 placed Set $2 in sector [$3,$4] [$5] | Board: $6")
       .replace(/Ręcznie: Zestaw (.*?) wystawiony w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
        "Manually: Set $1 placed in [$2,$3] [$4] | Board: $5")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) \[(.*?)\] \| Plansza: (.*)/g,
        "Player $1 placed Set $2 [$3] | Board: $4")
       .replace(/Gracz (\d+) wystawił Zestaw (.*?) w regionie \[(\d+),(\d+)\]\./g,
        "Player $1 placed Set $2 in region [$3,$4].")
       .replace(/Ręcznie: Rozdano Zestaw (.*?) Graczowi (\d+)/g,
        "Manually: Given Set $1 to Player $2")
       .replace(/Ruch: (.*?) przeniesiony z \[(\d+),(\d+)\] do \[(\d+),(\d+)\]/g, (m, type, x1, y1, x2, y2) => {
         return `Move: ${getRace(type, targetLang)} from [${x1},${y1}] to [${x2},${y2}]`;
       })
       .replace(/Dodano (.*?) w sektorze \[(\d+),(\d+)\]/g, (m, type, x, y) => {
         return `Added ${getRace(type, targetLang)} in [${x},${y}]`;
       });

  t = t.replace(/Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\./g,
        "Player $1 passed & snitched $2 excess sets. Jakub's fury updated.")
       .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?)\. Furia zaktualizowana \| Range: (\d+)/g,
        "Player $1 snitched with set $2. Fury updated | Range: $3")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)/g,
        "Set $1 snitched to Jakub. Fury updated | Range: $2")
       .replace(/Gracz (\d+) podkablował Jakubowi zestawem (.*?) za 1 pkt\./g,
        "Player $1 snitched with set $2 for 1 pt.")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi za 1 pkt\./g,
        "Set $1 snitched for 1 pt.")
       .replace(/Zestaw (.*?) został podkablowany Jakubowi\./g,
        "Set $1 snitched to Jakub.")
       .replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Player $1 made an empty move and passed.")
       .replace(/Gracz (\d+) spasował turę\./g, "Player $1 passed turn.")
       .replace(/Gracz (\d+) spasował\./g, "Player $1 passed.")
       .replace(/Gracz (\d+)/g, "Player $1");

  // 6. Jakub Actions & Magnetism
  t = t.replace(/Jakub przejął Zestaw (.*?)\. Furia\/Zasięg zaktualizowane natychmiast\./g, "Jakub seized Set $1. Fury/Range updated.")
       .replace(/Jakub przejął Zestaw (.*?)\. Furia zaktualizowana natychmiast\./g, "Jakub seized Set $1. Fury updated.")
       .replace(/Jakub przejął Zestaw (.*?) z puli\./g, "Jakub seized Set $1 from pool.")
       .replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Jakub's fury subsided. Hunt ended.")
       .replace(/Jakub kończy swoje łowy\./g, "Jakub ends his hunt.")
       .replace(/Zasięg Jakuba zresetowany do 1\./g, "Jakub's range reset to 1.")
       .replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
        "UNSTOPPABLE ANIMAL MAGNETISM! All pawns from $1 pulled to Jakub's sector [$2,$3]!")
       .replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
         return `Jakub moves to [${x},${y}] (range ${r}), chasing ${getRace(race, targetLang)} (Fury: ${anger} | ${count} units).`;
       })
       .replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
         return `Jakub killed ${kCount}x ${getRace(race, targetLang)} in [${x},${y}]. Faction fury drops to ${anger}.`;
       });

  // 7. Witness & Mercy Points
  t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, (m, p, race, pts) => {
         return `🔥 Witness: ${p} (${getRace(race, targetLang)}) gets +${pts} pts for surviving near Jakub.`;
       })
       .replace(/Punkty Świadka Jakuba przyznane:/g, "Witness points awarded:")
       .replace(/😇 Faza Miłosierdzia Jakuba:/g, "😇 Jakub's Mercy Phase:")
       .replace(/😇 Miłosierdzie Jakuba: (.*?) \((.*?)\) otrzymuje \+(\d+) pkt za pozostałą furię\./g, (m, p, race, pts) => {
         return `😇 Mercy: ${p} (${getRace(race, targetLang)}) +${pts} pts for remaining fury.`;
       })
       .replace(/Gracz (\d+) \((.*?)\) otrzymuje (\d+) pkt\. z Fazy Miłosierdzia \(pozostało (\d+) furii u Jakuba\)\./g, (m, p, race, pts, rem) => {
         return `Player ${p} (${getRace(race, targetLang)}) +${pts} pts from Mercy (${rem} fury remaining).`;
       });

  // 8. Final Scoring & Winners
  t = t.replace(/Punktacja Końcowa: Gracz (\d+) \(\+(\d+) za bandę (.*?)\);/g, (m, p, pts, race) => {
         return `Final Score: Player ${p} (+${pts} for ${getRace(race, targetLang)});`;
       })
       .replace(/Gracz (\d+) \((.*?)\) zdobywa (\d+) punktów bonusowych \(Bonus Końcowy\)\./g, (m, p, race, pts) => {
         return `Player ${p} (${getRace(race, targetLang)}) gets +${pts} bonus pts (End Bonus).`;
       })
       .replace(/KONIEC GRY! Zwycięzca: Gracz (\d+) z liczbą punktów: (\d+)\./g, "GAME OVER! Winner: Player $1 ($2 pts).")
       .replace(/KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\d+)!/g, "GAME OVER! TIE: $1 ($2 pts)!");

  // 9. Board & Keywords translation
  t = t.replace(/Plansza:/g, "Board:")
       .replace(/Sektor \[/g, "Sector [")
       .replace(/w sektorze/g, "in sector")
       .replace(/w regionie/g, "in region")
       .replace(/z sektora/g, "from sector")
       .replace(/Zestaw ([A-Za-z0-9_-]+)/g, "Set $1");

  ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
    t = t.replace(new RegExp(race, 'g'), getRace(race, targetLang));
  });

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
