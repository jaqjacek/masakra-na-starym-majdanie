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
  } else if (targetLang === 'es') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- Inicio de PREPARACIÓN ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Inicio de FASE DE LÍDERES ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Inicio de FASE DE JUGADORES ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Inicio de FASE DE JAKUB ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Inicio de FASE DE EVENTOS ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Inicio de Fase de Jugadores (Ronda $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Inicio de Fase de Jugadores ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Inicio de Fase de Líderes ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Inicio de Fase de Jakub ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Caza de Jakub Iniciada ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Inicio de Fase de Eventos ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FASE DE PUNTUACIÓN FINAL (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- FASE DE EVENTOS ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- PUNTUACIÓN FINAL (Ronda 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Ronda $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Ronda $1: Manos de jugadores rellenadas a $2 sets.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Barajando pila de descartes al mazo de robo.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Barajando pila de descartes al mazo de robo.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Mazo de eventos agotado. Eventos descartados barajados de vuelta.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "No hay eventos disponibles en el mazo.");
  } else if (targetLang === 'it') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- Inizio PREPARAZIONE ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Inizio FASE LEADER ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Inizio FASE GIOCATORI ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Inizio FASE DI JAKUB ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Inizio FASE EVENTI ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Inizio Fase Giocatori (Round $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Inizio Fase Giocatori ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Inizio Fase Leader ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Inizio Fase di Jakub ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Caccia di Jakub Iniziata ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Inizio Fase Eventi ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- FASE DI PUNTEGGIO FINALE (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- FASE EVENTI ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- PUNTEGGIO FINALE (Round 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Round $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Round $1: Mani dei giocatori riempite a $2 set.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Rimescolamento degli scarti nel mazzo di pesca.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Rimescolamento degli scarti nel mazzo di pesca.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Mazzo eventi esaurito. Eventi scartati rimescolati nel mazzo.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "Nessun evento disponibile nel mazzo.");
  } else if (targetLang === 'fr') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- Début de PRÉPARATION ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- Début de PHASE DES CHEFS ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- Début de PHASE DES JOUEURS ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- Début de PHASE DE JAKUB ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- Début de PHASE D'ÉVÉNEMENTS ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Début de Phase des Joueurs (Round $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Début de Phase des Joueurs ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Début de Phase des Chefs ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Début de Phase de Jakub ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Traque de Jakub Lancée ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Lancement de la Phase d'Événements ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- PHASE DE DÉCOMPTE FINAL (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- PHASE D'ÉVÉNEMENTS ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- DÉCOMPTE FINAL (Round 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Round $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Round $1: Mains des joueurs réapprovisionnées à $2 sets.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Mélange de la défausse dans la pioche.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Mélange de la défausse dans la pioche.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Pioche d'événements épuisée. Défausse remélangée.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "Aucun événement disponible dans la pioche.");
  } else if (targetLang === 'fi') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- VALMISTELUVAIHEEN alku ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- JOHTAJAVAIHEEN alku ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- PELAAJAVAIHEEN alku ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- JAKUB-VAIHEEN alku ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- TAPAHTUMAVAIHEEN alku ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Pelaajavaiheen alku (Kierros $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Pelaajavaiheen alku ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Johtajavaiheen alku ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Jakub-vaiheen alku ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Jakubin Jahti Alkanut ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Tapahtumavaiheen alku ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- LOPPUPISTEYTYSVAIHE (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- TAPAHTUMAVAIHE ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- LOPPUPISTEYTYS (Kierros 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Kierros $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Kierros $1: Pelaajien kädet täytetty $2 settiin.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Sekoitetaan poistopakka takaisin nostopakkaan.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Sekoitetaan poistopakka takaisin nostopakkaan.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Tapahtumaprosessi tyhjä. Poistetut kortit sekoitettiin takaisin.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "Ei tapahtumia saatavilla pakassa.");
  } else if (targetLang === 'sv') {
    t = t.replace(/--- Start of SETUP ---/gi, "--- FÖRBEREDELSEFASENS start ---")
         .replace(/--- Start of GENERAL PHASE ---/gi, "--- LEDARFASENS start ---")
         .replace(/--- Start of PLAYER PHASE ---/gi, "--- SPELARFASENS start ---")
         .replace(/--- Start of JAKUB PHASE ---/gi, "--- JAKUB-FASENS start ---")
         .replace(/--- Start of EVENT PHASE ---/gi, "--- HÄNDELSEFASENS start ---")
         .replace(/--- Start Fazy Graczy \(Runda (\d+)\) ---/g, "--- Spelarfasens start (Runda $1) ---")
         .replace(/--- Start Fazy Graczy ---/g, "--- Spelarfasens start ---")
         .replace(/--- Start Fazy Generałów ---/g, "--- Ledarfasens start ---")
         .replace(/--- Start Fazy Jakuba ---/g, "--- Jakub-fasens start ---")
         .replace(/--- Łowy Jakuba Rozpoczęte ---/g, "--- Jakubs Jakt Startad ---")
         .replace(/--- Rozpoczęcie Fazy Wydarzeń ---/g, "--- Händelsefasen Inledd ---")
         .replace(/--- FAZA PUNKTACJI KOŃCOWEJ \(08:00\) ---/g, "--- SLUTRÄKNINGSFAS (08:00) ---")
         .replace(/--- FAZA EVENTU ---/g, "--- HÄNDELSEFAS ---")
         .replace(/--- PUNKTACJA KOŃCOWA \(Runda 12\) ---/g, "--- SLUTRÄKNING (Runda 12) ---")
         .replace(/--- Runda (\d+) \/ (\d+) ---/g, "--- Runda $1 / $2 ---")
         .replace(/Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\./g, "Runda $1: Spelarnas händer fylldes på till $2 set.")
         .replace(/Przetasowywanie stosu odrzuconego do talii dobierania\./g, "Blandar om slänghögen till draghögen.")
         .replace(/Przetasowanie stosu odrzuconego z powrotem do talii dobierania\./g, "Blandar om slänghögen till draghögen.")
         .replace(/Talia wydarzeń wyczerpała się\. Przetasowano odrzucone wydarzenia z powrotem do talii\./g, "Händelsehögen tog slut. Slängda händelser blandades om.")
         .replace(/Brak dostępnych wydarzeń w talii\./g, "Inga händelser tillgängliga i högen.");
  } else {
    // English (default)
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
      sv: 'DRAGEN HÄNDELSE:', en: 'DRAWN EVENT:'
    }[targetLang] || 'DRAWN EVENT:';
    return `${prefix} [${id}] ${translatedTitle}`;
  });

  t = t.replace(/--- Ręczne Wydarzenie: \[(\d+)\] (.*) ---/g, (m, id, title) => {
    const translatedTitle = tFunc ? tFunc(`event.${id}.title`, { defaultValue: title }) : title;
    const prefix = {
      cs: 'Manuální Událost:', de: 'Manuelles Ereignis:', es: 'Evento Manual:',
      it: 'Evento Manuale:', fr: 'Événement Manuel :', fi: 'Manuaalinen Tapahtuma:',
      sv: 'Manuell Händelse:', en: 'Manual Event:'
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
       .replace(/Brak zmian furii\./g, "No anger changes.")
       .replace(/Brak zmian limitów band\./g, "No limit changes.")
       .replace(/Wsparcie: Rozdano po (\d+) dodatkowym zestawie każdemu graczowi \(Suma: (\d+)\)\./g, "Support: +$1 set per player (Total: $2).")
       .replace(/Wsparcie: Brak dostępnych zestawów do rozdania\./g, "Support: No sets available.")
       .replace(/Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \(Suma: (\d+)\)\./g, (m, sectors, sum) => {
         let s = sectors;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           s = s.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Great Wipe: Eliminated pawns in: ${s} (Total: ${sum}).`;
       })
       .replace(/Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania\./g, "Great Wipe: No pawns to eliminate.")
       .replace(/Przeniesiono pionki z \((\d+),(\d+)\) do \((\d+),(\d+)\): (.*?) \(Suma: (\d+)\)\./g, (m, x1, y1, x2, y2, pawns, sum) => {
         let p = pawns;
         ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
           p = p.replace(new RegExp(race, 'g'), getRace(race, targetLang));
         });
         return `Moved (${x1},${y1}) -> (${x2},${y2}): ${p} (Total: ${sum}).`;
       })
       .replace(/Brak pionków w sektorze \((\d+),(\d+)\) do przeniesienia\./g, "No pawns in ($1,$2) to move.");

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
        "Player $1 passed & snitched $2 sets. Jakub's fury updated.")
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
       .replace(/Gracz (\d+) złożył pusty ruch i spasował\./g, "Player $1 passed.")
       .replace(/Gracz (\d+) spasował turę\./g, "Player $1 passed.")
       .replace(/Gracz (\d+) spasował\./g, "Player $1 passed.");

  // 6. Jakub Actions & Magnetism
  t = t.replace(/Jakub przejął Zestaw (.*?)\. Furia\/Zasięg zaktualizowane natychmiast\./g, "Jakub took Set $1. Fury/Range updated.")
       .replace(/Jakub przejął Zestaw (.*?)\. Furia zaktualizowana natychmiast\./g, "Jakub took Set $1. Fury updated.")
       .replace(/Jakub przejął Zestaw (.*?) z puli\./g, "Jakub took Set $1.")
       .replace(/Furia Jakuba opadła\. Łowy zakończone\./g, "Jakub's fury subsided. Hunt over.")
       .replace(/Jakub kończy swoje łowy\./g, "Jakub finishes hunt.")
       .replace(/Zasięg Jakuba zresetowany do 1\./g, "Jakub's range reset to 1.")
       .replace(/NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[(.*?),(.*?)\]!/g,
        "UNSTOPPABLE ANIMAL MAGNETISM! All pawns from $1 pulled to Jakub's sector [$2,$3]!")
       .replace(/Jakub przemieszcza się na \[(\d+),(\d+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\./g, (m, x, y, r, race, anger, count) => {
         return `Jakub moves to [${x},${y}] (range ${r}), chasing ${getRace(race, targetLang)} (Fury: ${anger} | ${count} units).`;
       })
       .replace(/Jakub zabił (\d+)x (.*?) w sektorze \[(\d+),(\d+)\]\. Furia rasy spada do (\d+)\./g, (m, kCount, race, x, y, anger) => {
         return `Jakub killed ${kCount}x ${getRace(race, targetLang)} in [${x},${y}]. Fury drops to ${anger}.`;
       });

  // 7. Witness & Mercy Points
  t = t.replace(/🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\./g, (m, p, race, pts) => {
         return `🔥 Witness: ${p} (${getRace(race, targetLang)}) gets +${pts} pts for surviving near Jakub.`;
       })
       .replace(/Punkty Świadka Jakuba przyznane:/g, "Witness points awarded:")
       .replace(/😇 Faza Miłosierdzia Jakuba:/g, "😇 Mercy Phase:")
       .replace(/😇 Miłosierdzie Jakuba: (.*?) \((.*?)\) otrzymuje \+(\d+) pkt za pozostałą furię\./g, (m, p, race, pts) => {
         return `😇 Mercy: ${p} (${getRace(race, targetLang)}) +${pts} pts.`;
       })
       .replace(/Gracz (\d+) \((.*?)\) otrzymuje (\d+) pkt\. z Fazy Miłosierdzia \(pozostało (\d+) furii u Jakuba\)\./g, (m, p, race, pts, rem) => {
         return `Player ${p} (${getRace(race, targetLang)}) +${pts} pts from Mercy (${rem} fury left).`;
       });

  // 8. Final Scoring & Winners
  t = t.replace(/Punktacja Końcowa: Gracz (\d+) \(\+(\d+) za bandę (.*?)\);/g, (m, p, pts, race) => {
         return `Final Score: Player ${p} (+${pts} for ${getRace(race, targetLang)});`;
       })
       .replace(/Gracz (\d+) \((.*?)\) zdobywa (\d+) punktów bonusowych \(Bonus Końcowy\)\./g, (m, p, race, pts) => {
         return `Player ${p} (${getRace(race, targetLang)}) gets +${pts} bonus pts.`;
       })
       .replace(/KONIEC GRY! Zwycięzca: Gracz (\d+) z liczbą punktów: (\d+)\./g, "GAME OVER! Winner: Player $1 ($2 pts).")
       .replace(/KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\d+)!/g, "GAME OVER! TIE: $1 ($2 pts)!");

  ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
    t = t.replace(new RegExp(`\\(${race}\\)`, 'g'), `(${getRace(race, targetLang)})`);
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
