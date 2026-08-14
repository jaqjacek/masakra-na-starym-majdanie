import os
import json
import glob
import re

def build_log_translator():
    with open('src/constants/languages.js', 'r', encoding='utf-8') as f:
        js_text = f.read()

    codes_matches = re.findall(r"code:\s*'([^']+)'", js_text)

    all_dicts = {}
    race_maps_json = {}

    for code in codes_matches:
        path = f"src/locales/{code}.json"
        if not os.path.exists(path):
            path = "src/locales/en.json"
        
        with open(path, 'r', encoding='utf-8') as f:
            d = json.load(f)

        v = d.get('vampire') or d.get('vampires_title') or 'Vampires'
        w = d.get('werewolf') or d.get('werewolves_title') or 'Werewolves'
        g = d.get('ghost') or d.get('ghosts_title') or 'Ghosts'
        b = d.get('bardak') or d.get('bardaks_title') or 'Bardaks'

        race_maps_json[code] = {
            'Wampiry': v, 'Wilkołaki': w, 'Duchy': g, 'Bardaki': b,
            'vampire': v, 'werewolf': w, 'ghost': g, 'bardak': b,
            'V': v, 'W': w, 'G': g, 'B': b
        }

        player_word = d.get('stats_player', 'Player').replace(':', '').strip() or 'Player'
        set_word = d.get('sets_panel_btn', 'Set').replace('(', '').replace(')', '').strip() or 'Set'
        board_word = d.get('board_panel_title', 'Board:').strip()
        sector_word = d.get('sector_label', 'Sector [')
        
        # Build dictionary for log translation
        all_dicts[code] = {
            "race_V": v,
            "race_W": w,
            "race_G": g,
            "race_B": b,
            "player": player_word,
            "set": set_word,
            "board": board_word,
            "sector": sector_word,
            "in_sector": d.get('in_sector_text', 'in sector'),
            "in_region": d.get('in_region_text', 'in region'),
            "from_sector": d.get('from_sector_text', 'from sector'),
            "phase_setup": d.get('phase_setup', '--- Start of SETUP ---'),
            "phase_general": d.get('phase_general_phase', '--- Start of GENERALS PHASE ---'),
            "phase_player": d.get('phase_player_phase', '--- Start of PLAYERS PHASE ---'),
            "phase_jakub": d.get('phase_jakub_phase', '--- Start of JAKUB\'S PHASE ---'),
            "phase_event": d.get('phase_event_phase', '--- Start of EVENT PHASE ---'),
            "phase_player_round": '--- ' + d.get('phase_player_phase', 'Player Phase') + ' ({0}) ---',
            "jakub_hunt_started": '--- ' + d.get('jakub_fury_title', 'Jakub\'s Hunt') + ' ---',
            "event_phase_started": '--- ' + d.get('phase_event_phase', 'Event Phase') + ' ---',
            "final_scoring_phase": '--- ' + d.get('phase_final_scoring', 'FINAL SCORING') + ' (08:00) ---',
            "event_phase_title": '--- ' + d.get('phase_event_phase', 'EVENT PHASE') + ' ---',
            "final_scoring_round": '--- ' + d.get('phase_final_scoring', 'FINAL SCORING') + ' ({0}) ---',
            "round_header": '--- {0} / {1} ---',
            "refilled_hands": '{0}: +{1} ' + set_word,
            "reshuffle_discard": d.get('reshuffle_discard_msg', 'Reshuffling discard pile back into draw pile.'),
            "event_deck_exhausted": d.get('event_deck_exhausted_msg', 'Event deck exhausted. Reshuffled discarded events back into the deck.'),
            "no_events": d.get('no_events_msg', 'No available events in the deck.'),
            "event_drawn": d.get('events_panel_btn', 'EVENT') + ': [{0}] {1}',
            "manual_event": '--- ' + d.get('events_panel_btn', 'Event') + ': [{0}] {1} ---',
            "effect": d.get('effect_label', 'Effect') + ': {0}',
            "activated": d.get('activated_label', 'Activated') + ': {0}',
            "fury_changes": d.get('jakub_fury_title', 'Fury') + ': {0} (' + d.get('jakub_range_title', 'Range') + ': {1})',
            "limit_changes": 'Limit: {0}',
            "no_fury_changes": d.get('no_fury_changes_msg', 'No fury changes.'),
            "no_limit_changes": d.get('no_limit_changes_msg', 'No limit changes.'),
            "support_sets": '+{0} ' + set_word + ' ({1})',
            "support_no_sets": d.get('support_no_sets_msg', 'No sets available.'),
            "great_wipe": 'Eliminated: {0} ({1})',
            "great_wipe_none": d.get('great_wipe_none_msg', 'No pawns to eliminate.'),
            "moved_pawns": '{4} ({0},{1}) -> ({2},{3}) [{5}]',
            "no_pawns_to_move": '({0},{1}) -',
            "moved_prefix": d.get('moved_prefix', 'Moved') + ': {0}',
            "killed_prefix": d.get('killed_prefix', 'Killed') + ': {0}',
            "penalties_prefix": d.get('penalties_prefix', 'Penalties') + ': {0}',
            "escaped_prefix": d.get('escaped_prefix', 'Escaped') + ': {0}',
            "deserted_prefix": d.get('deserted_prefix', 'Deserted') + ': {0}',
            "bardak_penalty": b + ' -{0} pts',
            "witness_awarded": d.get('witness_awarded_msg', 'Witness points awarded:'),
            "mercy_phase_title": '😇 ' + d.get('mercy_phase_name', 'Jakub\'s Mercy') + ':',
            "witness_log": '🔥 ' + d.get('witness_word', 'Witness') + ': {0} ({1}) +{2} pts.',
            "mercy_log": '😇 ' + d.get('mercy_word', 'Mercy') + ': {0} ({1}) +{2} pts.',
            "mercy_rem_log": '{0} ({1}) +{2} pts ({3}).',
            "final_score_log": d.get('phase_final_scoring', 'Score') + ': {0} (+{1} {2});',
            "final_bonus_log": '{0} ({1}) +{2} pts.',
            "game_over_winner": d.get('game_over_title', 'GAME OVER!') + ' ' + d.get('winner_label', 'Winner') + ': {0} ({1} pts).',
            "game_over_tie": d.get('game_over_title', 'GAME OVER!') + ' ' + d.get('tie_label', 'TIE') + ': {0} ({1} pts)!',
            "chose_general": '{0} -> {1}',
            "resigned_general": '{0} (X) {1}',
            "drew_sets": '{0} + ' + set_word,
            "placed_set_detail": '{0} -> {1} [{2},{3}] [{4}] | {5}',
            "placed_set_manual": '({0}) [{1},{2}] [{3}] | {4}',
            "placed_set_simple": '{0} -> {1} [{2}] | {3}',
            "placed_set_region": '{0} -> {1} [{2},{3}]',
            "given_set_manual": '{0} -> {1}',
            "move_log": '{0} [{1},{2}] -> [{3},{4}]',
            "added_log": '+ {0} [{1},{2}]',
            "passed_snitched_excess": '{0} ' + d.get('pass', 'Pass') + ' ({1} ' + set_word + ')',
            "snitched_set_range": '{0} -> Jakub ({1}) | ' + d.get('jakub_range_title', 'Range') + ': {2}',
            "snitched_set_range_auto": '{0} -> Jakub | ' + d.get('jakub_range_title', 'Range') + ': {1}',
            "snitched_set_pt": '{0} -> Jakub ({1}) +1 pt',
            "snitched_set_pt_auto": '{0} -> Jakub +1 pt',
            "snitched_set_auto": '{0} -> Jakub',
            "passed_empty": '{0} ' + d.get('pass', 'Pass'),
            "passed_turn": '{0} ' + d.get('pass', 'Pass'),
            "passed": '{0} ' + d.get('pass', 'Pass'),
            "jakub_seized_range": 'Jakub + {0} | ' + d.get('jakub_range_title', 'Range'),
            "jakub_seized": 'Jakub + {0}',
            "jakub_seized_pool": 'Jakub + {0}',
            "jakub_fury_subsided": d.get('jakub_fury_subsided_msg', 'Jakub\'s fury subsided.'),
            "jakub_ends_hunt": d.get('jakub_ends_hunt_msg', 'Jakub ends hunt.'),
            "jakub_range_reset": d.get('jakub_range_reset_msg', 'Jakub range = 1.'),
            "magnetism_log": '🧲 MAGNETISM! {0} -> Jakub [{1},{2}]!',
            "jakub_chasing": 'Jakub [{0},{1}] ({2}) -> {3} ({4} | {5})',
            "jakub_killed": 'Jakub killed {0}x {1} [{2},{3}]. {4}'
        }

    # Preserved gold standard for the core 15 languages
    from build_full_i18n_matrix import LANGUAGES as GOLD_LANGUAGES
    for code, gold_d in GOLD_LANGUAGES.items():
        all_dicts[code] = gold_d
        v = gold_d.get('race_V', 'Vampires')
        w = gold_d.get('race_W', 'Werewolves')
        g = gold_d.get('race_G', 'Ghosts')
        b = gold_d.get('race_B', 'Bardaks')
        race_maps_json[code] = {
            'Wampiry': v, 'Wilkołaki': w, 'Duchy': g, 'Bardaki': b,
            'vampire': v, 'werewolf': w, 'ghost': g, 'bardak': b,
            'V': v, 'W': w, 'G': g, 'B': b
        }

    js_content = f'''// Multi-language Translation Engine for Game Logs (All 110 World Languages)
export const raceMaps = {json.dumps(race_maps_json, ensure_ascii=False, indent=2)};

export const getRace = (race, lang) => {{
  const map = raceMaps[lang] || raceMaps['en'] || raceMaps['pl'];
  return (map && map[race]) || race;
}};

export const dicts = {json.dumps(all_dicts, ensure_ascii=False, indent=2)};

function fmt(template, ...args) {{
  if (!template) return '';
  return template.replace(/\\{{(\\d+)\\}}/g, (_, i) => args[i] !== undefined ? args[i] : '');
}}

const localizeInnerString = (str, lang, d, getR) => {{
  if (!str) return '';
  let res = str;
  if (d.board) res = res.replace(/Plansza:/g, d.board);
  if (d.sector) res = res.replace(/Sektor \\[/g, d.sector);
  if (d.in_sector) res = res.replace(/w sektorze/g, d.in_sector);
  if (d.in_region) res = res.replace(/w regionie/g, d.in_region);
  if (d.from_sector) res = res.replace(/z sektora/g, d.from_sector);
  if (d.set) res = res.replace(/Zestaw ([A-Za-z0-9_-]+)/g, `${{d.set}} $1`);
  if (d.player) res = res.replace(/Gracz (\\d+)/g, `${{d.player}} $1`);

  ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {{
    res = res.replace(new RegExp(race, 'g'), getR(race));
  }});
  return res;
}};

export const translateLog = (text, lang, tFunc) => {{
  if (!text) return '';
  if (lang === 'pl') return text;

  const d = dicts[lang] || dicts['en'];
  const getR = (r) => getRace(r, lang);
  const loc = (s) => localizeInnerString(s, lang, d, getR);
  let t = text;

  // 1. Phases and Headers
  if (t === '--- Start of SETUP ---') return d.phase_setup || t;
  if (t === '--- Start of GENERAL PHASE ---' || t === '--- Start Fazy Generałów ---') return d.phase_general || t;
  if (t === '--- Start of PLAYER PHASE ---' || t === '--- Start Fazy Graczy ---') return d.phase_player || t;
  if (t === '--- Start of JAKUB PHASE ---' || t === '--- Start Fazy Jakuba ---') return d.phase_jakub || t;
  if (t === '--- Start of EVENT PHASE ---' || t === '--- Rozpoczęcie Fazy Wydarzeń ---') return d.event_phase_started || t;
  if (t === '--- Łowy Jakuba Rozpoczęte ---') return d.jakub_hunt_started || t;
  if (t === '--- FAZA PUNKTACJI KOŃCOWEJ (08:00) ---') return d.final_scoring_phase || t;
  if (t === '--- FAZA EVENTU ---') return d.event_phase_title || t;
  if (t === '--- PUNKTACJA KOŃCOWA (Runda 12) ---') return d.final_scoring_round || t;
  if (t === 'Przetasowywanie stosu odrzuconego do talii dobierania.' || t === 'Przetasowanie stosu odrzuconego z powrotem do talii dobierania.') return d.reshuffle_discard || t;
  if (t === 'Talia wydarzeń wyczerpała się. Przetasowano odrzucone wydarzenia z powrotem do talii.') return d.event_deck_exhausted || t;
  if (t === 'Brak dostępnych wydarzeń w talii.') return d.no_events || t;
  if (t === 'Furia Jakuba opadła. Łowy zakończone.') return d.jakub_fury_subsided || t;
  if (t === 'Jakub kończy swoje łowy.') return d.jakub_ends_hunt || t;
  if (t === 'Zasięg Jakuba zresetowany do 1.') return d.jakub_range_reset || t;
  if (t === 'Punkty Świadka Jakuba przyznane:') return d.witness_awarded || t;
  if (t === '😇 Faza Miłosierdzia Jakuba:') return d.mercy_phase_title || t;
  if (t === 'Brak zmian furii.') return d.no_fury_changes || t;
  if (t === 'Brak zmian limitów band.') return d.no_limit_changes || t;
  if (t === 'Wsparcie: Brak dostępnych zestawów do rozdania.') return d.support_no_sets || t;
  if (t === 'Wielkie Czyszczenie: Brak pionków na celowanych sektorach do wyeliminowania.') return d.great_wipe_none || t;

  let m;

  if ((m = t.match(/^--- Start Fazy Graczy \\(Runda (\\d+)\\) ---$/))) return fmt(d.phase_player_round, m[1]);
  if ((m = t.match(/^--- Runda (\\d+) \\/ (\\d+) ---$/))) return fmt(d.round_header, m[1], m[2]);
  if ((m = t.match(/^Runda (\\d+): Uzupełniono ręce graczy do (\\d+) zestawów\\.$/))) return fmt(d.refilled_hands, m[1], m[2]);

  // Events
  if ((m = t.match(/^WYLOSOWANO WYDARZENIE: \\[([^\\]]+)\\] (.*)$/))) {{
    const title = tFunc ? tFunc(`event.${{m[1]}}.title`, {{ defaultValue: m[2] }}) : m[2];
    return fmt(d.event_drawn, m[1], title);
  }}
  if ((m = t.match(/^--- Ręczne Wydarzenie: \\[([^\\]]+)\\] (.*) ---$/))) {{
    const title = tFunc ? tFunc(`event.${{m[1]}}.title`, {{ defaultValue: m[2] }}) : m[2];
    return fmt(d.manual_event, m[1], title);
  }}
  if ((m = t.match(/^Efekt: (.*)$/))) return fmt(d.effect, loc(m[1]));
  if ((m = t.match(/^Aktywowano wydarzenie: (.*)$/))) return fmt(d.activated, loc(m[1]));
  if ((m = t.match(/^Zmiany furii: (.*?) \\(Zasięg zaktualizowany do (\\d+)\\)$/))) return fmt(d.fury_changes, loc(m[1]), m[2]);
  if ((m = t.match(/^Zmiany limitów band: (.*)$/))) return fmt(d.limit_changes, loc(m[1]));
  if ((m = t.match(/^Wsparcie: Rozdano po (\\d+) dodatkowym zestawie każdemu graczowi \\(Suma: (\\d+)\\)\\.$/))) return fmt(d.support_sets, m[1], m[2]);
  if ((m = t.match(/^Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \\(Suma: (\\d+)\\)\\.$/))) return fmt(d.great_wipe, loc(m[1]), m[2]);
  if ((m = t.match(/^Przeniesiono pionki z \\((\\d+),(\\d+)\\) do \\((\\d+),(\\d+)\\): (.*?) \\(Suma: (\\d+)\\)\\.$/))) return fmt(d.moved_pawns, m[1], m[2], m[3], m[4], loc(m[5]), m[6]);
  if ((m = t.match(/^Brak pionków w sektorze \\((\\d+),(\\d+)\\) do przeniesienia\\.$/))) return fmt(d.no_pawns_to_move, m[1], m[2]);
  if ((m = t.match(/^Kary: Generał Bardaków stracił (\\d+) pkt$/))) return fmt(d.bardak_penalty, m[1]);
  if ((m = t.match(/^Przeniesiono: (.*)$/))) return fmt(d.moved_prefix, loc(m[1]));
  if ((m = t.match(/^Zabito: (.*)$/))) return fmt(d.killed_prefix, loc(m[1]));
  if ((m = t.match(/^Kary: (.*)$/))) return fmt(d.penalties_prefix, loc(m[1]));
  if ((m = t.match(/^Uciekli: (.*)$/))) return fmt(d.escaped_prefix, loc(m[1]));
  if ((m = t.match(/^Zdezerterowali: (.*)$/))) return fmt(d.deserted_prefix, loc(m[1]));

  // Witness & Mercy & End
  if ((m = t.match(/^🔥 Świadek Jakuba: (.*?) \\((.*?)\\) zdobywa (\\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\\.$/))) {{
    return fmt(d.witness_log, loc(m[1]), getR(m[2]), m[3]);
  }}
  if ((m = t.match(/^😇 Miłosierdzie Jakuba: (.*?) \\((.*?)\\) otrzymuje \\+(\\d+) pkt za pozostałą furię\\.$/))) {{
    return fmt(d.mercy_log, loc(m[1]), getR(m[2]), m[3]);
  }}
  if ((m = t.match(/^Gracz (\\d+) \\((.*?)\\) otrzymuje (\\d+) pkt\\. z Fazy Miłosierdzia \\(pozostało (\\d+) furii u Jakuba\\)\\.$/))) {{
    return fmt(d.mercy_rem_log, m[1], getR(m[2]), m[3], m[4]);
  }}
  if ((m = t.match(/^Punktacja Końcowa: Gracz (\\d+) \\(\\+(\\d+) za bandę (.*?)\\);$/))) {{
    return fmt(d.final_score_log, m[1], m[2], getR(m[3]));
  }}
  if ((m = t.match(/^Gracz (\\d+) \\((.*?)\\) zdobywa (\\d+) punktów bonusowych \\(Bonus Końcowy\\)\\.$/))) {{
    return fmt(d.final_bonus_log, m[1], getR(m[2]), m[3]);
  }}
  if ((m = t.match(/^KONIEC GRY! Zwycięzca: Gracz (\\d+) z liczbą punktów: (\\d+)\\.$/))) {{
    return fmt(d.game_over_winner, m[1], m[2]);
  }}
  if ((m = t.match(/^KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\\d+)!$/))) {{
    return fmt(d.game_over_tie, loc(m[1]), m[2]);
  }}

  // Generals
  if ((m = t.match(/^Gracz (\\d+) wybrał Generała(?: bandy)?: (.*)$/))) {{
    return fmt(d.chose_general, m[1], getR(m[2]));
  }}
  if ((m = t.match(/^Gracz (\\d+) zrezygnował z bycia Generałem bandy: (.*)$/))) {{
    return fmt(d.resigned_general, m[1], getR(m[2]));
  }}

  // Placements & Moves
  if ((m = t.match(/^Gracz (\\d+) dobrał zestawy\\.$/))) return fmt(d.drew_sets, m[1]);
  if ((m = t.match(/^Gracz (\\d+) wystawił Zestaw (.*?) w sektorze \\[([^\\]]+),([^\\]]+)\\] \\[(.*?)\\] \\| Plansza: (.*)$/))) {{
    return fmt(d.placed_set_detail, m[1], m[2], m[3], m[4], loc(m[5]), loc(m[6]));
  }}
  if ((m = t.match(/^Ręcznie: Zestaw (.*?) wystawiony w sektorze \\[([^\\]]+),([^\\]]+)\\] \\[(.*?)\\] \\| Plansza: (.*)$/))) {{
    return fmt(d.placed_set_manual, m[1], m[2], m[3], loc(m[4]), loc(m[5]));
  }}
  if ((m = t.match(/^Gracz (\\d+) wystawił Zestaw (.*?) \\[(.*?)\\] \\| Plansza: (.*)$/))) {{
    return fmt(d.placed_set_simple, m[1], m[2], loc(m[3]), loc(m[4]));
  }}
  if ((m = t.match(/^Gracz (\\d+) wystawił Zestaw (.*?) w regionie \\[([^\\]]+),([^\\]]+)\\]\\.$/))) {{
    return fmt(d.placed_set_region, m[1], m[2], m[3], m[4]);
  }}
  if ((m = t.match(/^Ręcznie: Rozdano Zestaw (.*?) Graczowi (\\d+)$/))) {{
    return fmt(d.given_set_manual, m[1], m[2]);
  }}
  if ((m = t.match(/^Ruch: (.*?) przeniesiony z \\[([^\\]]+),([^\\]]+)\\] do \\[([^\\]]+),([^\\]]+)\\]$/))) {{
    return fmt(d.move_log, getR(m[1]), m[2], m[3], m[4], m[5]);
  }}
  if ((m = t.match(/^Dodano (.*?) w sektorze \\[([^\\]]+),([^\\]]+)\\]$/))) {{
    return fmt(d.added_log, getR(m[1]), m[2], m[3]);
  }}

  // Snitching & Passing
  if ((m = t.match(/^Gracz (\\d+) spasował i podkablował (\\d+) nadmiarowych zestawów\\. Furia Jakuba zaktualizowana\\.$/))) {{
    return fmt(d.passed_snitched_excess, m[1], m[2]);
  }}
  if ((m = t.match(/^Gracz (\\d+) podkablował Jakubowi zestawem (.*?)\\. Furia zaktualizowana \\| Range: (\\d+)$/))) {{
    return fmt(d.snitched_set_range, m[1], m[2], m[3]);
  }}
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi\\. Furia zaktualizowana \\| Range: (\\d+)$/))) {{
    return fmt(d.snitched_set_range_auto, m[1], m[2]);
  }}
  if ((m = t.match(/^Gracz (\\d+) podkablował Jakubowi zestawem (.*?) za 1 pkt\\.$/))) {{
    return fmt(d.snitched_set_pt, m[1], m[2]);
  }}
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi za 1 pkt\\.$/))) {{
    return fmt(d.snitched_set_pt_auto, m[1]);
  }}
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi\\.$/))) {{
    return fmt(d.snitched_set_auto, m[1]);
  }}
  if ((m = t.match(/^Gracz (\\d+) złożył pusty ruch i spasował\\.$/))) return fmt(d.passed_empty, m[1]);
  if ((m = t.match(/^Gracz (\\d+) spasował turę\\.$/))) return fmt(d.passed_turn, m[1]);
  if ((m = t.match(/^Gracz (\\d+) spasował\\.$/))) return fmt(d.passed, m[1]);

  // Jakub hunt
  if ((m = t.match(/^Jakub przejął Zestaw (.*?)\\. Furia\\/Zasięg zaktualizowane natychmiast\\.$/))) return fmt(d.jakub_seized_range, m[1]);
  if ((m = t.match(/^Jakub przejął Zestaw (.*?)\\. Furia zaktualizowana natychmiast\\.$/))) return fmt(d.jakub_seized, m[1]);
  if ((m = t.match(/^Jakub przejął Zestaw (.*?) z puli\\.$/))) return fmt(d.jakub_seized_pool, m[1]);
  if ((m = t.match(/^NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \\(Tego nie pochamujesz\\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \\[([^\\]]+),([^\\]]+)\\]!$/))) {{
    return fmt(d.magnetism_log, loc(m[1]), m[2], m[3]);
  }}
  if ((m = t.match(/^Jakub przemieszcza się na \\[([^\\]]+),([^\\]]+)\\] w zasięgu (\\d+), ścigając (.*?) \\(Furia: (\\d+) \\| Region zawiera (\\d+) jednostek\\)\\.$/))) {{
    return fmt(d.jakub_chasing, m[1], m[2], m[3], getR(m[4]), m[5], m[6]);
  }}
  if ((m = t.match(/^Jakub zabił (\\d+)x (.*?) w sektorze \\[([^\\]]+),([^\\]]+)\\]\\. Furia rasy spada do (\\d+)\\.$/))) {{
    return fmt(d.jakub_killed, m[1], getR(m[2]), m[3], m[4], m[5]);
  }}

  // Global words replacement fallback
  return loc(t);
}};
'''

    with open('src/utils/logTranslator.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Successfully built src/utils/logTranslator.js for all 110 languages!")

if __name__ == '__main__':
    build_log_translator()
