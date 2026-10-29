#!/usr/bin/env python3
"""
Cashify One-Time Interactive Authentication Script
--------------------------------------------------
Usage:
    python scripts/cashify_auth.py

Opens a Chromium browser window to https://www.cashify.in.
1. Log in with your phone number & OTP.
2. Once logged in, the script detects the authenticated session,
   extracts cookies, tokens, and storage state, and writes them to:
   server/data/cashify_session.json
"""

import sys
import os
import json
import time
from pathlib import Path

# Force utf-8 encoding on Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent.parent
SESSION_FILE = BASE_DIR / "server" / "data" / "cashify_session.json"
SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)


def check_existing_session():
    if not SESSION_FILE.exists():
        print("❌ No existing Cashify session found.")
        return False
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        cookies = data.get("cookies", [])
        if cookies:
            print(f"✅ Found existing Cashify session with {len(cookies)} cookies.")
            return True
    except Exception as e:
        print(f"⚠️ Error reading existing session: {e}")
    return False


def run_interactive_login():
    print("=" * 60)
    print("🚀 Cashify One-Time Interactive Login")
    print("=" * 60)
    print("A browser window will open now to Cashify.")
    print("👉 Please log in using your Phone Number and SMS OTP.")
    print("👉 Once logged in, the script will automatically detect your")
    print("   session and save it to: server/data/cashify_session.json")
    print("=" * 60)

    with sync_playwright() as p:
        # Launch visible browser for user to interact
        brave_path = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
        launch_kwargs = {
            "headless": False,
            "args": [
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
            ]
        }
        if os.path.exists(brave_path):
            launch_kwargs["executable_path"] = brave_path

        browser = p.chromium.launch(**launch_kwargs)
        context = browser.new_context(
            viewport=None,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )

        page = context.new_page()
        page.goto("https://www.cashify.in", timeout=60000)

        print("\n⏳ Waiting for user to complete login on Cashify...")
        print("   (The script checks every 2 seconds for active auth cookies/tokens)")

        # Poll until user has logged in (cookies or auth indicator present)
        logged_in = False
        start_time = time.time()
        timeout_seconds = 300  # 5 minutes max

        while time.time() - start_time < timeout_seconds:
            try:
                cookies = context.cookies()
                cookie_names = [c["name"].lower() for c in cookies]

                # Check common auth indicators on Cashify
                has_auth_cookie = any(
                    k in cookie_names for k in ["_cs__user_auth__v1", "token", "auth_token", "jwt", "user_id", "session_id", "authtoken"]
                )

                # Check if user profile element or name is visible on page
                user_logged_in_ui = False
                try:
                    user_logged_in_ui = page.evaluate("""() => {
                        return Boolean(
                            localStorage.getItem('token') ||
                            localStorage.getItem('authToken') ||
                            localStorage.getItem('user') ||
                            document.querySelector('[data-testid="user-profile"]') ||
                            document.querySelector('.user-profile') ||
                            document.querySelector('button[aria-label*="Profile"]')
                        );
                    }""")
                except Exception:
                    pass

                if has_auth_cookie or user_logged_in_ui:
                    print("\n🎉 Authentication detected successfully!")
                    logged_in = True
                    break

            except Exception:
                pass

            time.sleep(3)

        if not logged_in:
            print("\n⚠️ Login timed out or was cancelled.")
            browser.close()
            return False

        # Brief pause to let all auth tokens settle
        time.sleep(2)

        # Save session state (cookies + local storage)
        context.storage_state(path=str(SESSION_FILE))
        print(f"\n💾 Session state successfully saved to:\n   {SESSION_FILE}")
        print("=" * 60)
        print("✅ Daily 3:00 AM price monitor can now run headlessly without OTP!")
        print("=" * 60)

        browser.close()
        return True


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        check_existing_session()
    else:
        run_interactive_login()
