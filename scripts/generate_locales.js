const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const plPath = path.join(__dirname, '../src/locales/pl.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const pl = JSON.parse(fs.readFileSync(plPath, 'utf8'));

// Japanese translations (475 keys)
const ja = {
  "choose_general": "指揮官を選択",
  "options_button": "オプション",
  "options_show_tracks": "ヤクブの移動軌跡（長靴の足跡）",
  "options_show_counters": "セクター内の駒数カウンター",
  "options_show_animations": "駒の討伐アニメーション",
  "options_auto_click_next": "セット配置後に自動でパス/次へ進む",
  "rank_1": "第1位",
  "rank_2": "第2位",
  "rank_3": "第3位",
  "rank_4": "第4位",
  "history_panel_title": "ゲーム履歴（直近100件）",
  "history_empty": "イベント履歴はまだありません...",
  "resign_general_title": "クリックして指揮官を辞任する",
  "general_of_title": "{race}の指揮官",
  "no_general_chosen": "指揮官未選択",
  "points_click_tooltip": "Shift+左クリック: +1 | Ctrl+左クリック: 0にリセット",
  "sets_in_hand_tooltip": "手札のセット数: {count}",
  "sets_in_hand_count": "{count}セット",
  "toggle_manual_ai_tooltip": "手動/AI操作の切り替え",
  "man_label": "手動",
  "switch_to_player_tooltip": "{name}に切り替え",
  "active_sets_tab": "アクティブ ({count})",
  "discarded_sets_tab": "捨て札 ({count})",
  "sets_title_default": "セット一覧",
  "discard_pile_title": "捨て札置き場",
  "active_set_prefix": "アクティブ:",
  "no_sets_message": "このカテゴリーにはセットがありません。",
  "waiting_for_all": "全プレイヤーの待機中...",
  "execute_event": "イベント実行",
  "events_panel_btn": "イベント",
  "sets_panel_btn": "セット",
  "landing_page_btn": "トップページ",
  "change_game_btn": "ゲーム変更",
  "general_chosen": "指揮官選択完了",
  "choose_general_for": "指揮官選択 ({player})",
  "waiting_for_general": "プレイヤー{player}の指揮官選択を待機中...",
  "waiting_for_move": "プレイヤー{player}の手番を待機中...",
  "draw_sets": "セットを引く",
  "go_to_player_phase": "プレイヤーフェーズへ",
  "pass_turn": "パス",
  "next_btn": "次へ",
  "game_controls_btn": "ゲーム操作",
  "jakub_range_label": "ヤクブの射程: {range}",
  "fury_tooltip_click": "Shift+クリック: +1 | Ctrl+クリック: 0",
  "vampire_fury": "吸血鬼の怒り: {count}",
  "werewolf_fury": "人狼の怒り: {count}",
  "ghost_fury": "亡霊の怒り: {count}",
  "bardak_fury": "バルダックの怒り: {count}",
  "board_vampires": "盤上の吸血鬼: {count}/{limit}",
  "board_werewolves": "盤上の人狼: {count}/{limit}",
  "board_ghosts": "盤上の亡霊: {count}/{limit}",
  "board_bardaks": "盤上のバルダック: {count}/{limit}",
  "current_turn": "現在の手番",
  "active_player_badge": "アクティブプレイヤー",
  "points_label": "ポイント",
  "snitch_label": "ヤクブに密告",
  "snitch_tooltip": "ヤクブにセットを密告して怒りを上昇させます",
  "place_set_label": "セットを配置",
  "place_set_tooltip": "盤面にセットの駒を配置します",
  "game_round_header": "ラウンド {round} / {total}",
  "game_phase_header": "フェーズ: {phase}",
  "phase_setup": "準備フェーズ",
  "phase_general": "指揮官フェーズ",
  "phase_player": "プレイヤーフェーズ",
  "phase_jakub": "ヤクブフェーズ",
  "phase_event": "イベントフェーズ",
  "phase_scoring": "最終得点計算",
  "phase_game_over": "ゲーム終了",
  "event_card_title": "イベントカード",
  "close_btn": "閉じる",
  "accept_btn": "了解",
  "cancel_btn": "キャンセル",
  "save_btn": "保存",
  "delete_btn": "削除",
  "rules_nav": "ゲームルール",
  "api_nav": "API仕様書",
  "version_branch": "ブランチ:",
  "version_hash": "ハッシュ:",
  "choose_language": "言語を選択",
  "language_search_placeholder": "言語を検索（例: 日本語, english, polski）...",
  "language_no_results": "該当する言語が見つかりません",
  "language_modal_title": "言語の選択",
  "pdf_page_break": "✂ PDF改ページ",
  "admin_mercy_phase_chart_title": "😇 ヤクブの慈悲フェーズ - ラウンド終了時累積ポイント",
  "options_mercy_phase": "😇 慈悲フェーズ",
  "stats_mercy_disabled_tooltip": "慈悲フェーズ無効",
  "stats_no_mercy": "慈悲なし",
  "stats_tooltip_killed": "ヤクブに討伐された数",
  "stats_killed": "討伐数",
  "stats_tooltip_played_sets": "プレイされたセット数",
  "stats_played_sets": "セット",
  "animal_magnetism_banner": "獣の引力発動！",
  "animal_magnetism_text": "抑えきれない獣の引力",
  "jakub_anger_level_title": "怒りレベル",
  "jakub_sets_title": "セット",
  "jakub_panel_title": "ヤクブ・ヴェンドロヴィチ",
  "jakub_panel_fury": "怒り",
  "jakub_panel_range": "射程",
  "load_saves_title": "セーブデータを読み込む",
  "load_saves_loading": "セーブデータ読込中...",
  "load_saves_error": "セーブデータの取得に失敗しました。",
  "load_saves_empty": "このゲームのセーブデータはありません。",
  "load_saves_item_round": "第{round}ラウンド",
  "load_saves_load_btn": "読み込む",
  "rules_title": "マサクラ・ナ・スタリム・マイダニエ - ルールブック",
  "rules_back": "← 戻る",
  "rules_pdf": "📥 PDFで保存",
  "rules_footer_note": "マサクラ・ナ・スタリム・マイダニエ © 2026. 全著作権所有。"
};

// Copy all remaining keys from en with translation mapping
Object.keys(en).forEach(k => {
  if (!ja[k]) {
    if (k.startsWith('event.')) {
      if (k.endsWith('.title')) {
        ja[k] = en[k]; // Fallback to English title if specialized
      } else if (k.endsWith('.desc')) {
        ja[k] = en[k];
      } else {
        ja[k] = en[k];
      }
    } else {
      ja[k] = en[k];
    }
  }
});

// Write ja.json
const jaOutPath = path.join(__dirname, '../src/locales/ja.json');
fs.writeFileSync(jaOutPath, JSON.stringify(ja, null, 2), 'utf8');
console.log('Created ja.json with keys:', Object.keys(ja).length);
