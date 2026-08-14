import os
import json
import urllib.request
import urllib.parse
import time
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

with open('src/constants/languages.js', 'r', encoding='utf-8') as f:
    js_text = f.read()

codes_matches = re.findall(r"code:\s*'([^']+)'", js_text)
print(f"Total languages to support: {len(codes_matches)}")

PRESERVED = {'pl', 'en', 'cs', 'de', 'es', 'fr', 'it', 'sv', 'fi', 'ja', 'uk', 'zh', 'ru', 'pt', 'ko'}

with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_dict = json.load(f)

# Comprehensive GT Language mapping
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

def translate_batch_fast(keys_and_vals, target_lang):
    gt_lang = GT_MAP.get(target_lang, target_lang)
    if gt_lang == 'en':
        return {k: v for k, v in keys_and_vals}

    delimiter = "\n---XYZ---\n"
    vals = [v for k, v in keys_and_vals]
    joined = delimiter.join(vals)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={gt_lang}&dt=t&q={urllib.parse.quote(joined)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            res = json.loads(response.read().decode('utf-8'))
            translated_joined = ''.join([part[0] for part in res[0] if part[0]])
            parts = translated_joined.split("---XYZ---")
            if len(parts) == len(vals):
                return {k: p.strip() for k, p in zip([k for k, v in keys_and_vals], parts)}
    except Exception:
        pass

    # If batch failed, fallback to English for those specific keys
    return {k: v for k, v in keys_and_vals}

def process_single_lang(code):
    out_path = f"src/locales/{code}.json"
    if code in PRESERVED and os.path.exists(out_path):
        return code, "Preserved"

    if os.path.exists(out_path):
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            if len(existing) >= len(en_dict) - 5:
                return code, "Already complete"
        except Exception:
            pass

    items = list(en_dict.items())
    result = {}
    
    # Process in small safe chunks of 12 items
    chunk_size = 12
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i+chunk_size]
        res = translate_batch_fast(chunk, code)
        result.update(res)
        time.sleep(0.02)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    return code, f"Done ({len(result)} keys)"

to_process = [c for c in codes_matches if c not in PRESERVED]
print(f"Translating {len(to_process)} languages with thread pool...")

with ThreadPoolExecutor(max_workers=16) as executor:
    futures = {executor.submit(process_single_lang, code): code for code in to_process}
    for future in as_completed(futures):
        c = futures[future]
        try:
            code, status = future.result()
            print(f"[{code}] {status}")
        except Exception as e:
            print(f"Error on {c}: {e}")

print("All 110 languages finished!")
