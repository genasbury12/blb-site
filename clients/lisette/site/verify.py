#!/usr/bin/env python3
"""Phase 7 verification rig per the playbook. Run: python3 verify.py <page.html>"""
import sys, pathlib
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium"
page_file = sys.argv[1] if len(sys.argv) > 1 else "home.html"
url = pathlib.Path(page_file).resolve().as_uri()
shots = pathlib.Path("shots"); shots.mkdir(exist_ok=True)
name = pathlib.Path(page_file).stem
errors, results = [], []

def check(label, ok, detail=""):
    results.append(("PASS" if ok else "FAIL", label, detail))

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME)

    # --- Desktop pass ---
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              reduced_motion="reduce")
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    netfails = []
    pg.on("requestfailed", lambda r: netfails.append(r.url))
    pg.goto(url); pg.wait_for_timeout(1200)
    # scroll pass so lazy reveals fire
    h = pg.evaluate("document.body.scrollHeight")
    for y in range(0, h, 600):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(60)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(500)
    pg.screenshot(path=str(shots / f"{name}-desktop.png"), full_page=True)
    # external font fetches can be blocked in the sandbox; report but don't fail on them
    ext = [u for u in netfails if "fonts.g" in u]
    real_errors = [e for e in errors
                   if not ("Failed to load resource" in e and ext)]
    check("zero console/page errors", not real_errors, "; ".join(real_errors[:4]))
    if ext:
        print(f"note: {len(ext)} Google Fonts request(s) blocked by sandbox "
              "(fine in production): " + ext[0])
    check("loader dismissed", pg.evaluate(
        "(function(){var l=document.getElementById('loader');"
        "return !l||l.classList.contains('done')||getComputedStyle(l).visibility==='hidden'})()"))
    # hidden reveals left over?
    stuck = pg.evaluate(
        "[].slice.call(document.querySelectorAll('.rv')).filter(function(e){"
        "return !e.classList.contains('in')&&e.getBoundingClientRect().height>0}).length")
    check("no stuck .rv elements after scroll", stuck == 0, f"{stuck} stuck")

    # CLICK the interactive things
    pg.click(".faq details:first-child summary"); pg.wait_for_timeout(200)
    check("FAQ accordion opens", pg.evaluate(
        "document.querySelector('.faq details').hasAttribute('open')"))
    if pg.query_selector(".wswitch"):
        pg.click(".wswitch button[data-w='old']"); pg.wait_for_timeout(200)
        check("old/new toggle switches", pg.evaluate(
            "getComputedStyle(document.querySelector('.wpanel.old')).display!=='none'"))
        pg.click(".wswitch button[data-w='new']")
    pg.click("#banner .bx")
    check("banner dismisses", pg.evaluate(
        "document.getElementById('banner').style.display==='none'"))
    ctx.close()

    # --- Mobile 390 pass ---
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(url); pg.wait_for_timeout(1000)
    h = pg.evaluate("document.body.scrollHeight")
    for y in range(0, h, 500):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(50)
    over = pg.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("mobile 390px horizontal overflow is 0", over == 0, f"{over}px")
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(shots / f"{name}-mobile.png"), full_page=True)
    pg.click(".burger"); pg.wait_for_timeout(350)
    check("mobile menu opens", pg.evaluate(
        "document.body.classList.contains('menu-open')"))
    pg.screenshot(path=str(shots / f"{name}-mobile-menu.png"))
    pg.click(".mmenu a"); pg.wait_for_timeout(200)
    check("mobile menu closes on link tap", pg.evaluate(
        "!document.body.classList.contains('menu-open')"))
    ctx.close()

    # --- JS disabled pass ---
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              java_script_enabled=False)
    pg = ctx.new_page()
    pg.goto(url); pg.wait_for_timeout(3500)  # CSS fallback kills loader ~2.6s
    vis = pg.evaluate if False else None
    loader_gone = pg.evaluate(
        "getComputedStyle(document.getElementById('loader')).visibility==='hidden'")
    check("JS off: loader self-destructs via CSS", loader_gone)
    hidden = pg.evaluate(
        "[].slice.call(document.querySelectorAll('main section')).filter(function(s){"
        "return s.getBoundingClientRect().height<40}).length")
    check("JS off: all sections visible", hidden == 0, f"{hidden} collapsed")
    pg.screenshot(path=str(shots / f"{name}-nojs.png"), full_page=True)
    ctx.close()
    browser.close()

print()
bad = 0
for status, label, detail in results:
    if status == "FAIL": bad += 1
    print(f"[{status}] {label}" + (f"  ({detail})" if detail else ""))
print(f"\n{'ALL CHECKS PASSED' if bad == 0 else str(bad) + ' CHECKS FAILED'}")
sys.exit(1 if bad else 0)
