#!/usr/bin/env python3
"""
Verify Cashify URLs for all active smartphone models in the database.
Uses fast concurrent HTTP HEAD/GET requests with user-agent.
Outputs:
1. Matching URLs found (200 OK)
2. Models where URL was NOT found (404)
"""
import sys
import os
import re
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / "server" / ".env"
OUTPUT_FILE = BASE_DIR / "scripts" / "cashify_url_audit_results.json"


def load_env():
    env_vars = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars


def slugify(text: str) -> str:
    text = text.lower().strip()
    # Replace special characters like +, ", '
    text = text.replace("+", "-plus")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def get_candidate_slugs(brand_name: str, model_name: str, storages: list = None, rams: list = None):
    brand_lower = brand_name.lower().strip()
    model_lower = model_name.lower().strip()
    
    # Strip brand prefix if present
    if model_lower.startswith(brand_lower):
        clean_model = model_lower[len(brand_lower):].strip()
    else:
        clean_model = model_lower

    brand_slug = slugify(brand_name)
    clean_model_slug = slugify(clean_model)
    full_model_slug = slugify(model_name)

    candidates = []

    # Parse storages and rams
    if isinstance(storages, str):
        try: storages = json.loads(storages)
        except: storages = []
    if isinstance(rams, str):
        try: rams = json.loads(rams)
        except: rams = []

    storages = storages or []
    rams = rams or [0]

    # Generate RAM/Storage variant slugs
    variant_suffixes = []
    for s in storages:
        s_label = f"{s // 1024}-tb" if s >= 1024 else f"{s}-gb"
        for r in rams:
            if r > 0:
                variant_suffixes.append(f"{r}-gb-{s_label}")
            else:
                variant_suffixes.append(s_label)

    # 1. Motorola specific: For single-variant Motorola models, Cashify uses variant slugs directly
    if brand_slug == "motorola":
        for vs in variant_suffixes:
            candidates.append(f"used-motorola-moto-{clean_model_slug}-{vs}")
            candidates.append(f"used-motorola-moto-{clean_model_slug}-{vs}-5g")
        candidates.append(f"used-motorola-moto-{clean_model_slug}")
        if not clean_model_slug.endswith("5g"):
            candidates.append(f"used-motorola-moto-{clean_model_slug}-5g")

    # 2. Standard pattern: used-{brand}-{clean_model}
    candidates.append(f"used-{brand_slug}-{clean_model_slug}")
    if not clean_model_slug.endswith("5g"):
        candidates.append(f"used-{brand_slug}-{clean_model_slug}-5g")

    # 3. For any single-variant device, also try appending the variant
    if len(storages) == 1 and len(rams) <= 1:
        for vs in variant_suffixes:
            candidates.append(f"used-{brand_slug}-{clean_model_slug}-{vs}")
            candidates.append(f"used-{brand_slug}-{clean_model_slug}-{vs}-5g")

    # 4. Apple specific
    if brand_slug == "apple":
        candidates.append(f"used-{clean_model_slug}")
        if "se3" in clean_model_slug or "se-3" in clean_model_slug:
            candidates.append("used-apple-iphone-se-2022")
            candidates.append("used-iphone-se-2022")

    # 5. Nothing / CMF specific
    if brand_slug == "nothing" or "cmf" in clean_model_slug:
        clean_cmf = clean_model_slug[4:] if clean_model_slug.startswith("cmf-") else clean_model_slug
        candidates.append(f"used-cmf-by-nothing-{clean_cmf}")
        candidates.append(f"used-cmf-by-nothing-{clean_cmf}-5g")
        candidates.append(f"used-cmf-{clean_cmf}")
        candidates.append(f"used-nothing-{clean_model_slug}")

    # 6. OnePlus Fold / Open
    if brand_slug == "oneplus" and ("open" in clean_model_slug or "fold" in clean_model_slug):
        candidates.append("used-oneplus-open")
        candidates.append("used-oneplus-open-5g")

    # 7. vivo fold variants (e.g. fold3 -> fold-3)
    if "fold" in clean_model_slug:
        fold_hyphen = re.sub(r'fold(\d+)', r'fold-\1', clean_model_slug)
        candidates.append(f"used-vivo-{fold_hyphen}")
        candidates.append(f"used-vivo-{fold_hyphen}-5g")

    # 8. OPPO Reno without space (e.g. reno-14 -> reno14)
    if brand_slug == "oppo" and "reno" in clean_model_slug:
        reno_nospace = re.sub(r'reno-(\d+)', r'reno\1', clean_model_slug)
        candidates.append(f"used-oppo-{reno_nospace}")
        candidates.append(f"used-oppo-{reno_nospace}-5g")
        candidates.append(f"used-oppo-{reno_nospace.replace('-5g','')}")

    # 9. Xiaomi / Mi
    if brand_slug == "xiaomi":
        candidates.append(f"used-mi-{clean_model_slug}")
        candidates.append(f"used-mi-{clean_model_slug}-5g")
        for vs in variant_suffixes:
            candidates.append(f"used-xiaomi-mi-{clean_model_slug}-{vs}")
            candidates.append(f"used-xiaomi-{clean_model_slug}-{vs}")

    # Deduplicate while preserving order
    seen = set()
    unique_candidates = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique_candidates.append(c)

    return unique_candidates


def check_url(url: str) -> bool:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        method="HEAD"
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status == 200
    except urllib.error.HTTPError as e:
        if e.code == 200:
            return True
        return False
    except Exception:
        return False


def test_model(model):
    brand = model["brand_name"]
    name = model["name"]
    model_id = model["id"]
    year = model.get("releaseYear")
    candidates = get_candidate_slugs(brand, name, model.get("supportedStorageGb"), model.get("supportedRamGb"))

    for slug in candidates:
        url = f"https://www.cashify.in/sell-old-mobile-phone/{slug}"
        if check_url(url):
            return {
                "id": model_id,
                "brand": brand,
                "model": name,
                "year": year,
                "status": "FOUND",
                "url": url,
                "slug": slug,
                "candidates_tried": candidates,
            }

    return {
        "id": model_id,
        "brand": brand,
        "model": name,
        "year": year,
        "status": "NOT_FOUND",
        "url": None,
        "slug": None,
        "candidates_tried": candidates,
    }


def main():
    print("=" * 70)
    print("Cashify URL Verification for All Active Database Models")
    print("=" * 70)

    env = load_env()
    db_url = env.get("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL missing from server/.env")
        return

    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    cur.execute("""
        SELECT m.id, m.name, m."releaseYear", m."supportedStorageGb", m."supportedRamGb", b.name as brand_name
        FROM "Model" m
        JOIN "Brand" b ON m."brandId" = b.id
        WHERE m.hidden = false
        ORDER BY b.name ASC, m."releaseYear" DESC, m.name ASC
    """)
    models = cur.fetchall()
    cur.close()
    conn.close()

    print(f"Loaded {len(models)} active models from database.")
    print("Checking URLs concurrently against Cashify (this will take ~10-15 seconds)...\n")

    found_list = []
    not_found_list = []

    start_time = time.time()
    with ThreadPoolExecutor(max_workers=12) as executor:
        future_to_model = {executor.submit(test_model, m): m for m in models}
        completed = 0
        for future in as_completed(future_to_model):
            completed += 1
            res = future.result()
            if res["status"] == "FOUND":
                found_list.append(res)
                print(f"[{completed}/{len(models)}] [OK] {res['brand']} {res['model']} -> {res['url']}")
            else:
                not_found_list.append(res)
                print(f"[{completed}/{len(models)}] [MISSING] {res['brand']} {res['model']}")

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"Finished in {elapsed:.1f}s")
    print(f"FOUND:     {len(found_list)} / {len(models)} ({len(found_list)/len(models)*100:.1f}%)")
    print(f"NOT FOUND: {len(not_found_list)} / {len(models)} ({len(not_found_list)/len(models)*100:.1f}%)")
    print("=" * 70)

    # Save detailed JSON output
    data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_models": len(models),
        "found_count": len(found_list),
        "not_found_count": len(not_found_list),
        "found": sorted(found_list, key=lambda x: (x["brand"], x["model"])),
        "not_found": sorted(not_found_list, key=lambda x: (x["brand"], str(x["year"] or 0), x["model"])),
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nDetailed audit results saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
