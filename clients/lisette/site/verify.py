#!/usr/bin/env python3
"""Phase 7 verification rig per the playbook.
Run: python3 verify.py <page.html>   or   python3 verify.py all
Checks are conditional on the widgets a page actually contains.
External requests (fonts, image CDN) are blocked in the sandbox; those
load failures are reported as notes, not failures."""
import sys, glob, pathlib
from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium"
EXTERNAL = ("fonts.g", "cloudfront.net")


def verify(browser, page_file, shots):
    url = pathlib.Path(page_file).resolve().as_uri()
    name = pathlib.Path(page_file).stem
    errors, netfails, results = [], [], []

    def check(label, ok, detail=""):
        results.append(("PASS" if ok else "FAIL", label, detail))

    # --- Desktop pass ---
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              reduced_motion="reduce")
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("requestfailed", lambda r: netfails.append(r.url))
    pg.goto(url); pg.wait_for_timeout(1000)
    h = pg.evaluate("document.body.scrollHeight")
    for y in range(0, h, 600):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(50)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(shots / f"{name}-desktop.png"), full_page=True)

    ext = [u for u in netfails if any(d in u for d in EXTERNAL)]
    real = [e for e in errors if not ("Failed to load resource" in e and ext)]
    check("zero console/page errors", not real, "; ".join(real[:4]))
    check("loader dismissed", pg.evaluate(
        "(function(){var l=document.getElementById('loader');"
        "return !l||l.classList.contains('done')||getComputedStyle(l).visibility==='hidden'})()"))
    stuck = pg.evaluate(
        "[].slice.call(document.querySelectorAll('.rv')).filter(function(e){"
        "return !e.classList.contains('in')&&e.getBoundingClientRect().height>0}).length")
    check("no stuck .rv elements after scroll", stuck == 0, f"{stuck} stuck")

    if pg.query_selector(".faq details"):
        pg.eval_on_selector(".faq details:first-child summary", "e=>e.click()")
        pg.wait_for_timeout(200)
        check("FAQ accordion opens", pg.evaluate(
            "document.querySelector('.faq details').hasAttribute('open')"))
    if pg.query_selector(".wswitch"):
        pg.click(".wswitch button[data-w='old']"); pg.wait_for_timeout(200)
        check("old/new toggle switches", pg.evaluate(
            "getComputedStyle(document.querySelector('.wpanel.old')).display!=='none'"))
    if pg.query_selector("form"):
        check("form has action set", pg.evaluate(
            "!!document.querySelector('form').action"))
    pg.click("#banner .bx")
    check("banner dismisses", pg.evaluate(
        "document.getElementById('banner').style.display==='none'"))
    ctx.close()

    # --- Mobile 390 pass ---
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              reduced_motion="reduce")
    pg = ctx.new_page()
    pg.goto(url); pg.wait_for_timeout(800)
    h = pg.evaluate("document.body.scrollHeight")
    for y in range(0, h, 500):
        pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(40)
    over = pg.evaluate(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth")
    check("mobile 390px horizontal overflow is 0", over == 0, f"{over}px")
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(shots / f"{name}-mobile.png"), full_page=True)
    pg.click(".burger"); pg.wait_for_timeout(300)
    check("mobile menu opens", pg.evaluate(
        "document.body.classList.contains('menu-open')"))
    ctx.close()

    # --- JS disabled pass ---
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              java_script_enabled=False)
    pg = ctx.new_page()
    pg.goto(url); pg.wait_for_timeout(3800)
    check("JS off: loader self-destructs via CSS", pg.evaluate(
        "getComputedStyle(document.getElementById('loader')).visibility==='hidden'"))
    hidden = pg.evaluate(
        "[].slice.call(document.querySelectorAll('main section')).filter(function(s){"
        "return s.getBoundingClientRect().height<40}).length")
    check("JS off: all sections visible", hidden == 0, f"{hidden} collapsed")
    ctx.close()
    return results, len(ext)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "home.html"
    files = sorted(glob.glob("*.html")) if target == "all" else [target]
    shots = pathlib.Path("shots"); shots.mkdir(exist_ok=True)
    total_fail = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME)
        for f in files:
            results, ext = verify(browser, f, shots)
            fails = [r for r in results if r[0] == "FAIL"]
            total_fail += len(fails)
            flag = "OK " if not fails else "BAD"
            note = f" ({ext} external requests blocked by sandbox)" if ext else ""
            print(f"[{flag}] {f}: {len(results)-len(fails)}/{len(results)} checks{note}")
            for s, l, d in fails:
                print(f"      FAIL {l} {d}")
        browser.close()
    print(f"\n{'ALL PAGES PASS' if total_fail == 0 else str(total_fail)+' FAILURES'}")
    sys.exit(1 if total_fail else 0)
