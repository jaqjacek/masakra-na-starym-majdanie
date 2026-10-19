// Translation engine for game logs (pl, en, cs, uk, tlh)
import { toPiqad } from './piqad.js';
export const raceMaps = {
  "pl": {
    "Wampiry": "Wampiry",
    "Wilkołaki": "Wilkołaki",
    "Duchy": "Duchy",
    "Bardaki": "Bardaki",
    "vampire": "Wampiry",
    "werewolf": "Wilkołaki",
    "ghost": "Duchy",
    "bardak": "Bardaki",
    "V": "Wampiry",
    "W": "Wilkołaki",
    "G": "Duchy",
    "B": "Bardaki"
  },
  "en": {
    "Wampiry": "Vampires",
    "Wilkołaki": "Werewolves",
    "Duchy": "Ghosts",
    "Bardaki": "Bardaks",
    "vampire": "Vampires",
    "werewolf": "Werewolves",
    "ghost": "Ghosts",
    "bardak": "Bardaks",
    "V": "Vampires",
    "W": "Werewolves",
    "G": "Ghosts",
    "B": "Bardaks"
  },
  "cs": {
    "Wampiry": "Upíři",
    "Wilkołaki": "Vlkodlaci",
    "Duchy": "Duchové",
    "Bardaki": "Bardaci",
    "vampire": "Upíři",
    "werewolf": "Vlkodlaci",
    "ghost": "Duchové",
    "bardak": "Bardaci",
    "V": "Upíři",
    "W": "Vlkodlaci",
    "G": "Duchové",
    "B": "Bardaci"
  },
  "uk": {
    "Wampiry": "Вампіри",
    "Wilkołaki": "Вовкулаки",
    "Duchy": "Привиди",
    "Bardaki": "Бардаки",
    "vampire": "Вампіри",
    "werewolf": "Вовкулаки",
    "ghost": "Привиди",
    "bardak": "Бардаки",
    "V": "Вампіри",
    "W": "Вовкулаки",
    "G": "Привиди",
    "B": "Бардаки"
  },
  "tlh": {
    "Wampiry": "'Iw tlhutlhwI'pu'",
    "Wilkołaki": "ghom Ha'DIbaHmey",
    "Duchy": "qa'pu'",
    "Bardaki": "HIq SuvwI'pu'",
    "vampire": "'Iw tlhutlhwI'pu'",
    "werewolf": "ghom Ha'DIbaHmey",
    "ghost": "qa'pu'",
    "bardak": "HIq SuvwI'pu'",
    "V": "'Iw tlhutlhwI'pu'",
    "W": "ghom Ha'DIbaHmey",
    "G": "qa'pu'",
    "B": "HIq SuvwI'pu'"
  }
};

export const getRace = (race, lang) => {
  const map = raceMaps[lang] || raceMaps['pl'] || raceMaps['en'];
  return (map && map[race]) || race;
};

export const dicts = {
  "pl": {
    "race_V": "Wampiry",
    "race_W": "Wilkołaki",
    "race_G": "Duchy",
    "race_B": "Bardaki"
  },
  "en": {
    "race_V": "Vampires",
    "race_W": "Werewolves",
    "race_G": "Ghosts",
    "race_B": "Bardaks",
    "player": "Player",
    "set": "Set",
    "board": "Board:",
    "sector": "Sector [",
    "in_sector": "in sector",
    "in_region": "in region",
    "from_sector": "from sector",
    "phase_setup": "--- Start of SETUP ---",
    "phase_general": "--- Start of GENERALS PHASE ---",
    "phase_player": "--- Start of PLAYERS PHASE ---",
    "phase_jakub": "--- Start of JAKUB'S PHASE ---",
    "phase_event": "--- Start of EVENT PHASE ---",
    "phase_player_round": "--- Start of Player Phase (Round {0}) ---",
    "jakub_hunt_started": "--- Jakub's Hunt Started ---",
    "event_phase_started": "--- Event Phase Started ---",
    "final_scoring_phase": "--- FINAL SCORING PHASE (08:00) ---",
    "event_phase_title": "--- EVENT PHASE ---",
    "final_scoring_round": "--- FINAL SCORING (Round 12) ---",
    "round_header": "--- Round {0} / {1} ---",
    "refilled_hands": "Round {0}: Each player drew {1} new sets.",
    "reshuffle_discard": "Reshuffling discard pile back into draw pile.",
    "event_deck_exhausted": "Event deck exhausted. Reshuffled discarded events back into the deck.",
    "no_events": "No available events in the deck.",
    "event_drawn": "EVENT DRAWN: [{0}] {1}",
    "manual_event": "--- Manual Event: [{0}] {1} ---",
    "effect": "Effect: {0}",
    "activated": "Activated: {0}",
    "fury_changes": "Fury changes: {0} (Range: {1})",
    "limit_changes": "Limit changes: {0}",
    "no_fury_changes": "No fury changes.",
    "no_limit_changes": "No limit changes.",
    "support_sets": "Support: +{0} set per player (Total: {1}).",
    "support_no_sets": "Support: No sets available to distribute.",
    "great_wipe": "Great Wipe: Eliminated pawns in sectors: {0} (Total: {1}).",
    "great_wipe_none": "Great Wipe: No pawns to eliminate.",
    "moved_pawns": "Moved pawns from ({0},{1}) to ({2},{3}): {4} (Total: {5}).",
    "no_pawns_to_move": "No pawns in ({0},{1}) to move.",
    "moved_prefix": "Moved: {0}",
    "killed_prefix": "Killed: {0}",
    "penalties_prefix": "Penalties: {0}",
    "escaped_prefix": "Escaped: {0}",
    "deserted_prefix": "Deserted: {0}",
    "bardak_penalty": "Bardak General lost {0} pts",
    "witness_awarded": "Witness points awarded:",
    "mercy_phase_title": "😇 Jakub's Mercy Phase:",
    "witness_log": "🔥 Witness: {0} ({1}) gets +{2} pts for surviving near Jakub.",
    "mercy_log": "😇 Mercy: {0} ({1}) gets +{2} pts for remaining fury.",
    "mercy_rem_log": "Player {0} ({1}) gets +{2} pts from Mercy ({3} fury remaining).",
    "final_score_log": "Final Score: Player {0} (+{1} for {2});",
    "final_bonus_log": "Player {0} ({1}) gets +{2} bonus pts (End Bonus).",
    "game_over_winner": "GAME OVER! Winner: Player {0} ({1} pts).",
    "game_over_tie": "GAME OVER! TIE: {0} ({1} pts)!",
    "chose_general": "Player {0} chose General: {1}",
    "resigned_general": "Player {0} resigned from General of: {1}",
    "drew_sets": "Player {0} drew sets.",
    "placed_set_detail": "Player {0} placed Set {1} in sector [{2},{3}] [{4}] | Board: {5}",
    "placed_set_manual": "Manually: Set {0} placed in [{1},{2}] [{3}] | Board: {4}",
    "placed_set_simple": "Player {0} placed Set {1} [{2}] | Board: {3}",
    "placed_set_region": "Player {0} placed Set {1} in region [{2},{3}].",
    "given_set_manual": "Manually: Given Set {0} to Player {1}",
    "move_log": "Move: {0} from [{1},{2}] to [{3},{4}]",
    "added_log": "Added {0} in sector [{1},{2}]",
    "passed_snitched_excess": "Player {0} passed and gave {1} excess sets to Jakub (no points). Jakub's fury updated.",
    "snitched_set_range": "Player {0} snitched with set {1}. Fury updated | Range: {2}",
    "snitched_set_range_auto": "Set {0} snitched to Jakub. Fury updated | Range: {1}",
    "snitched_set_pt": "Player {0} snitched with set {1} for 1 pt.",
    "snitched_set_pt_auto": "Set {0} snitched for 1 pt.",
    "snitched_set_auto": "Set {0} snitched to Jakub.",
    "passed_empty": "Player {0} made an empty move and passed.",
    "passed_turn": "Player {0} passed turn.",
    "passed": "Player {0} passed.",
    "jakub_seized_range": "Jakub seized Set {0}. Fury/Range updated.",
    "jakub_seized": "Jakub seized Set {0}. Fury updated.",
    "jakub_seized_pool": "Jakub seized Set {0} from pool.",
    "jakub_fury_subsided": "Jakub's fury subsided. Hunt ended.",
    "jakub_ends_hunt": "Jakub ends his hunt.",
    "jakub_range_reset": "Jakub's range reset to 1.",
    "magnetism_log": "UNSTOPPABLE ANIMAL MAGNETISM! All pawns from {0} pulled to Jakub's sector [{1},{2}]!",
    "jakub_chasing": "Jakub moves to [{0},{1}] (range {2}), chasing {3} (Fury: {4} | {5} units).",
    "jakub_killed": "Jakub killed {0}x {1} in sector [{2},{3}]. Faction fury drops to {4}."
  },
  "cs": {
    "race_V": "Upíři",
    "race_W": "Vlkodlaci",
    "race_G": "Duchové",
    "race_B": "Bardaci",
    "player": "Hráč",
    "set": "Sada",
    "board": "Deska:",
    "sector": "Sektor [",
    "in_sector": "v sektoru",
    "in_region": "v oblasti",
    "from_sector": "ze sektoru",
    "phase_setup": "--- Začátek PŘÍPRAVY ---",
    "phase_general": "--- Začátek FÁZE VŮDCŮ ---",
    "phase_player": "--- Začátek FÁZE HRÁČŮ ---",
    "phase_jakub": "--- Začátek FÁZE JAKUBA ---",
    "phase_event": "--- Začátek FÁZE UDÁLOSTÍ ---",
    "phase_player_round": "--- Začátek Fáze Hráčů (Kolo {0}) ---",
    "jakub_hunt_started": "--- Lov Jakuba Zahájen ---",
    "event_phase_started": "--- Zahájení Fáze Událostí ---",
    "final_scoring_phase": "--- FÁZE ZÁVĚREČNÉHO BODOVÁNÍ (08:00) ---",
    "event_phase_title": "--- FÁZE UDÁLOSTÍ ---",
    "final_scoring_round": "--- ZÁVĚREČNÉ BODOVÁNÍ (12. Kolo) ---",
    "round_header": "--- Kolo {0} / {1} ---",
    "refilled_hands": "Kolo {0}: Každý hráč dobral {1} nových sad.",
    "reshuffle_discard": "Přemíchání odkládacího balíčku zpět do dobíracího balíčku.",
    "event_deck_exhausted": "Balíček událostí došel. Odhozené události byly zamíchány zpět do balíčku.",
    "no_events": "V balíčku nejsou žádné dostupné události.",
    "event_drawn": "VYLOSOVÁNA UDÁLOST: [{0}] {1}",
    "manual_event": "--- Manuální Událost: [{0}] {1} ---",
    "effect": "Efekt: {0}",
    "activated": "Aktivováno: {0}",
    "fury_changes": "Změny zuřivosti: {0} (Dosah: {1})",
    "limit_changes": "Změny limitů band: {0}",
    "no_fury_changes": "Žádné změny zuřivosti.",
    "no_limit_changes": "Žádné změny limitů.",
    "support_sets": "Podpora: +{0} sada pro každého hráče (Celkem: {1}).",
    "support_no_sets": "Podpora: Žádné dostupné sady k rozdání.",
    "great_wipe": "Velká Očista: Eliminovány figurky v: {0} (Celkem: {1}).",
    "great_wipe_none": "Velká Očista: Žádné figurky k eliminaci.",
    "moved_pawns": "Přesunuty figurky z ({0},{1}) do ({2},{3}): {4} (Celkem: {5}).",
    "no_pawns_to_move": "V sektoru ({0},{1}) nejsou žádné figurky k přesunu.",
    "moved_prefix": "Přesunuto: {0}",
    "killed_prefix": "Zabito: {0}",
    "penalties_prefix": "Tresty: {0}",
    "escaped_prefix": "Uprchli: {0}",
    "deserted_prefix": "Dezertovali: {0}",
    "bardak_penalty": "Vůdce Bardaků ztratil {0} bodů",
    "witness_awarded": "Body Svědka Jakuba uděleny:",
    "mercy_phase_title": "😇 Fáze Jakubova Slitování:",
    "witness_log": "🔥 Svědek: {0} ({1}) získává +{2} b. za přežití v blízkosti Jakuba.",
    "mercy_log": "😇 Slitování: {0} ({1}) získává +{2} b. za zbývající zuřivost.",
    "mercy_rem_log": "Hráč {0} ({1}) +{2} b. ze Slitování (zbývá {3} zuřivosti).",
    "final_score_log": "Závěrečné Skóre: Hráč {0} (+{1} za {2});",
    "final_bonus_log": "Hráč {0} ({1}) získává +{2} bonusových bodů (Konečný Bonus).",
    "game_over_winner": "KONEC HRY! Vítěz: Hráč {0} ({1} b.).",
    "game_over_tie": "KONEC HRY! REMÍZA: {0} ({1} b.)!",
    "chose_general": "Hráč {0} zvolil Vůdce: {1}",
    "resigned_general": "Hráč {0} se vzdal vedení bandy: {1}",
    "drew_sets": "Hráč {0} dobral sady.",
    "placed_set_detail": "Hráč {0} vyložil Sadu {1} v sektoru [{2},{3}] [{4}] | Deska: {5}",
    "placed_set_manual": "Ručně: Sada {0} vyložena v [{1},{2}] [{3}] | Deska: {4}",
    "placed_set_simple": "Hráč {0} vyložil Sadu {1} [{2}] | Deska: {3}",
    "placed_set_region": "Hráč {0} vyložil Sadu {1} v oblasti [{2},{3}].",
    "given_set_manual": "Ručně: Předána Sada {0} Hráči {1}",
    "move_log": "Pohyb: {0} z [{1},{2}] do [{3},{4}]",
    "added_log": "Přidán {0} v sektoru [{1},{2}]",
    "passed_snitched_excess": "Hráč {0} pasoval a odevzdal {1} přebytečných sad Jakubovi (bez bodů). Zuřivost aktualizována.",
    "snitched_set_range": "Hráč {0} udal Jakuba sadou {1}. Zuřivost aktualizována | Dosah: {2}",
    "snitched_set_range_auto": "Sada {0} udána Jakubovi. Zuřivost aktualizována | Dosah: {1}",
    "snitched_set_pt": "Hráč {0} udal Jakuba sadou {1} za 1 bod.",
    "snitched_set_pt_auto": "Sada {0} udána za 1 bod.",
    "snitched_set_auto": "Sada {0} udána Jakubovi.",
    "passed_empty": "Hráč {0} zahrál prázdný tah a pasoval.",
    "passed_turn": "Hráč {0} pasoval tah.",
    "passed": "Hráč {0} pasoval.",
    "jakub_seized_range": "Jakub převzal Sadu {0}. Zuřivost/Dosah okamžitě aktualizovány.",
    "jakub_seized": "Jakub převzal Sadu {0}. Zuřivost okamžitě aktualizována.",
    "jakub_seized_pool": "Jakub převzal Sadu {0} z banku.",
    "jakub_fury_subsided": "Jakubova zuřivost opadla. Lov skončil.",
    "jakub_ends_hunt": "Jakub ukončuje svůj lov.",
    "jakub_range_reset": "Jakubův dosah resetován na 1.",
    "magnetism_log": "NEZASTAVITELNÝ ZVÍŘECÍ MAGNETISMUS! Všechny bandy ze sektorů {0} byly přitaženy do Jakubova sektoru [{1},{2}]!",
    "jakub_chasing": "Jakub se přesunul na [{0},{1}] (dosah {2}), pronásleduje {3} (Zuřivost: {4} | {5} jednotek).",
    "jakub_killed": "Jakub zabil {0}x {1} v sektoru [{2},{3}]. Zuřivost klesá na {4}."
  },
  "uk": {
    "race_V": "Вампіри",
    "race_W": "Вовкулаки",
    "race_G": "Привиди",
    "race_B": "Бардаки",
    "player": "Гравець",
    "set": "Сет",
    "board": "Дошка:",
    "sector": "Сектор [",
    "in_sector": "у секторі",
    "in_region": "у регіоні",
    "from_sector": "з сектора",
    "phase_setup": "--- Початок ПІДГОТОВКИ ---",
    "phase_general": "--- Початок ФАЗИ ВАТАЖКІВ ---",
    "phase_player": "--- Початок ФАЗИ ГРАВЦІВ ---",
    "phase_jakub": "--- Початок ФАЗИ ЯКУБА ---",
    "phase_event": "--- Початок ФАЗИ ПОДІЙ ---",
    "phase_player_round": "--- Початок Фази Гравців (Раунд {0}) ---",
    "jakub_hunt_started": "--- Полювання Якуба Розпочато ---",
    "event_phase_started": "--- Початок Фази Подій ---",
    "final_scoring_phase": "--- ФАЗА ФІНАЛЬНОГО ПІДРАХУНКУ (08:00) ---",
    "event_phase_title": "--- ФАЗА ПОДІЙ ---",
    "final_scoring_round": "--- ФІНАЛЬНИЙ ПІДРАХУНОК (Раунд 12) ---",
    "round_header": "--- Раунд {0} / {1} ---",
    "refilled_hands": "Раунд {0}: Кожен гравець добрав {1} нових сетів.",
    "reshuffle_discard": "Скидання перемішано назад у колоду.",
    "event_deck_exhausted": "Колода подій вичерпана. Скинуті події перемішані назад.",
    "no_events": "У колоді немає доступних подій.",
    "event_drawn": "ВИТЯГНУТА ПОДІЯ: [{0}] {1}",
    "manual_event": "--- Ручна Подія: [{0}] {1} ---",
    "effect": "Ефект: {0}",
    "activated": "Активовано: {0}",
    "fury_changes": "Зміни люті: {0} (Радіус: {1})",
    "limit_changes": "Зміни лімітів банд: {0}",
    "no_fury_changes": "Немає змін люті.",
    "no_limit_changes": "Немає змін лімітів.",
    "support_sets": "Підтримка: Роздано по {0} дод. сету кожному гравцю (Разом: {1}).",
    "support_no_sets": "Підтримка: Немає доступних сетів для роздачі.",
    "great_wipe": "Велике Очищення: Знищено фішки у секторах: {0} (Разом: {1}).",
    "great_wipe_none": "Велике Очищення: Немає фішок для знищення.",
    "moved_pawns": "Переміщено фішки з ({0},{1}) до ({2},{3}): {4} (Разом: {5}).",
    "no_pawns_to_move": "У секторі ({0},{1}) немає фішок для переміщення.",
    "moved_prefix": "Переміщено: {0}",
    "killed_prefix": "Вбито: {0}",
    "penalties_prefix": "Штрафи: {0}",
    "escaped_prefix": "Втекли: {0}",
    "deserted_prefix": "Дезертирували: {0}",
    "bardak_penalty": "Ватажок Бардаків втратив {0} очок",
    "witness_awarded": "Очки Свідка Якуба нараховано:",
    "mercy_phase_title": "😇 Фаза Милосердя Якуба:",
    "witness_log": "🔥 Свідок Якуба: {0} ({1}) отримує +{2} бонусних очок за виживання поруч з Якубом.",
    "mercy_log": "😇 Милосердя: {0} ({1}) отримує +{2} очок за залишок люті.",
    "mercy_rem_log": "Гравець {0} ({1}) отримує +{2} очок з Фази Милосердя (залишилось {3} люті).",
    "final_score_log": "Фінальний Підрахунок: Гравець {0} (+{1} за банду {2});",
    "final_bonus_log": "Гравець {0} ({1}) отримує +{2} бонусних очок (Фінальний Бонус).",
    "game_over_winner": "КІНЕЦЬ ГРИ! Переможець: Гравець {0} ({1} очок).",
    "game_over_tie": "КІНЕЦЬ ГРИ! НІЧИЯ: {0} ({1} очок)!",
    "chose_general": "Гравець {0} обрав Ватажка: {1}",
    "resigned_general": "Гравець {0} відмовився від звання Ватажка: {1}",
    "drew_sets": "Гравець {0} взяв сети.",
    "placed_set_detail": "Гравець {0} виставив Сет {1} у секторі [{2},{3}] [{4}] | Дошка: {5}",
    "placed_set_manual": "Вручну: Сет {0} виставлено у [{1},{2}] [{3}] | Дошка: {4}",
    "placed_set_simple": "Гравець {0} виставив Сет {1} [{2}] | Дошка: {3}",
    "placed_set_region": "Гравець {0} виставив Сет {1} у регіоні [{2},{3}].",
    "given_set_manual": "Вручну: Видано Сет {0} Гравцю {1}",
    "move_log": "Переміщення: {0} з [{1},{2}] до [{3},{4}]",
    "added_log": "Додано {0} у секторі [{1},{2}]",
    "passed_snitched_excess": "Гравець {0} спасував і віддав {1} зайвих сетів Якубу (без очок). Лють Якуба оновлена.",
    "snitched_set_range": "Гравець {0} здав сет {1} Якубу. Лють оновлена | Радіус: {2}",
    "snitched_set_range_auto": "Сет {0} здано Якубу. Лють оновлена | Радіус: {1}",
    "snitched_set_pt": "Гравець {0} здав сет {1} Якубу за 1 очко.",
    "snitched_set_pt_auto": "Сет {0} здано Якубу за 1 очко.",
    "snitched_set_auto": "Сет {0} здано Якубу.",
    "passed_empty": "Гравець {0} спасував хід.",
    "passed_turn": "Гравець {0} спасував хід.",
    "passed": "Гравець {0} спасував.",
    "jakub_seized_range": "Якуб захопив Сет {0}. Лють/Радіус оновлено негайно.",
    "jakub_seized": "Якуб захопив Сет {0}. Лють оновлено негайно.",
    "jakub_seized_pool": "Якуб захопив Сет {0} з пулу.",
    "jakub_fury_subsided": "Лють Якуба вщухла. Полювання завершено.",
    "jakub_ends_hunt": "Якуб завершує полювання.",
    "jakub_range_reset": "Радіус Якуба скинуто до 1.",
    "magnetism_log": "НЕСТРИМНИЙ ТВАРИННИЙ МАГНЕТИЗМ! Всі банди із секторів {0} притягнуто до сектора Якуба [{1},{2}]!",
    "jakub_chasing": "Якуб переміщується на [{0},{1}] (радіус {2}), переслідуючи {3} (Лють: {4} | {5} одиниць).",
    "jakub_killed": "Якуб вбив {0}x {1} у секторі [{2},{3}]. Лють падає до {4}."
  },
  "tlh": {
    "race_V": "'Iw tlhutlhwI'pu'",
    "race_W": "ghom Ha'DIbaHmey",
    "race_G": "qa'pu'",
    "race_B": "HIq SuvwI'pu'",
    "player": "QujwI'",
    "set": "ghom",
    "board": "yotlh:",
    "sector": "yoS [",
    "in_sector": "yoSDaq",
    "in_region": "yoSDaq",
    "from_sector": "yoSvo'",
    "phase_setup": "--- ghuH mIw ---",
    "phase_general": "--- la' mIw ---",
    "phase_player": "--- QujwI' mIw ---",
    "phase_jakub": "--- jaqub mIw ---",
    "phase_event": "--- wanI' mIw ---",
    "phase_player_round": "--- QujwI' mIw ({0}) ---",
    "jakub_hunt_started": "--- jaqub wam ---",
    "event_phase_started": "--- wanI' mIw ---",
    "final_scoring_phase": "--- yay Qav (08:00) ---",
    "event_phase_title": "--- wanI' mIw ---",
    "final_scoring_round": "--- yay Qav ({0}) ---",
    "round_header": "--- {0} / {1} ---",
    "refilled_hands": "{0}: +{1} ghommey",
    "reshuffle_discard": "woDlu'bogh tetlh tlhapqa'lu'.",
    "event_deck_exhausted": "wanI' tetlh chIm. woDlu'bogh tlhapqa'lu'.",
    "no_events": "wanI' pagh tu'lu'.",
    "event_drawn": "wanI': [{0}] {1}",
    "manual_event": "--- wanI': [{0}] {1} ---",
    "effect": "qaS: {0}",
    "activated": "lI': {0}",
    "fury_changes": "QeH: {0} (chuq: {1})",
    "limit_changes": "pe'meH: {0}",
    "no_fury_changes": "QeH pImbe'.",
    "no_limit_changes": "pe'meH pImbe'.",
    "support_sets": "+{0} ghommey ({1})",
    "support_no_sets": "ghommey tu'lu'be'.",
    "great_wipe": "HoH: {0} ({1})",
    "great_wipe_none": "HoHmeH SuvwI' pagh.",
    "moved_pawns": "{4} ({0},{1}) -> ({2},{3}) [{5}]",
    "no_pawns_to_move": "({0},{1}) -",
    "moved_prefix": "vIH: {0}",
    "killed_prefix": "HoH: {0}",
    "penalties_prefix": "chIl: {0}",
    "escaped_prefix": "nargh: {0}",
    "deserted_prefix": "tlheD: {0}",
    "bardak_penalty": "HIq SuvwI'pu' -{0} yay",
    "witness_awarded": "leghwI' yay noblu':",
    "mercy_phase_title": "jaqub HoHQo':",
    "witness_log": "leghwI': {0} ({1}) +{2} yay.",
    "mercy_log": "HoHQo': {0} ({1}) +{2} yay.",
    "mercy_rem_log": "{0} ({1}) +{2} yay ({3}).",
    "final_score_log": "yay Qav: {0} (+{1} {2});",
    "final_bonus_log": "{0} ({1}) +{2} yay.",
    "game_over_winner": "Quj rIn! QapwI': {0} ({1} yay).",
    "game_over_tie": "Quj rIn! rap: {0} ({1} yay)!",
    "chose_general": "{0} la' {1}",
    "resigned_general": "{0} la' lIw {1}",
    "drew_sets": "{0} ghommey tlhap.",
    "placed_set_detail": "{0} ghom {1} yoS [{2},{3}] [{4}] | {5}",
    "placed_set_manual": "ghom {0} [{1},{2}] [{3}] | {4}",
    "placed_set_simple": "{0} ghom {1} [{2}] | {3}",
    "placed_set_region": "{0} ghom {1} yoS [{2},{3}].",
    "given_set_manual": "ghom {0} QujwI' {1}",
    "move_log": "{0} [{1},{2}] -> [{3},{4}]",
    "added_log": "+ {0} yoS [{1},{2}]",
    "passed_snitched_excess": "{0} juS ({1} ghommey)",
    "snitched_set_range": "{0} jaqubvaD {1} | chuq: {2}",
    "snitched_set_range_auto": "ghom {0} jaqubvaD | chuq: {1}",
    "snitched_set_pt": "{0} jaqubvaD {1} +1 yay",
    "snitched_set_pt_auto": "ghom {0} jaqubvaD +1 yay",
    "snitched_set_auto": "ghom {0} jaqubvaD",
    "passed_empty": "{0} juS",
    "passed_turn": "{0} juS",
    "passed": "{0} juS",
    "jakub_seized_range": "jaqub + {0} | chuq",
    "jakub_seized": "jaqub + {0}",
    "jakub_seized_pool": "jaqub + {0}",
    "jakub_fury_subsided": "jaqub QeH bIrchoH.",
    "jakub_ends_hunt": "jaqub wam rIn.",
    "jakub_range_reset": "jaqub chuq = 1.",
    "magnetism_log": "Ha'DIbaH HoS! {0} -> jaqub [{1},{2}]!",
    "jakub_chasing": "jaqub [{0},{1}] ({2}) -> {3} (QeH: {4} | {5})",
    "jakub_killed": "jaqub {0}x {1} HoH [{2},{3}]. {4}"
  }
};

function fmt(template, ...args) {
  if (!template) return '';
  return template.replace(/\{(\d+)\}/g, (_, i) => args[i] !== undefined ? args[i] : '');
}

const localizeInnerString = (str, lang, d, getR) => {
  if (!str) return '';
  let res = str;
  if (d.board) res = res.replace(/Plansza:/g, d.board);
  if (d.sector) res = res.replace(/Sektor \[/g, d.sector);
  if (d.in_sector) res = res.replace(/w sektorze/g, d.in_sector);
  if (d.in_region) res = res.replace(/w regionie/g, d.in_region);
  if (d.from_sector) res = res.replace(/z sektora/g, d.from_sector);
  if (d.set) res = res.replace(/Zestaw ([A-Za-z0-9_-]+)/g, `${d.set} $1`);
  if (d.player) res = res.replace(/Gracz (\d+)/g, `${d.player} $1`);

  ['Wampiry', 'Wilkołaki', 'Duchy', 'Bardaki'].forEach(race => {
    res = res.replace(new RegExp(race, 'g'), getR(race));
  });
  return res;
};

export const translateLog = (text, lang, tFunc) => {
  if (!text) return '';
  if (lang === 'pl') return text;
  const finish = (value) => (lang === 'tlh' ? toPiqad(value) : value);

  const d = dicts[lang] || dicts['pl'] || dicts['en'];
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

  if ((m = t.match(/^--- Start Fazy Graczy \(Runda (\d+)\) ---$/))) return finish(fmt(d.phase_player_round, m[1]));
  if ((m = t.match(/^--- Runda (\d+) \/ (\d+) ---$/))) return finish(fmt(d.round_header, m[1], m[2]));
  if ((m = t.match(/^Runda (\d+): Uzupełniono ręce graczy do (\d+) zestawów\.$/))) return finish(fmt(d.refilled_hands, m[1], m[2]));
  if ((m = t.match(/^Runda (\d+): Każdy gracz dobrał (\d+) nowych zestawów\.$/))) return finish(fmt(d.refilled_hands, m[1], m[2]));

  // Events
  if ((m = t.match(/^WYLOSOWANO WYDARZENIE: \[([^\]]+)\] (.*)$/))) {
    const title = tFunc ? tFunc(`event.${m[1]}.title`, { defaultValue: m[2] }) : m[2];
    return finish(fmt(d.event_drawn, m[1], title));
  }
  if ((m = t.match(/^--- Ręczne Wydarzenie: \[([^\]]+)\] (.*) ---$/))) {
    const title = tFunc ? tFunc(`event.${m[1]}.title`, { defaultValue: m[2] }) : m[2];
    return finish(fmt(d.manual_event, m[1], title));
  }
  if ((m = t.match(/^Efekt: (.*)$/))) return finish(fmt(d.effect, loc(m[1])));
  if ((m = t.match(/^Aktywowano wydarzenie: (.*)$/))) return finish(fmt(d.activated, loc(m[1])));
  if ((m = t.match(/^Zmiany furii: (.*?) \(Zasięg zaktualizowany do (\d+)\)$/))) return finish(fmt(d.fury_changes, loc(m[1]), m[2]));
  if ((m = t.match(/^Zmiany limitów band: (.*)$/))) return finish(fmt(d.limit_changes, loc(m[1])));
  if ((m = t.match(/^Wsparcie: Rozdano po (\d+) dodatkowym zestawie każdemu graczowi \(Suma: (\d+)\)\.$/))) return finish(fmt(d.support_sets, m[1], m[2]));
  if ((m = t.match(/^Wielkie Czyszczenie: Wyeliminowano pionki na sektorach: (.*?) \(Suma: (\d+)\)\.$/))) return finish(fmt(d.great_wipe, loc(m[1]), m[2]));
  if ((m = t.match(/^Przeniesiono pionki z \((\d+),(\d+)\) do \((\d+),(\d+)\): (.*?) \(Suma: (\d+)\)\.$/))) return finish(fmt(d.moved_pawns, m[1], m[2], m[3], m[4], loc(m[5]), m[6]));
  if ((m = t.match(/^Brak pionków w sektorze \((\d+),(\d+)\) do przeniesienia\.$/))) return finish(fmt(d.no_pawns_to_move, m[1], m[2]));
  if ((m = t.match(/^Kary: Generał Bardaków stracił (\d+) pkt$/))) return finish(fmt(d.bardak_penalty, m[1]));
  if ((m = t.match(/^Przeniesiono: (.*)$/))) return finish(fmt(d.moved_prefix, loc(m[1])));
  if ((m = t.match(/^Zabito: (.*)$/))) return finish(fmt(d.killed_prefix, loc(m[1])));
  if ((m = t.match(/^Kary: (.*)$/))) return finish(fmt(d.penalties_prefix, loc(m[1])));
  if ((m = t.match(/^Uciekli: (.*)$/))) return finish(fmt(d.escaped_prefix, loc(m[1])));
  if ((m = t.match(/^Zdezerterowali: (.*)$/))) return finish(fmt(d.deserted_prefix, loc(m[1])));

  // Witness & Mercy & End
  if ((m = t.match(/^🔥 Świadek Jakuba: (.*?) \((.*?)\) zdobywa (\d+) bonusowych punktów za przeżycie w pobliżu Jakuba\.$/))) {
    return finish(fmt(d.witness_log, loc(m[1]), getR(m[2]), m[3]));
  }
  if ((m = t.match(/^😇 Miłosierdzie Jakuba: (.*?) \((.*?)\) otrzymuje \+(\d+) pkt za pozostałą furię\.$/))) {
    return finish(fmt(d.mercy_log, loc(m[1]), getR(m[2]), m[3]));
  }
  if ((m = t.match(/^Gracz (\d+) \((.*?)\) otrzymuje (\d+) pkt\. z Fazy Miłosierdzia \(pozostało (\d+) furii u Jakuba\)\.$/))) {
    return finish(fmt(d.mercy_rem_log, m[1], getR(m[2]), m[3], m[4]));
  }
  if ((m = t.match(/^Punktacja Końcowa: Gracz (\d+) \(\+(\d+) za bandę (.*?)\);$/))) {
    return finish(fmt(d.final_score_log, m[1], m[2], getR(m[3])));
  }
  if ((m = t.match(/^Gracz (\d+) \((.*?)\) zdobywa (\d+) punktów bonusowych \(Bonus Końcowy\)\.$/))) {
    return finish(fmt(d.final_bonus_log, m[1], getR(m[2]), m[3]));
  }
  if ((m = t.match(/^KONIEC GRY! Zwycięzca: Gracz (\d+) z liczbą punktów: (\d+)\.$/))) {
    return finish(fmt(d.game_over_winner, m[1], m[2]));
  }
  if ((m = t.match(/^KONIEC GRY! REMIS pomiędzy graczami: (.*?) z liczbą punktów: (\d+)!$/))) {
    return finish(fmt(d.game_over_tie, loc(m[1]), m[2]));
  }

  // Generals
  if ((m = t.match(/^Gracz (\d+) wybrał Generała(?: bandy)?: (.*)$/))) {
    return finish(fmt(d.chose_general, m[1], getR(m[2])));
  }
  if ((m = t.match(/^Gracz (\d+) zrezygnował z bycia Generałem bandy: (.*)$/))) {
    return finish(fmt(d.resigned_general, m[1], getR(m[2])));
  }

  // Placements & Moves
  if ((m = t.match(/^Gracz (\d+) dobrał zestawy\.$/))) return finish(fmt(d.drew_sets, m[1]));
  if ((m = t.match(/^Gracz (\d+) wystawił Zestaw (.*?) w sektorze \[([^\]]+),([^\]]+)\] \[(.*?)\] \| Plansza: (.*)$/))) {
    return finish(fmt(d.placed_set_detail, m[1], m[2], m[3], m[4], loc(m[5]), loc(m[6])));
  }
  if ((m = t.match(/^Ręcznie: Zestaw (.*?) wystawiony w sektorze \[([^\]]+),([^\]]+)\] \[(.*?)\] \| Plansza: (.*)$/))) {
    return finish(fmt(d.placed_set_manual, m[1], m[2], m[3], loc(m[4]), loc(m[5])));
  }
  if ((m = t.match(/^Gracz (\d+) wystawił Zestaw (.*?) \[(.*?)\] \| Plansza: (.*)$/))) {
    return finish(fmt(d.placed_set_simple, m[1], m[2], loc(m[3]), loc(m[4])));
  }
  if ((m = t.match(/^Gracz (\d+) wystawił Zestaw (.*?) w regionie \[([^\]]+),([^\]]+)\]\.$/))) {
    return finish(fmt(d.placed_set_region, m[1], m[2], m[3], m[4]));
  }
  if ((m = t.match(/^Ręcznie: Rozdano Zestaw (.*?) Graczowi (\d+)$/))) {
    return finish(fmt(d.given_set_manual, m[1], m[2]));
  }
  if ((m = t.match(/^Ruch: (.*?) przeniesiony z \[([^\]]+),([^\]]+)\] do \[([^\]]+),([^\]]+)\]$/))) {
    return finish(fmt(d.move_log, getR(m[1]), m[2], m[3], m[4], m[5]));
  }
  if ((m = t.match(/^Dodano (.*?) w sektorze \[([^\]]+),([^\]]+)\]$/))) {
    return finish(fmt(d.added_log, getR(m[1]), m[2], m[3]));
  }

  // Snitching & Passing
  if ((m = t.match(/^Gracz (\d+) spasował i podkablował (\d+) nadmiarowych zestawów\. Furia Jakuba zaktualizowana\.$/))) {
    return finish(fmt(d.passed_snitched_excess, m[1], m[2]));
  }
  if ((m = t.match(/^Gracz (\d+) spasował i oddał (\d+) nadmiarowych zestawów Jakubowi \(bez punktów\)\. Furia Jakuba zaktualizowana\.$/))) {
    return finish(fmt(d.passed_snitched_excess, m[1], m[2]));
  }
  if ((m = t.match(/^Gracz (\d+) podkablował Jakubowi zestawem (.*?)\. Furia zaktualizowana \| Range: (\d+)$/))) {
    return finish(fmt(d.snitched_set_range, m[1], m[2], m[3]));
  }
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi\. Furia zaktualizowana \| Range: (\d+)$/))) {
    return finish(fmt(d.snitched_set_range_auto, m[1], m[2]));
  }
  if ((m = t.match(/^Gracz (\d+) podkablował Jakubowi zestawem (.*?) za 1 pkt\.$/))) {
    return finish(fmt(d.snitched_set_pt, m[1], m[2]));
  }
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi za 1 pkt\.$/))) {
    return finish(fmt(d.snitched_set_pt_auto, m[1]));
  }
  if ((m = t.match(/^Zestaw (.*?) został podkablowany Jakubowi\.$/))) {
    return finish(fmt(d.snitched_set_auto, m[1]));
  }
  if ((m = t.match(/^Gracz (\d+) złożył pusty ruch i spasował\.$/))) return finish(fmt(d.passed_empty, m[1]));
  if ((m = t.match(/^Gracz (\d+) spasował turę\.$/))) return finish(fmt(d.passed_turn, m[1]));
  if ((m = t.match(/^Gracz (\d+) spasował\.$/))) return finish(fmt(d.passed, m[1]));

  // Jakub hunt
  if ((m = t.match(/^Jakub przejął Zestaw (.*?)\. Furia\/Zasięg zaktualizowane natychmiast\.$/))) return finish(fmt(d.jakub_seized_range, m[1]));
  if ((m = t.match(/^Jakub przejął Zestaw (.*?)\. Furia zaktualizowana natychmiast\.$/))) return finish(fmt(d.jakub_seized, m[1]));
  if ((m = t.match(/^Jakub przejął Zestaw (.*?) z puli\.$/))) return finish(fmt(d.jakub_seized_pool, m[1]));
  if ((m = t.match(/^NIEPOCHAMOWANY ZWIERZĘCY MAGNETYZM! \(Tego nie pochamujesz\) Wszystkie bandy z sektorów (.*?) zostały przyciągnięte do sektora Jakuba \[([^\]]+),([^\]]+)\]!$/))) {
    return finish(fmt(d.magnetism_log, loc(m[1]), m[2], m[3]));
  }
  if ((m = t.match(/^Jakub przemieszcza się na \[([^\]]+),([^\]]+)\] w zasięgu (\d+), ścigając (.*?) \(Furia: (\d+) \| Region zawiera (\d+) jednostek\)\.$/))) {
    return finish(fmt(d.jakub_chasing, m[1], m[2], m[3], getR(m[4]), m[5], m[6]));
  }
  if ((m = t.match(/^Jakub zabił (\d+)x (.*?) w sektorze \[([^\]]+),([^\]]+)\]\. Furia rasy spada do (\d+)\.$/))) {
    return finish(fmt(d.jakub_killed, m[1], getR(m[2]), m[3], m[4], m[5]));
  }

  // Global words replacement fallback
  return finish(loc(t));
};
