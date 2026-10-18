#!/usr/bin/env python3
"""
Cashify Sure-Shot Price Comparison & Alert Monitor
--------------------------------------------------
Usage:
    python scripts/cashify_price_monitor.py [--headless] [--limit 10]

Sure-Shot Policy:
- Only records prices when verified with 100% confidence.
- If Cashify displays "we are not currently purchasing in this location" or "currently unavailable",
  or if the price cannot be reliably extracted, it DOES NOT guess or save.
- Skipped variants are collected and saved to `scripts/cashify_scan_latest_report.json`
  so the administrator can supply correct custom URLs.
"""

import sys
import os
import json
import re
import time
import argparse
from pathlib import Path
from datetime import datetime

# Force utf-8 encoding and unbuffered output on Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
sys.stderr.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

from playwright.sync_api import sync_playwright
import psycopg2
from psycopg2.extras import RealDictCursor

BASE_DIR = Path(__file__).resolve().parent.parent
SESSION_FILE = BASE_DIR / "server" / "data" / "cashify_session.json"
OVERRIDES_FILE = BASE_DIR / "server" / "data" / "cashify_custom_urls.json"
AUDIT_CACHE_FILE = BASE_DIR / "scripts" / "cashify_url_audit_results.json"
REPORT_FILE = BASE_DIR / "scripts" / "cashify_scan_latest_report.json"
ENV_FILE = BASE_DIR / "server" / ".env"

UNSERVICEABLE_PHRASES = [
    "not currently purchasing",
    "not currently buying",
    "currently not buying",
    "not buying in this location",
    "currently unavailable in your location",
    "we do not buy",
    "we don't buy",
    "cannot buy this device",
    "not serviceable",
    "service not available",
    "temporarily unavailable",
    "out of service",
]


def load_env():
    """Simple parser for server/.env to get DATABASE_URL"""
    env_vars = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars


def get_db_connection(db_url: str):
    return psycopg2.connect(db_url, cursor_factory=RealDictCursor)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def get_candidate_slugs(brand_name: str, model_name: str):
    brand_lower = brand_name.lower().strip()
    model_lower = model_name.lower().strip()
    
    if model_lower.startswith(brand_lower):
        clean_model = model_lower[len(brand_lower):].strip()
    else:
        clean_model = model_lower

    brand_slug = slugify(brand_name)
    clean_model_slug = slugify(clean_model)

    candidates = []
    # 1. Standard pattern
    candidates.append(f"used-{brand_slug}-{clean_model_slug}")
    if not clean_model_slug.endswith("5g"):
        candidates.append(f"used-{brand_slug}-{clean_model_slug}-5g")

    # 2. Motorola specific: 'motorola-moto-'
    if brand_slug == "motorola":
        candidates.append(f"used-motorola-moto-{clean_model_slug}")
        if not clean_model_slug.endswith("5g"):
            candidates.append(f"used-motorola-moto-{clean_model_slug}-5g")

    # 3. Apple specific
    if brand_slug == "apple":
        candidates.append(f"used-{clean_model_slug}")
        if "se3" in clean_model_slug or "se-3" in clean_model_slug:
            candidates.append("used-apple-iphone-se-2022")

    # 4. Nothing / CMF specific
    if brand_slug == "nothing" or "cmf" in clean_model_slug:
        clean_cmf = clean_model_slug[4:] if clean_model_slug.startswith("cmf-") else clean_model_slug
        candidates.append(f"used-cmf-by-nothing-{clean_cmf}")
        candidates.append(f"used-cmf-by-nothing-{clean_cmf}-5g")
        candidates.append(f"used-cmf-{clean_cmf}")

    # 5. OnePlus Fold / Open
    if brand_slug == "oneplus" and ("open" in clean_model_slug or "fold" in clean_model_slug):
        candidates.append("used-oneplus-open")
        candidates.append("used-oneplus-open-5g")

    # 6. vivo fold variants
    if "fold" in clean_model_slug:
        fold_hyphen = re.sub(r'fold(\d+)', r'fold-\1', clean_model_slug)
        candidates.append(f"used-vivo-{fold_hyphen}")
        candidates.append(f"used-vivo-{fold_hyphen}-5g")

    # 7. OPPO Reno without space (e.g. reno-14 -> reno14)
    if brand_slug == "oppo" and "reno" in clean_model_slug:
        reno_nospace = re.sub(r'reno-(\d+)', r'reno\1', clean_model_slug)
        candidates.append(f"used-oppo-{reno_nospace}")
        candidates.append(f"used-oppo-{reno_nospace}-5g")
        candidates.append(f"used-oppo-{reno_nospace.replace('-5g','')}")

    # 8. Xiaomi / Mi
    if brand_slug == "xiaomi":
        candidates.append(f"used-mi-{clean_model_slug}")
        candidates.append(f"used-mi-{clean_model_slug}-5g")

    seen = set()
    unique = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


VERIFIED_URL_CACHE = {}
if AUDIT_CACHE_FILE.exists():
    try:
        with open(AUDIT_CACHE_FILE, "r", encoding="utf-8") as f:
            audit_data = json.load(f)
            for item in audit_data.get("found", []):
                VERIFIED_URL_CACHE[item["id"]] = item["url"]
    except Exception:
        pass


def get_cashify_model_url(model_id, brand_name: str, model_name: str) -> str:
    model_id_str = str(model_id)

    # 1. Check custom overrides file
    if OVERRIDES_FILE.exists():
        try:
            with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
                custom = json.load(f)
                if model_id_str in custom:
                    return custom[model_id_str]
                if model_name in custom:
                    return custom[model_name]
        except Exception:
            pass

    # 2. Check verified URL cache
    if model_id_str in VERIFIED_URL_CACHE:
        return VERIFIED_URL_CACHE[model_id_str]

    # 3. Fallback to candidate 0
    candidates = get_candidate_slugs(brand_name, model_name)
    return f"https://www.cashify.in/sell-old-mobile-phone/{candidates[0]}"


import urllib.request

HTTP_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}


def get_best_variant_url(base_url: str, brand: str, model: str, ram: int, storage: int, custom_overrides: dict, model_id: str) -> str:
    # 1. Check custom overrides first
    var_key = f"{model_id}_{ram}_{storage}"
    var_named_key = f"{model}_{ram}_{storage}"
    if var_key in custom_overrides:
        return custom_overrides[var_key]
    if var_named_key in custom_overrides:
        return custom_overrides[var_named_key]
    if model_id in custom_overrides:
        return custom_overrides[model_id]

    storage_slug = f"{storage // 1024}-tb" if storage >= 1024 else f"{storage}-gb"
    candidates = []

    # If RAM is known > 0
    if ram > 0:
        candidates.append(f"{base_url}-{ram}-gb-{storage_slug}")
    else:
        # Apple
        if brand.lower() == "apple":
            for r in [8, 6, 4, 12]:
                candidates.append(f"{base_url}-{r}-gb-{storage_slug}")
        candidates.append(f"{base_url}-{storage_slug}")

    candidates.append(base_url)

    for c in candidates:
        try:
            req = urllib.request.Request(c, headers=HTTP_HEADERS, method='HEAD')
            resp = urllib.request.urlopen(req, timeout=3.5)
            if resp.status == 200:
                return c
        except Exception:
            pass

    return base_url


def check_page_unserviceable(page) -> tuple[bool, str]:
    """Checks if Cashify page shows location or purchasing unavailability"""
    try:
        body_text = page.inner_text("body").lower()
        for phrase in UNSERVICEABLE_PHRASES:
            if phrase in body_text:
                return True, f"Cashify alert: '{phrase}'"
    except Exception:
        pass
    return False, ""


def check_is_variant_picker(page) -> bool:
    """Checks if Cashify page is just a variant selector ('Choose a variant') instead of a specific variant quote page"""
    try:
        body = page.inner_text("body").lower()
        if "choose a variant" in body or "choose variant" in body or "select a variant" in body or "choose your variant" in body:
            return True
    except Exception:
        pass
    return False


def extract_sure_shot_price(page) -> int | None:
    """Extracts unmasked price ONLY if we are on a true variant page, not on a picker"""
    if check_is_variant_picker(page):
        return None

    # 1. Direct Schema itemprop="price" (Most reliable and unmasked)
    try:
        schema_elem = page.locator("[itemprop='price']").first
        if schema_elem.count() > 0:
            val = schema_elem.inner_text().strip()
            if not val:
                val = schema_elem.get_attribute("content") or ""
            cleaned = re.sub(r"[^\d]", "", val)
            if cleaned:
                price = int(cleaned)
                if 1000 <= price <= 250000:
                    return price
    except Exception:
        pass

    # 2. Meta tag with itemprop="price"
    try:
        meta_elem = page.locator("meta[itemprop='price']").first
        if meta_elem.count() > 0:
            content = meta_elem.get_attribute("content") or ""
            cleaned = re.sub(r"[^\d]", "", content)
            if cleaned:
                price = int(cleaned)
                if 1000 <= price <= 250000:
                    return price
    except Exception:
        pass

    return None


def run_monitor(limit: int = 0, headless: bool = True):
    print("=" * 70)
    print(f"📊 Cashify Sure-Shot Price Comparison Monitor")
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Policy: ONLY 100% verified prices recorded. Unserviceable skipped.")
    print("=" * 70)

    if not SESSION_FILE.exists():
        print(f"❌ Error: Authentication session file not found at:\n   {SESSION_FILE}")
        return

    env = load_env()
    db_url = env.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL missing from server/.env")
        return

    conn = get_db_connection(db_url)
    cursor = conn.cursor()

    query = """
        SELECT m.id, m.name, m."brandId", m."basePrice128GB", m."supportedRamGb", 
               m."supportedStorageGb", m."variantPrices", b.name as brand_name
        FROM "Model" m
        JOIN "Brand" b ON m."brandId" = b.id
        WHERE m.hidden = false
        ORDER BY b.name, m."releaseYear" DESC, m.name
    """
    if limit > 0:
        query += f" LIMIT {limit}"

    cursor.execute(query)
    models = cursor.fetchall()
    print(f"📦 Loaded {len(models)} active models from database.")

    # Load custom URL overrides
    custom_overrides = {}
    if OVERRIDES_FILE.exists():
        try:
            with open(OVERRIDES_FILE, "r", encoding="utf-8") as f:
                custom_overrides = json.load(f)
        except Exception:
            pass

    successful_audits = []
    skipped_variants = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled"]
        )

        context = browser.new_context(
            storage_state=str(SESSION_FILE),
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        for idx, model in enumerate(models, 1):
            brand_name = model["brand_name"]
            model_name = model["name"]
            model_id = str(model["id"])

            print(f"\n[{idx}/{len(models)}] Auditing: {brand_name} {model_name}")

            base_model_url = get_cashify_model_url(model_id, brand_name, model_name)

            # Parse supported storages & RAMs
            storages = json.loads(model["supportedStorageGb"]) if isinstance(model["supportedStorageGb"], str) else [128, 256]
            rams = json.loads(model["supportedRamGb"]) if isinstance(model["supportedRamGb"], str) else [0]
            variant_prices = json.loads(model["variantPrices"]) if isinstance(model["variantPrices"], str) else (model["variantPrices"] or {})
            active_rams = [r for r in rams if r > 0] if any(r > 0 for r in rams) else [0]

            # Filter active variants based on explicit matrix configuration
            matrix_price_keys = {
                k: v for k, v in variant_prices.items() 
                if not k.startswith('_') and isinstance(v, (int, float)) and v > 0
            }
            has_configured_matrix = len(matrix_price_keys) > 0

            for ram in active_rams:
                for storage in storages:
                    ram_storage_key = f"{ram}_{storage}"

                    # If model has configured matrix, only audit active variants!
                    if has_configured_matrix:
                        is_active = (
                            ram_storage_key in matrix_price_keys or
                            (ram == 0 and str(storage) in matrix_price_keys) or
                            (ram == 0 and f"0_{storage}" in matrix_price_keys)
                        )
                        if not is_active:
                            continue

                    storage_label = f"{storage // 1024} TB" if storage >= 1024 else f"{storage} GB"
                    ram_label = f"{ram} GB" if ram > 0 else "—"
                    spec_title = f"{ram_label} RAM / {storage_label}" if ram > 0 else storage_label

                    # Calculate Rephonix Buyback Price
                    rephonix_price = model["basePrice128GB"]
                    if ram_storage_key in variant_prices and isinstance(variant_prices[ram_storage_key], (int, float)):
                        rephonix_price = int(variant_prices[ram_storage_key])
                    elif str(storage) in variant_prices and isinstance(variant_prices[str(storage)], (int, float)):
                        rephonix_price = int(variant_prices[str(storage)])
                    elif storage == 128:
                        rephonix_price = model["basePrice128GB"]

                    # Determine exact verified variant Cashify URL
                    target_url = get_best_variant_url(base_model_url, brand_name, model_name, ram, storage, custom_overrides, model_id)

                    try:
                        # Navigate to target variant URL
                        resp = page.goto(target_url, timeout=20000, wait_until="domcontentloaded")
                        time.sleep(1.2)

                        # If direct variant URL resulted in 404, fallback to base model URL and click button
                        if resp and resp.status == 404 and target_url != base_model_url:
                            resp = page.goto(base_model_url, timeout=20000, wait_until="domcontentloaded")
                            time.sleep(1.2)
                            # Click storage button
                            btn = page.locator(f"button:has-text('{storage_label}'), div:has-text('{storage_label}')").first
                            if btn.count() > 0:
                                btn.click(timeout=2500)
                                time.sleep(1)

                        # 1. Check for location or unserviceable warning
                        unserviceable, reason = check_page_unserviceable(page)
                        if unserviceable:
                            print(f"   ⚠️ SKIPPED [{spec_title}]: {reason}")
                            skipped_variants.append({
                                "model_id": model_id,
                                "brand": brand_name,
                                "model": model_name,
                                "ram": ram,
                                "storage": storage,
                                "spec": spec_title,
                                "url": target_url,
                                "reason": reason
                            })
                            continue

                        # 2. Check if page is merely a "Choose a variant" selector
                        if check_is_variant_picker(page):
                            print(f"   ⚠️ SKIPPED [{spec_title}]: Landed on 'Choose a variant' picker (not exact variant page).")
                            skipped_variants.append({
                                "model_id": model_id,
                                "brand": brand_name,
                                "model": model_name,
                                "ram": ram,
                                "storage": storage,
                                "spec": spec_title,
                                "url": target_url,
                                "reason": "Landed on 'Choose a variant' selector (not exact variant page)."
                            })
                            continue

                        # 3. Extract Sure-Shot Price
                        cashify_price = extract_sure_shot_price(page)
                        if not cashify_price:
                            print(f"   ⚠️ SKIPPED [{spec_title}]: No sure-shot price on page.")
                            skipped_variants.append({
                                "model_id": model_id,
                                "brand": brand_name,
                                "model": model_name,
                                "ram": ram,
                                "storage": storage,
                                "spec": spec_title,
                                "url": target_url,
                                "reason": "No itemprop='price' or verified sell price found."
                            })
                            continue

                        # 3. Verified Price Comparison
                        diff = rephonix_price - cashify_price

                        # Check previous record
                        cursor.execute("""
                            SELECT "cashifyPrice" FROM "CashifyPriceAlert" 
                            WHERE "modelId" = %s AND "storageGb" = %s AND "ramGb" = %s
                            ORDER BY "alertDate" DESC LIMIT 1
                        """, (model_id, storage, ram))
                        prev_row = cursor.fetchone()
                        prev_cashify = prev_row["cashifyPrice"] if prev_row else cashify_price
                        change_amt = cashify_price - prev_cashify

                        if change_amt > 200:
                            status = "INCREASED"
                        elif change_amt < -200:
                            status = "DECREASED"
                        else:
                            status = "STABLE"

                        # Insert into database
                        cursor.execute("""
                            INSERT INTO "CashifyPriceAlert" 
                            ("id", "modelId", "modelName", "brandName", "ramGb", "storageGb", 
                             "rephonixPrice", "cashifyPrice", "difference", "status", "changeAmount", "alertDate")
                            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        """, (
                            model_id, model_name, brand_name, ram, storage,
                            rephonix_price, cashify_price, diff, status, change_amt
                        ))
                        conn.commit()

                        badge = "▲ HIKE" if status == "INCREASED" else "▼ DROP" if status == "DECREASED" else "━ STABLE"
                        edge = f"+₹{diff:,} (We pay more)" if diff > 0 else f"-₹{abs(diff):,} (We pay less)"
                        print(f"   ✅ SURE-SHOT [{spec_title}]: Cashify ₹{cashify_price:,} | Rephonix ₹{rephonix_price:,} [{edge}] [{badge}]")

                        successful_audits.append({
                            "model_id": model_id,
                            "brand": brand_name,
                            "model": model_name,
                            "ram": ram,
                            "storage": storage,
                            "spec": spec_title,
                            "rephonix_price": rephonix_price,
                            "cashify_price": cashify_price,
                            "difference": diff,
                            "status": status,
                            "change_amount": change_amt,
                            "url": target_url
                        })

                    except Exception as e:
                        print(f"   ⚠️ ERROR [{spec_title}]: {e}")
                        skipped_variants.append({
                            "model_id": model_id,
                            "brand": brand_name,
                            "model": model_name,
                            "ram": ram,
                            "storage": storage,
                            "spec": spec_title,
                            "url": target_url,
                            "reason": f"Page execution error: {str(e)}"
                        })

        browser.close()

    cursor.close()
    conn.close()

    # Save comprehensive report to JSON
    report_data = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_models_scanned": len(models),
        "successful_audits_count": len(successful_audits),
        "skipped_variants_count": len(skipped_variants),
        "successful_audits": successful_audits,
        "skipped_variants": skipped_variants,
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"🏁 Cashify Scan Completed!")
    print(f"✅ Successful Sure-Shot Audits: {len(successful_audits)}")
    print(f"⚠️ Skipped Variants (No Price / Unserviceable): {len(skipped_variants)}")
    print(f"📁 Full report saved to: {REPORT_FILE}")
    print("=" * 70)

    if skipped_variants:
        print("\n📋 SKIPPED VARIANTS REQUIRING CUSTOM URL:")
        for s in skipped_variants:
            print(f"   • {s['brand']} {s['model']} ({s['spec']}): {s['reason']}")
            print(f"     URL: {s['url']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cashify Sure-Shot Price Comparison Monitor")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of models to audit (0 = all)")
    parser.add_argument("--visible", action="store_true", help="Run browser visibly instead of headless")
    args = parser.parse_args()

    run_monitor(limit=args.limit, headless=not args.visible)
