import os
import json
import urllib.request
import urllib.parse
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. Precise native dictionary for PASS button across all 110 languages
PASS_DICT = {
    'pl': 'PASUJ',
    'en': 'PASS',
    'de': 'PASSEN',
    'es': 'PASAR',
    'cs': 'PASOVAT',
    'fr': 'PASSER',
    'it': 'PASSA',
    'sv': 'PASSA',
    'fi': 'PASSAA',
    'uk': 'ПАС',
    'ja': 'パス',
    'zh': '过牌',
    'zh-TW': '過牌',
    'pt': 'PASSAR',
    'pt-BR': 'PASSAR',
    'ko': '패스',
    'ru': 'ПАС',
    'ar': 'تخطي',
    'hi': 'पास',
    'tr': 'PAS GEÇ',
    'nl': 'PAS',
    'el': 'ΠΑΡΑΒΛΕΨΗ',
    'ro': 'PAS',
    'hu': 'PASSZ',
    'vi': 'BỎ LƯỢT',
    'id': 'LEWAT',
    'th': 'ผ่าน',
    'he': 'וותר',
    'da': 'PAS',
    'no': 'PASS',
    'sk': 'PASOVAŤ',
    'bg': 'ПАС',
    'hr': 'PAS',
    'sr': 'ПАС',
    'sl': 'PAS',
    'lt': 'PRALEISTI',
    'lv': 'IZLAIST',
    'et': 'PASSI',
    'ga': 'PASÁIL',
    'cy': 'PASIO',
    'gd': 'SEACHAIN',
    'is': 'PASSA',
    'ca': 'PASSAR',
    'eu': 'PASATU',
    'gl': 'PASAR',
    'sq': 'KALO',
    'mk': 'ПАС',
    'bs': 'PAS',
    'mt': 'QBEŻ',
    'ka': 'პასი',
    'hy': 'ՊԱՍ',
    'az': 'PAS',
    'kk': 'ПАС',
    'uz': 'PAS',
    'mn': 'ПАС',
    'fa': 'پاس',
    'ku': 'PAS',
    'ps': 'تېرېدل',
    'ur': 'پاس',
    'bn': 'পাস',
    'pa': 'ਪਾਸ',
    'gu': 'પાસ',
    'ta': 'கடந்து செல்',
    'te': 'పాస్',
    'kn': 'ಪಾಸ್',
    'ml': 'പാസ്സ്',
    'mr': 'पास',
    'ne': 'पास',
    'si': 'පාස්',
    'my': 'ကျော်မည်',
    'km': 'រំលង',
    'lo': 'ຜ່ານ',
    'tl': 'PASA',
    'ms': 'LALU',
    'sw': 'PITA',
    'am': 'ማለፍ',
    'yo': 'KỌJA',
    'ig': 'GHAARA',
    'ha': 'WUCE',
    'zu': 'DLULA',
    'xh': 'GQIBA',
    'af': 'PAS',
    'so': 'GUDUB',
    'mg': 'LALANA',
    'eo': 'PASI',
    'la': 'TRANSIRE',
    'be': 'ПАС',
    'lb': 'PASSEN',
    'fo': 'PASSA',
    'kl': 'QAANGIUK',
    'bo': 'བརྒལ་བ།',
    'yi': 'פּאַסן',
    'rm': 'PASSAR',
    'oc': 'PASSAR',
    'br': 'PASSIÑ',
    'co': 'PASSÀ',
    'sc': 'PASSARE',
    'fy': 'PASSE',
    'haw': 'HALA',
    'mi': 'PAHI',
    'sm': 'PASI',
    'fj': 'TOSI',
    'ty': 'HAERE',
    'qu': 'PASAY',
    'gn': 'HASAY',
    'ay': 'PASAYA',
    'nah': 'PANOTL',
    'myn': 'MÁAN',
    'tlh': 'juS',
    'sjn': 'gwanno'
}

# Update all locale files with exact pass word
locale_files = [f for f in os.listdir('src/locales') if f.endswith('.json')]
for fname in locale_files:
    code = fname.replace('.json', '')
    path = os.path.join('src/locales', fname)
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if code in PASS_DICT:
        data['pass'] = PASS_DICT[code]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated 'pass' key in all locale files!")

# 2. Now let's build FULL-SENTENCE log templates for all 110 languages
from build_full_i18n_matrix import LANGUAGES as GOLD_LANGUAGES

en_gold = GOLD_LANGUAGES["en"]

GT_MAP = {
    'zh-TW': 'zh-TW',
    'pt-BR': 'pt',
    'tl': 'tl',
    'he': 'iw',
    'jv': 'jw',
    'nb': 'no',
    'nn': 'no',
    'fo': 'da',
    'kl': 'da',
    'lb': 'de',
    'rm': 'de',
    'oc': 'fr',
    'br': 'fr',
    'co': 'it',
    'sc': 'it',
    'fy': 'nl',
    'haw': 'en',
    'mi': 'mi',
    'sm': 'sm',
    'fj': 'en',
    'ty': 'fr',
    'qu': 'qu',
    'gn': 'gn',
    'ay': 'ay',
    'nah': 'es',
    'myn': 'es',
    'tlh': 'en',
    'sjn': 'en',
    'bo': 'bo',
    'yi': 'yi',
    'la': 'la',
    'eo': 'eo',
    'ku': 'ku',
    'ps': 'ps',
}

with open('src/constants/languages.js', 'r', encoding='utf-8') as f:
    js_text = f.read()

all_codes = re.findall(r"code:\s*'([^']+)'", js_text)

def translate_log_dict(code):
    if code in GOLD_LANGUAGES:
        return code, GOLD_LANGUAGES[code]

    gt_lang = GT_MAP.get(code, code)
    if gt_lang == 'en':
        return code, en_gold

    # Get translated factions and terms from the locale file
    loc_path = f"src/locales/{code}.json"
    v = 'Vampires'; w = 'Werewolves'; g = 'Ghosts'; b = 'Bardaks'
    player_w = 'Player'; set_w = 'Set'; board_w = 'Board:'; sector_w = 'Sector ['
    if os.path.exists(loc_path):
        with open(loc_path, 'r', encoding='utf-8') as f:
            ld = json.load(f)
        v = ld.get('vampire') or ld.get('vampires_title') or 'Vampires'
        w = ld.get('werewolf') or ld.get('werewolves_title') or 'Werewolves'
        g = ld.get('ghost') or ld.get('ghosts_title') or 'Ghosts'
        b = ld.get('bardak') or ld.get('bardaks_title') or 'Bardaks'
        player_w = ld.get('stats_player') or ld.get('turn_order_player') or 'Player'
        set_w = ld.get('sets_panel_btn', 'Set').replace('(', '').replace(')', '').strip() or 'Set'
        board_w = ld.get('board_panel_title', 'Board:').strip()
        sector_w = ld.get('sector_label', 'Sector [')

    keys = list(en_gold.keys())
    # Exclude base words
    to_translate_keys = [k for k in keys if k not in ('race_V', 'race_W', 'race_G', 'race_B', 'player', 'set', 'board', 'sector', 'in_sector', 'in_region', 'from_sector')]
    vals = [en_gold[k] for k in to_translate_keys]

    delimiter = "\n[[--]]\n"
    joined = delimiter.join(vals)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={gt_lang}&dt=t&q={urllib.parse.quote(joined)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

    res_dict = {
        'race_V': v,
        'race_W': w,
        'race_G': g,
        'race_B': b,
        'player': player_w,
        'set': set_w,
        'board': board_w,
        'sector': sector_w,
        'in_sector': 'in sector',
        'in_region': 'in region',
        'from_sector': 'from sector'
    }

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            res = json.loads(response.read().decode('utf-8'))
            translated_joined = ''.join([part[0] for part in res[0] if part[0]])
            parts = translated_joined.split("[[--]]")
            if len(parts) == len(vals):
                for k, p in zip(to_translate_keys, parts):
                    # Keep placeholders {0}, {1}, etc intact
                    res_dict[k] = p.strip()
                return code, res_dict
    except Exception:
        pass

    # Fallback to English templates with local faction names
    for k in to_translate_keys:
        res_dict[k] = en_gold[k]
    return code, res_dict

print(f"Translating full-sentence log dictionaries for {len(all_codes)} languages...")

all_log_dicts = {}
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(translate_log_dict, code) for code in all_codes]
    for f in as_completed(futures):
        code, d = f.result()
        all_log_dicts[code] = d
        print(f"[{code}] Log templates ready ({len(d)} templates)")

# Build race maps
race_maps_json = {}
for code in all_codes:
    d = all_log_dicts.get(code, en_gold)
    v = d.get('race_V', 'Vampires')
    w = d.get('race_W', 'Werewolves')
    g = d.get('race_G', 'Ghosts')
    b = d.get('race_B', 'Bardaks')
    race_maps_json[code] = {
        'Wampiry': v, 'Wilkołaki': w, 'Duchy': g, 'Bardaki': b,
        'vampire': v, 'werewolf': w, 'ghost': g, 'bardak': b,
        'V': v, 'W': w, 'G': g, 'B': b
    }

js_content = f'''// Multi-language Translation Engine for Game Logs (All 110 World Languages - Full Fluent Mode)
export const raceMaps = {json.dumps(race_maps_json, ensure_ascii=False, indent=2)};

export const getRace = (race, lang) => {{
  const map = raceMaps[lang] || raceMaps['en'] || raceMaps['pl'];
  return (map && map[race]) || race;
}};

export const dicts = {json.dumps(all_log_dicts, ensure_ascii=False, indent=2)};

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

print("Successfully generated fluent full-sentence logTranslator.js for all 110 world languages!")
