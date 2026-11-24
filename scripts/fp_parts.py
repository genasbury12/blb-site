"""Shared look for The Futureproof Blogger brand pages (course sales page and the free webinar)."""

def orbit(cls="orbit", n=18):
    rings = "".join(f'<ellipse cx="200" cy="200" rx="170" ry="{60 + (i % 3) * 14}" transform="rotate({i * 180 / n:.1f} 200 200)"/>' for i in range(n))
    return f'<svg class="{cls}" viewBox="0 0 400 400" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".9">{rings}</g></svg>'

THEME = r'''<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Space+Grotesk:wght@400;500;600&display=swap">
<style>
/* The Futureproof Blogger: The Future Is Female. A high fashion editorial identity: chrome meets couture.
   ~50% Midnight Orchid, 30% Digital Pearl, 15% lavender and amethyst, 5% liquid silver. */
.fpb{--orchid:#211C2C;--amethyst:#69577F;--flilac:#A99AC6;--silver:#C8CCD8;--lav:#D9CDE7;--pearl:#F6F3F8;
 --plum:#211C2C;--berry:#69577F;--rose:#D9CDE7;--blush:#D9CDE7;--cream:#F6F3F8;--cocoa:#3B3446;--mauve:#69577F;--pop:#A99AC6;
 --font-display:'Bodoni Moda',Georgia,serif;--font-body:'Space Grotesk',system-ui,sans-serif;--font-label:'Space Grotesk',system-ui,sans-serif;
 background:var(--pearl);font-family:var(--font-body)}
.fpb h1,.fpb h2,.fpb h3{font-weight:400;letter-spacing:-.01em;line-height:1.02}
.fpb h1 em,.fpb h2 em{font-style:italic;color:var(--amethyst)}
.fpb .dk h1 em,.fpb .dk h2 em{color:var(--flilac)}
.fpb .lbl{font:600 11.5px/1.4 var(--font-label);letter-spacing:.22em;color:var(--amethyst)}
.fpb .dk .lbl{color:var(--flilac)}
.fpb .body{font:400 18px/1.7 var(--font-body);color:var(--cocoa)}
.fpb .dk .body{color:#D8D2E2}
.fpb .big{font:400 clamp(24px,2.8vw,32px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .dk .big{color:var(--pearl)}
.fpb .orc{background:var(--orchid)}
.fpb .lavbg{background:var(--lav)}
.fpb .amebg{background:var(--amethyst)}
.fpb .pf-btn{background:var(--pearl);color:var(--orchid);border-radius:999px;font:600 14px/1 var(--font-label);letter-spacing:.16em;text-transform:uppercase;min-height:58px;padding:8px 10px 8px 28px}
.fpb .pf-btn i{background:var(--orchid)}
.fpb .pf-btn.dkb{background:var(--orchid);color:var(--pearl)}.fpb .pf-btn.dkb i{background:var(--amethyst)}
.fpb .pf-btn.ol{background:transparent;color:var(--orchid);border:1px solid var(--orchid)}.fpb .pf-btn.ol i{background:var(--amethyst)}
.fpb .pf-btn.olw{background:transparent;color:var(--pearl);border:1px solid rgba(246,243,248,.5)}.fpb .pf-btn.olw i{background:var(--amethyst)}.fpb .pf-btn.olw i svg{stroke:#fff}
.fpb .pf-slot{border:1px dashed var(--amethyst);color:var(--amethyst);background:rgba(105,87,127,.05);border-radius:4px;font-family:var(--font-body)}
.fpb .dk .pf-slot{border-color:var(--flilac);color:var(--lav);background:rgba(169,154,198,.07)}
.fpb .rule{height:1px;background:currentColor;opacity:.25;border:0;margin:0}
.fpb .issue{font:500 11.5px/1 var(--font-label);letter-spacing:.24em;text-transform:uppercase}
/* wordmark */
.fpb .wm{line-height:.9;color:var(--pearl);margin:0}
.fpb .wm .t{display:block;font:italic 400 clamp(30px,3.4vw,48px)/1 var(--font-display);color:var(--lav)}
.fpb .wm .f{display:block;font:400 clamp(34px,4.9vw,76px)/.95 var(--font-display);letter-spacing:.01em;background:linear-gradient(180deg,#fff 0%,#C8CCD8 55%,#8E92A4 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.fpb .wm .b{display:block;font:italic 400 clamp(48px,6.6vw,104px)/.95 var(--font-display);color:#fff}
/* hero */
.fpb .hero{position:relative;overflow:hidden;isolation:isolate;padding-top:clamp(56px,7vw,96px)}
.fpb .hero-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(30px,5vw,64px);align-items:center}
.fpb .hero h1{font-size:clamp(34px,3.8vw,52px);color:var(--pearl)}
.fpb .portrait{position:relative;aspect-ratio:4/5;overflow:hidden;border-radius:2px}
.fpb .portrait img{width:100%;height:100%;object-fit:cover;object-position:55% 25%;display:block;filter:grayscale(1) contrast(1.08) brightness(.92)}
.fpb .portrait::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(169,154,198,.45),rgba(33,28,44,.55));mix-blend-mode:multiply}
.fpb .portrait .orbit{position:absolute;right:-38%;top:-30%;width:78%;color:var(--lav);z-index:2;opacity:.75}
.fpb .portrait figcaption{position:absolute;left:16px;bottom:14px;z-index:3;color:var(--pearl)}
.fpb .orbit{animation:fp-spin 60s linear infinite}
@keyframes fp-spin{to{transform:rotate(360deg)}}
/* evolution */
.fpb .evo{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(30px,5vw,72px);align-items:center}
.fpb .qs{display:flex;flex-direction:column}
.fpb .qs p{padding:22px 0;border-top:1px solid rgba(33,28,44,.18);font:italic 400 clamp(22px,2.4vw,30px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .qs p span{display:block;font:500 11px/1 var(--font-label);font-style:normal;letter-spacing:.24em;color:var(--amethyst);margin-bottom:10px}
.fpb .sphere{aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 34% 30%,#fff 0%,#E8E9F0 14%,#C8CCD8 42%,#8E92A4 78%,#6c7083 100%);box-shadow:0 60px 90px -40px rgba(33,28,44,.55),inset -20px -30px 60px rgba(33,28,44,.25);max-width:380px;width:100%;margin:0 auto}
/* statement */
.fpb .state{text-align:center;padding:clamp(90px,12vw,170px) clamp(16px,4vw,48px)}
.fpb .state h2{font-size:clamp(46px,7.4vw,108px);line-height:1}
/* index */
.fpb .index{list-style:none;margin:0;padding:0;counter-reset:x}
.fpb .index li{counter-increment:x;display:grid;grid-template-columns:90px minmax(0,1fr);gap:20px;align-items:baseline;padding:24px 0;border-top:1px solid rgba(33,28,44,.18)}
.fpb .index li:last-child{border-bottom:1px solid rgba(33,28,44,.18)}
.fpb .index li::before{content:counter(x,decimal-leading-zero);font:italic 400 44px/1 var(--font-display);color:var(--flilac)}
.fpb .index li span{font:400 clamp(21px,2.2vw,27px)/1.3 var(--font-display);color:var(--orchid)}
.fpb .trans{padding:clamp(26px,4vw,44px);background:var(--orchid);color:var(--pearl);font:italic 400 clamp(24px,2.6vw,32px)/1.3 var(--font-display)}
.fpb .trans b{display:block;font:500 11px/1 var(--font-label);font-style:normal;letter-spacing:.24em;color:var(--flilac);margin-bottom:14px}
/* founder + purchase */
.fpb .fp-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(30px,5vw,72px);align-items:start}
.fpb .card{background:#fff;border:1px solid rgba(33,28,44,.14);padding:clamp(26px,4vw,44px);display:flex;flex-direction:column;gap:16px}
.fpb .card .wm .f{font-size:clamp(34px,4vw,54px);background:linear-gradient(180deg,#69577F,#211C2C);-webkit-background-clip:text;background-clip:text}
.fpb .card .wm .t{color:var(--amethyst);font-size:26px}.fpb .card .wm .b{color:var(--orchid);font-size:clamp(40px,4.4vw,60px)}
/* closing */
.fpb .portal{position:relative;overflow:hidden;isolation:isolate;text-align:center}
.fpb .portal .orbit{position:absolute;left:50%;top:50%;width:min(900px,140vw);transform:translate(-50%,-50%);color:var(--amethyst);opacity:.3;z-index:-1;animation:fp-spin2 90s linear infinite}
@keyframes fp-spin2{to{transform:translate(-50%,-50%) rotate(360deg)}}
.fpb .lines p{font:italic 400 clamp(22px,2.6vw,32px)/1.35 var(--font-display);color:var(--pearl);margin:0 0 6px}
.fpb .lines p:nth-child(even){color:var(--flilac)}
.fpb .portal h2{font-size:clamp(54px,8vw,120px);line-height:1}
@media (max-width:980px){.fpb .hero-grid,.fpb .evo,.fpb .fp-grid{grid-template-columns:minmax(0,1fr)}.fpb .sphere{max-width:260px}}
@media (max-width:600px){.fpb .index li{grid-template-columns:56px minmax(0,1fr);gap:12px}.fpb .index li::before{font-size:32px}}
@media (prefers-reduced-motion:reduce){.fpb .orbit,.fpb .portal .orbit{animation:none}}
</style>'''

WM = '<p class="wm" aria-label="The Futureproof Blogger"><span class="t">The</span><span class="f">FUTUREPROOF</span><span class="b">Blogger.</span></p>'
