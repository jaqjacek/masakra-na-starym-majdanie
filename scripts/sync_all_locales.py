import json

faq_q5_translations = {
    "cs": "TL;DR - Stručně v bodech?",
    "de": "TL;DR - Kurz zusammengefasst?",
    "es": "¿TL;DR - Resumen rápido?",
    "fi": "TL;DR - Lyhyesti pähkinänkuoressa?",
    "fr": "TL;DR - En résumé rapide ?",
    "it": "TL;DR - In breve?",
    "sv": "TL;DR - Kort sammanfattning?",
    "ja": "要約 (TL;DR) は？",
    "ko": "요약 (TL;DR) 은 무엇인가요?",
    "ru": "Кратко (TL;DR)?",
    "uk": "Коротко (TL;DR)?",
    "pt": "TL;DR - Resumo rápido?",
    "zh": "太长不看 (TL;DR)？"
}

locales = ['cs', 'de', 'es', 'fi', 'fr', 'it', 'ja', 'ko', 'pt', 'ru', 'sv', 'uk', 'zh', 'en']

with open('src/locales/pl.json', 'r', encoding='utf-8') as f:
    pl = json.load(f)

for loc in locales:
    filepath = f'src/locales/{loc}.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'rules_faq_q5' not in data:
        data['rules_faq_q5'] = faq_q5_translations.get(loc, "TL;DR?")

    # Also make sure all base keys in pl are present
    for k, v in pl.items():
        if k not in data:
            data[k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Synchronized all locales with 100% key parity!")
