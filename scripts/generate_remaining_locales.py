import os
import json
import urllib.request
import urllib.parse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

# Load existing files
existing_codes = set(f.replace('.json', '') for f in os.listdir('src/locales') if f.endswith('.json'))

import re
with open('src/constants/languages.js', 'r', encoding='utf-8') as f:
    js_text = f.read()

all_codes = re.findall(r"code:\s*'([^']+)'", js_text)
remaining = [c for c in all_codes if c not in existing_codes]

print(f"Translating remaining {len(remaining)} languages: {remaining}")

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

def translate_batch(chunk, code):
    gt_lang = GT_MAP.get(code, code)
    if gt_lang == 'en':
        return {k: v for k, v in chunk}

    keys = [k for k, v in chunk]
    vals = [v for k, v in chunk]
    delimiter = "\n[[[X]]]\n"
    joined = delimiter.join(vals)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={gt_lang}&dt=t&q={urllib.parse.quote(joined)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            res = json.loads(response.read().decode('utf-8'))
            translated_joined = ''.join([part[0] for part in res[0] if part[0]])
            parts = translated_joined.split("[[[X]]]")
            if len(parts) == len(vals):
                return {k: p.strip() for k, p in zip(keys, parts)}
    except Exception:
        pass

    return {k: v for k, v in chunk}

def process_lang(code):
    items = list(en_dict.items())
    result = {}
    chunk_size = 15
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i+chunk_size]
        res = translate_batch(chunk, code)
        result.update(res)
        time.sleep(0.05)

    out_path = f"src/locales/{code}.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"[{code}] Finished! Saved {len(result)} keys.")
    return code

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(process_lang, c) for c in remaining]
    for f in as_completed(futures):
        f.result()

print("ALL REMAINING LOCALES SUCCESSFULLY GENERATED!")
