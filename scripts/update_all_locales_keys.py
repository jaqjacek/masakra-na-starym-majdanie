import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE_DIR, 'src', 'locales')

locale_files = [f for f in os.listdir(LOCALES_DIR) if f.endswith('.json')]

keys_per_lang = {
  'en': {
    "phase_setup": "Setup Phase",
    "phase_general_phase": "Generals Phase",
    "phase_player_phase": "Players Phase",
    "phase_jakub_phase": "Jakub's Phase",
    "phase_event_phase": "Event Phase",
    "phase_final_scoring": "Final Scoring",
    "phase_End Game": "Game Over",
    "pause_jakub_btn": "PAUSE J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSE FULL",
    "full_auto_btn": "FULL AUTO"
  },
  'pl': {
    "phase_setup": "Faza Przygotowania",
    "phase_general_phase": "Faza Hersztów",
    "phase_player_phase": "Faza Graczy",
    "phase_jakub_phase": "Faza Jakuba",
    "phase_event_phase": "Faza Wydarzeń",
    "phase_final_scoring": "Punktacja Końcowa",
    "phase_End Game": "Koniec Gry",
    "pause_jakub_btn": "PAUZA J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUZA FULL",
    "full_auto_btn": "FULL AUTO"
  },
  'cs': {
    "phase_setup": "Fáze Přípravy",
    "phase_general_phase": "Fáze Vůdců",
    "phase_player_phase": "Fáze Hráčů",
    "phase_jakub_phase": "Fáze Jakuba",
    "phase_event_phase": "Fáze Událostí",
    "phase_final_scoring": "Závěrečné Bodování",
    "phase_End Game": "Konec Hry",
    "pause_jakub_btn": "PAUZA J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUZA FULL",
    "full_auto_btn": "FULL AUTO"
  },
  'de': {
    "phase_setup": "Vorbereitungsphase",
    "phase_general_phase": "Anführerphase",
    "phase_player_phase": "Spielerphase",
    "phase_jakub_phase": "Jakub-Phase",
    "phase_event_phase": "Ereignisphase",
    "phase_final_scoring": "Schlusswertung",
    "phase_End Game": "Spielende",
    "pause_jakub_btn": "PAUSE J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSE VOLL",
    "full_auto_btn": "VOLLAUTO"
  },
  'es': {
    "phase_setup": "Fase de Preparación",
    "phase_general_phase": "Fase de Líderes",
    "phase_player_phase": "Fase de Jugadores",
    "phase_jakub_phase": "Fase de Jakub",
    "phase_event_phase": "Fase de Eventos",
    "phase_final_scoring": "Puntuación Final",
    "phase_End Game": "Fin de Juego",
    "pause_jakub_btn": "PAUSA J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSA TOTAL",
    "full_auto_btn": "AUTO TOTAL"
  },
  'it': {
    "phase_setup": "Fase Preparazione",
    "phase_general_phase": "Fase Leader",
    "phase_player_phase": "Fase Giocatori",
    "phase_jakub_phase": "Fase di Jakub",
    "phase_event_phase": "Fase Eventi",
    "phase_final_scoring": "Punteggio Finale",
    "phase_End Game": "Fine Gioco",
    "pause_jakub_btn": "PAUSA J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSA FULL",
    "full_auto_btn": "FULL AUTO"
  },
  'fr': {
    "phase_setup": "Phase de Préparation",
    "phase_general_phase": "Phase des Chefs",
    "phase_player_phase": "Phase des Joueurs",
    "phase_jakub_phase": "Phase de Jakub",
    "phase_event_phase": "Phase d'Événements",
    "phase_final_scoring": "Décompte Final",
    "phase_End Game": "Fin de Partie",
    "pause_jakub_btn": "PAUSE J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSE TOTALE",
    "full_auto_btn": "AUTO TOTAL"
  },
  'fi': {
    "phase_setup": "Valmisteluvaihe",
    "phase_general_phase": "Johtajavaihe",
    "phase_player_phase": "Pelaajavaihe",
    "phase_jakub_phase": "Jakub-vaihe",
    "phase_event_phase": "Tapahtumavaihe",
    "phase_final_scoring": "Loppupisteytys",
    "phase_End Game": "Peli Päättynyt",
    "pause_jakub_btn": "TAUKO J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "TAUKO FULL",
    "full_auto_btn": "TÄYSIN AUTO"
  },
  'sv': {
    "phase_setup": "Förberedelsefas",
    "phase_general_phase": "Ledarfas",
    "phase_player_phase": "Spelarfas",
    "phase_jakub_phase": "Jakub-fas",
    "phase_event_phase": "Händelsefas",
    "phase_final_scoring": "Sluträkning",
    "phase_End Game": "Spelet Slut",
    "pause_jakub_btn": "PAUS J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUS FULL",
    "full_auto_btn": "HELAUTO"
  },
  'ja': {
    "phase_setup": "準備フェーズ",
    "phase_general_phase": "指揮官フェーズ",
    "phase_player_phase": "プレイヤーフェーズ",
    "phase_jakub_phase": "ヤクブフェーズ",
    "phase_event_phase": "イベントフェーズ",
    "phase_final_scoring": "最終得点計算",
    "phase_End Game": "ゲーム終了",
    "pause_jakub_btn": "一時停止 J",
    "jakub_auto_btn": "ヤクブ自動",
    "pause_full_btn": "一時停止 全自動",
    "full_auto_btn": "全自動"
  },
  'uk': {
    "phase_setup": "Фаза Підготовки",
    "phase_general_phase": "Фаза Ватажків",
    "phase_player_phase": "Фаза Гравців",
    "phase_jakub_phase": "Фаза Якуба",
    "phase_event_phase": "Фаза Подій",
    "phase_final_scoring": "Фінальний Підрахунок",
    "phase_End Game": "Кінець Гри",
    "pause_jakub_btn": "ПАУЗА Я",
    "jakub_auto_btn": "ЯКУБ АВТО",
    "pause_full_btn": "ПАУЗА FULL",
    "full_auto_btn": "ПОВНИЙ АВТО"
  },
  'zh': {
    "phase_setup": "准备阶段",
    "phase_general_phase": "头领阶段",
    "phase_player_phase": "玩家阶段",
    "phase_jakub_phase": "雅库布阶段",
    "phase_event_phase": "事件阶段",
    "phase_final_scoring": "终局计分",
    "phase_End Game": "游戏结束",
    "pause_jakub_btn": "暂停 雅库布",
    "jakub_auto_btn": "雅库布自动",
    "pause_full_btn": "暂停 全自动",
    "full_auto_btn": "全自动"
  },
  'ru': {
    "phase_setup": "Фаза Подготовки",
    "phase_general_phase": "Фаза Главарей",
    "phase_player_phase": "Фаза Игроков",
    "phase_jakub_phase": "Фаза Якуба",
    "phase_event_phase": "Фаза Событий",
    "phase_final_scoring": "Финальный Подсчёт",
    "phase_End Game": "Конец Игры",
    "pause_jakub_btn": "ПАУЗА Я",
    "jakub_auto_btn": "ЯКУБ АВТО",
    "pause_full_btn": "ПАУЗА FULL",
    "full_auto_btn": "ПОЛНЫЙ АВТО"
  },
  'pt': {
    "phase_setup": "Fase de Preparação",
    "phase_general_phase": "Fase de Líderes",
    "phase_player_phase": "Fase dos Jogadores",
    "phase_jakub_phase": "Fase de Jakub",
    "phase_event_phase": "Fase de Eventos",
    "phase_final_scoring": "Pontuação Final",
    "phase_End Game": "Fim de Jogo",
    "pause_jakub_btn": "PAUSA J",
    "jakub_auto_btn": "JAKUB AUTO",
    "pause_full_btn": "PAUSA FULL",
    "full_auto_btn": "FULL AUTO"
  },
  'ko': {
    "phase_setup": "준비 단계",
    "phase_general_phase": "우두머리 단계",
    "phase_player_phase": "플레이어 단계",
    "phase_jakub_phase": "야쿠프 단계",
    "phase_event_phase": "이벤트 단계",
    "phase_final_scoring": "최종 점수 계산",
    "phase_End Game": "게임 종료",
    "pause_jakub_btn": "일시정지 J",
    "jakub_auto_btn": "야쿠프 자동",
    "pause_full_btn": "일시정지 전체",
    "full_auto_btn": "전체 자동"
  }
}

for filename in locale_files:
    code = filename.replace('.json', '')
    filepath = os.path.join(LOCALES_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_keys = keys_per_lang.get(code, keys_per_lang['en'])
    for k, v in new_keys.items():
        data[k] = v
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filename} -> total keys: {len(data)}")

print("All locale files updated.")
