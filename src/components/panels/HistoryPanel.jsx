import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const translateLog = (text, lang) => {
  if (lang === 'pl') return text;
  
  let t = text;

  if (lang === 'cs') {
    // 1. Świadek Jakuba
    t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, 
      "🔥 Svědek Jakubův: $1 ($2) získává $3 bonusových bodů za přežití poblíž Jakuba.");
    
    t = t.replace(/Punkty Świadka Jakuba przyznane:/g, "Body Svědka Jakubova uděleny:");
    
    // 2. Choose General
    t = t.replace(/Gracz (\d+) wybrał Generała bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak)/g, (m, p1, p2) => {
      const raceMap = {
        'Wampiry': 'Upíři',
        'Wilkołaki': 'Vlkodlaci',
        'Duchy': 'Duchové',
        'Bardaki': 'Bardaci',
        'vampire': 'Upíři',
        'werewolf': 'Vlkodlaci',
        'ghost': 'Duchové',
        'bardak': 'Bardaci'
      };
      return `Hráč ${p1} vybral Vůdce bandy: ${raceMap[p2] || p2}`;
    });

    // 3. Draw sets
    t = t.replace(/Gracz (\d+) dobrał zestawy\./g, "Hráč $1 dobral sady.");

    // 4. Pass
    t = t.replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Hráč $1 provedl prázdný tah a pasoval.");
    t = t.replace(/Gracz (\d+) spasował\./g, "Hráč $1 pasoval.");

    // 5. Place Set
    t = t.replace(/Gracz (\d+) wystawił Zestaw (\d+) w regionie \[(\d+),(\d+)\]\./g, 
      "Hráč $1 nasadil Sadu $2 v sektoru [$3,$4].");

    // 6. Reshuffling
    t = t.replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, 
      "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.");

    // 7. Event Activation
    t = t.replace(/Aktywowano wydarzenie: (.*)/g, (m, title) => {
      return `Aktivována událost: ${title}`;
    });

    // 8. Jakub Phase
    t = t.replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Zuřivost Jakuba opadla. Lov dokončen.");
    
    t = t.replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
      "NEZKROTNÝ ZVÍŘECÍ MAGNETISMUS! (To nezastavíš) Všechny bandy ze sektorů $1 byly přitaženy do sektoru Jakuba [$2,$3]!");

    t = t.replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
      const raceMap = {
        'Wampiry': 'Upíři',
        'Wilkołaki': 'Vlkodlaci',
        'Duchy': 'Duchové',
        'Bardaki': 'Bardaci',
        'vampire': 'Upíři',
        'werewolf': 'Vlkodlaci',
        'ghost': 'Duchové',
        'bardak': 'Bardaci'
      };
      return `Jakub se přesouvá na [${x},${y}] v dosahu ${r}, pronásleduje ${raceMap[race] || race} (Zuřivost: ${anger} | Sektor obsahuje ${count} jednotek).`;
    });

    t = t.replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
      const raceMap = {
        'Wampiry': 'Upíři',
        'Wilkołaki': 'Vlkodlaci',
        'Duchy': 'Duchové',
        'Bardaki': 'Bardaci',
        'vampire': 'Upíři',
        'werewolf': 'Vlkodlaci',
        'ghost': 'Duchové',
        'bardak': 'Bardaci'
      };
      return `Jakub zabil ${kCount}x ${raceMap[race] || race} v sektoru [${x},${y}]. Zuřivost klesá na ${anger}.`;
    });

    t = t.replace(/\(Wampiry\)/g, "(Upíři)")
         .replace(/\(Wilkołaki\)/g, "(Vlkodlaci)")
         .replace(/\(Duchy\)/g, "(Duchové)")
         .replace(/\(Bardaki\)/g, "(Bardaci)");

    // 9. Extra manual placements and actions
    t = t.replace(/Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\./g,
      "Hráč $1 pasoval a prásknul $2 nadbytečných sad. Zuřivost Jakuba aktualizována.");

    t = t.replace(/Gracz (\d+) podkablował Jakubowi zestawem (\d+)\. Furia zaktualizowana \| Range: (\d+)/g,
      "Hráč $1 prásknul Jakubovi sadu $2. Zuřivost aktualizována | Dosah: $3");

    t = t.replace(/Zestaw (\d+) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)/g,
      "Sada $1 byla prásknuta Jakubovi. Zuřivost aktualizována | Dosah: $2");

    t = t.replace(/Gracz (\d+) podkablował Jakubowi zestawem (\d+) za 1 pkt\./g,
      "Hráč $1 prásknul Jakubovi sadu $2 za 1 bod.");

    t = t.replace(/Zestaw (\d+) został podkablowany Jakubowi\./g,
      "Sada $1 byla prásknuta Jakubovi.");

    t = t.replace(/Ręcznie: Zestaw (\d+) wystawiony w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
      "Manuálně: Sada $1 nasazena v sektoru [$2,$3] [$4] | Plán: $5");

    t = t.replace(/Ręcznie: Rozdano Zestaw (\d+) Graczowi (\d+)/g,
      "Manuálně: Rozdána Sada $1 Hráči $2");

    t = t.replace(/Gracz (\d+) zrezygnował z bycia Generałem bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak)/g, (m, p1, p2) => {
      const raceMap = {
        'Wampiry': 'Upíři',
        'Wilkołaki': 'Vlkodlaci',
        'Duchy': 'Duchové',
        'Bardaki': 'Bardaci',
        'vampire': 'Upíři',
        'werewolf': 'Vlkodlaci',
        'ghost': 'Duchové',
        'bardak': 'Bardaci'
      };
      return `Hráč ${p1} rezignoval z pozice Vůdce bandy: ${raceMap[p2] || p2}`;
    });

    return t;
  }
  
  // English translations (default fallback)
  // 1. Świadek Jakuba
  t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, 
    "🔥 Jakub Witness: $1 ($2) gets $3 bonus points for surviving near Jakub.");
  
  t = t.replace(/Punkty Świadka Jakuba przyznane:/g, "Jakub Witness points awarded:");
  
  // 2. Choose General
  t = t.replace(/Gracz (\d+) wybrał Generała bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak)/g, (m, p1, p2) => {
    const raceMap = {
      'Wampiry': 'Vampires',
      'Wilkołaki': 'Werewolves',
      'Duchy': 'Ghosts',
      'Bardaki': 'Bardaks',
      'vampire': 'Vampires',
      'werewolf': 'Werewolves',
      'ghost': 'Ghosts',
      'bardak': 'Bardaks'
    };
    return `Player ${p1} chose General of: ${raceMap[p2] || p2}`;
  });

  // 3. Draw sets
  t = t.replace(/Gracz (\d+) dobrał zestawy\./g, "Player $1 drew sets.");

  // 4. Pass
  t = t.replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Player $1 made an empty move and passed.");
  t = t.replace(/Gracz (\d+) spasował\./g, "Player $1 passed.");

  // 5. Place Set
  t = t.replace(/Gracz (\d+) wystawił Zestaw (\d+) w regionie \[(\d+),(\d+)\]\./g, 
    "Player $1 placed Set $2 in region [$3,$4].");

  // 6. Reshuffling
  t = t.replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, 
    "Reshuffling discard pile back into draw pile.");

  // 7. Event Activation
  t = t.replace(/Aktywowano wydarzenie: (.*)/g, (m, title) => {
    return `Activated event: ${title}`;
  });

  // 8. Jakub Phase
  t = t.replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Jakub's fury subsided. Hunt completed.");
  
  t = t.replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
    "UNSTOPPABLE ANIMAL MAGNETISM! (You can't stop this) All bands from sectors $1 pulled to Jakub's sector [$2,$3]!");

  t = t.replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
    const raceMap = {
      'Wampiry': 'Vampires',
      'Wilkołaki': 'Werewolves',
      'Duchy': 'Ghosts',
      'Bardaki': 'Bardaks',
      'vampire': 'Vampires',
      'werewolf': 'Werewolves',
      'ghost': 'Ghosts',
      'bardak': 'Bardaks'
    };
    return `Jakub moves to [${x},${y}] with range ${r}, chasing ${raceMap[race] || race} (Anger: ${anger} | Region contains ${count} units).`;
  });

  t = t.replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
    const raceMap = {
      'Wampiry': 'Vampires',
      'Wilkołaki': 'Werewolves',
      'Duchy': 'Ghosts',
      'Bardaki': 'Bardaks',
      'vampire': 'Vampires',
      'werewolf': 'Werewolves',
      'ghost': 'Ghosts',
      'bardak': 'Bardaks'
    };
    return `Jakub killed ${kCount}x ${raceMap[race] || race} in sector [${x},${y}]. Anger drops to ${anger}.`;
  });

  t = t.replace(/\(Wampiry\)/g, "(Vampires)")
       .replace(/\(Wilkołaki\)/g, "(Werewolves)")
       .replace(/\(Duchy\)/g, "(Ghosts)")
       .replace(/\(Bardaki\)/g, "(Bardaks)");

  // 9. Extra manual placements and actions
  t = t.replace(/Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\./g,
    "Player $1 passed and snitched with $2 excess sets. Jakub's fury updated.");

  t = t.replace(/Gracz (\d+) podkablował Jakubowi zestawem (\d+)\. Furia zaktualizowana \| Range: (\d+)/g,
    "Player $1 snitched to Jakub with set $2. Fury updated | Range: $3");

  t = t.replace(/Zestaw (\d+) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)/g,
    "Set $1 was snitched to Jakub. Fury updated | Range: $2");

  t = t.replace(/Gracz (\d+) podkablował Jakubowi zestawem (\d+) za 1 pkt\./g,
    "Player $1 snitched to Jakub with set $2 for 1 pt.");

  t = t.replace(/Zestaw (\d+) został podkablowany Jakubowi\./g,
    "Set $1 was snitched to Jakub.");

  t = t.replace(/Ręcznie: Zestaw (\d+) wystawiony w sektorze \[(\d+),(\d+)\] \[(.*?)\] \| Plansza: (.*)/g,
    "Manually: Set $1 placed in sector [$2,$3] [$4] | Board: $5");

  t = t.replace(/Ręcznie: Rozdano Zestaw (\d+) Graczowi (\d+)/g,
    "Manually: Distributed Set $1 to Player $2");

  t = t.replace(/Gracz (\d+) zrezygnował z bycia Generałem bandy: (Wampiry|Wilkołaki|Duchy|Bardaki|vampire|werewolf|ghost|bardak)/g, (m, p1, p2) => {
    const raceMap = {
      'Wampiry': 'Vampires',
      'Wilkołaki': 'Werewolves',
      'Duchy': 'Ghosts',
      'Bardaki': 'Bardaks',
      'vampire': 'Vampires',
      'werewolf': 'Werewolves',
      'ghost': 'Ghosts',
      'bardak': 'Bardaks'
    };
    return `Player ${p1} resigned from being General of: ${raceMap[p2] || p2}`;
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
              <span className="log-text">{translateLog(log.text, lang)}</span>
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
