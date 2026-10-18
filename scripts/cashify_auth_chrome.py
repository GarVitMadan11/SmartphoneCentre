#!/usr/bin/env python3
"""
Cashify One-Time Interactive Login - Uses Brave Browser
"""
import sys
import time
import json
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright

SESSION_FILE = Path(__file__).resolve().parent.parent / "server" / "data" / "cashify_session.json"
SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)

BRAVE_PATH = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"


def main():
    print("=" * 60)
    print("Cashify One-Time Interactive Login (Brave Browser)")
    print("=" * 60)
    print(flush=True)

    with sync_playwright() as p:
        print("Launching Brave browser...", flush=True)
        browser = p.chromium.launch(
            headless=False,
            executable_path=BRAVE_PATH,
            args=[
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        print("Brave launched!", flush=True)

        context = browser.new_context(
            viewport=None,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        print("Navigating to Cashify...", flush=True)
        page.goto("https://www.cashify.in/sell-old-mobile-phone", timeout=60000)
        print("Page loaded!", flush=True)
        print(flush=True)
        print("=" * 60)
        print("PLEASE LOG IN ON THE BRAVE BROWSER WINDOW", flush=True)
        print("1. Click 'Login' or the profile icon on Cashify", flush=True)
        print("2. Enter your phone number", flush=True)
        print("3. Enter the SMS OTP you receive", flush=True)
        print("The script will auto-detect when you are logged in...", flush=True)
        print("=" * 60, flush=True)

        logged_in = False
        start_time = time.time()

        while time.time() - start_time < 300:
            try:
                cookies = context.cookies()
                cookie_names = [c["name"].lower() for c in cookies]
                has_auth = any(
                    k in cookie_names
                    for k in [
                        "token", "auth_token", "jwt", "user_id",
                        "session_id", "authtoken", "connect.sid",
                    ]
                )

                ui_check = False
                try:
                    js_code = "() => { return Boolean(localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('user') || document.querySelector('.user-profile')); }"
                    ui_check = page.evaluate(js_code)
                except Exception:
                    pass

                if has_auth or ui_check:
                    print(flush=True)
                    print("Authentication detected!", flush=True)
                    logged_in = True
                    break

            except Exception:
                pass

            time.sleep(3)

        if logged_in:
            time.sleep(2)
            context.storage_state(path=str(SESSION_FILE))
            print("Session saved to: " + str(SESSION_FILE), flush=True)
            print("=" * 60)
            print("Daily 3:00 AM price monitor can now run headlessly!")
            print("=" * 60)
        else:
            print("Timed out waiting for login (5 minutes)")

        browser.close()
        print("Done", flush=True)


if __name__ == "__main__":
    main()
