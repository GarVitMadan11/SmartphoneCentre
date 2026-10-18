#!/usr/bin/env python3
"""
Extract Cashify cookies from Brave via Chrome DevTools Protocol.
Connects to Brave's debugging port to read cookies without file locks.

Steps:
1. Restarts Brave with --remote-debugging-port=9222
2. Connects via CDP and reads cashify cookies
3. Saves session for headless price monitoring
"""
import sys
import os
import json
import time
import subprocess
import socket
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SESSION_FILE = Path(__file__).resolve().parent.parent / "server" / "data" / "cashify_session.json"
SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)

BRAVE_EXE = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
DEBUG_PORT = 9222


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0


def main():
    print("=" * 60)
    print("Cashify Cookie Extractor (via Brave CDP)")
    print("=" * 60)

    from playwright.sync_api import sync_playwright

    # Check if Brave is already running with debug port
    if not is_port_open(DEBUG_PORT):
        print(f"\nBrave is not running with debugging port {DEBUG_PORT}.")
        print("Restarting Brave with remote debugging enabled...")
        print("(Your tabs and session will be preserved)\n")

        # Kill existing Brave
        subprocess.run(["taskkill", "/F", "/IM", "brave.exe"], 
                       capture_output=True, text=True)
        time.sleep(2)

        # Relaunch with debug port
        subprocess.Popen([
            BRAVE_EXE,
            f"--remote-debugging-port={DEBUG_PORT}",
            "--restore-last-session",
        ])

        # Wait for debug port to be available
        print("Waiting for Brave to start...")
        for i in range(30):
            if is_port_open(DEBUG_PORT):
                print("Brave is ready!")
                break
            time.sleep(1)
        else:
            print("ERROR: Brave did not start with debugging port in time.")
            return False

        # Give it a moment to fully load
        time.sleep(3)

    print(f"Connecting to Brave at 127.0.0.1:{DEBUG_PORT}...")

    with sync_playwright() as p:
        # Connect to existing Brave via CDP
        browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{DEBUG_PORT}")
        print(f"Connected! Found {len(browser.contexts)} context(s)")

        all_cookies = []
        for ctx_idx, context in enumerate(browser.contexts):
            cookies = context.cookies(["https://www.cashify.in"])
            cashify_cookies = [c for c in cookies if "cashify" in c.get("domain", "")]
            if cashify_cookies:
                print(f"  Context {ctx_idx}: {len(cashify_cookies)} Cashify cookies")
                all_cookies.extend(cashify_cookies)

        if not all_cookies:
            # Try navigating to cashify to trigger cookie loading
            print("\nNo Cashify cookies found in existing contexts.")
            print("Opening Cashify page to load cookies...")
            ctx = browser.contexts[0] if browser.contexts else browser.new_context()
            page = ctx.new_page()
            page.goto("https://www.cashify.in/sell-old-mobile-phone", timeout=30000)
            time.sleep(3)
            
            cookies = ctx.cookies(["https://www.cashify.in"])
            all_cookies = [c for c in cookies if "cashify" in c.get("domain", "")]
            page.close()

        if not all_cookies:
            print("\nWARNING: No Cashify cookies found!")
            print("Make sure you're logged in to cashify.in in Brave.")
            # Still try to get ALL cookies and save
            for ctx in browser.contexts:
                all_cookies.extend(ctx.cookies())
            cashify_only = [c for c in all_cookies if "cashify" in c.get("domain", "")]
            print(f"Total cookies across all domains: {len(all_cookies)}")
            print(f"Cashify-specific cookies: {len(cashify_only)}")
            all_cookies = cashify_only if cashify_only else all_cookies

        print(f"\nCollected {len(all_cookies)} cookies")
        for c in all_cookies:
            if "cashify" in c.get("domain", ""):
                val = c.get("value", "")
                print(f"  {c['name']}: {val[:40]}{'...' if len(val) > 40 else ''}")

        # Save in Playwright storage state format
        storage_state = {
            "cookies": all_cookies,
            "origins": [],
        }

        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(storage_state, f, indent=2, ensure_ascii=False)

        print(f"\nSaved to: {SESSION_FILE}")
        print("=" * 60)
        print("Price monitor can now use these cookies headlessly!")
        print("=" * 60)

        # Don't close the browser - user is still using it
        browser.close()
        return True


if __name__ == "__main__":
    main()
