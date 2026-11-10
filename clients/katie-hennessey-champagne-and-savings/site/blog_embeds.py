"""Zero-JS embeds for the Showit BLOG templates (playbook phase 9: blog template embeds get no JavaScript).
Everything is scoped under .csb so it can't restyle the WordPress post content around it."""
from builder import L, FONTS, COUPE, OUT, TXT
import os

CSS = r"""<style>
.csb{--petal:#F7EAEB;--linen:#F0E7E2;--pink:#E6CECE;--rose:#A47E82;--bord:#5E3F44;--truffle:#3E3333;--gold:#C8AD86;--white:#FFFDFC;
--display:'Italiana',Georgia,serif;--serif:'Cormorant Garamond',Georgia,serif;--sans:'Jost',system-ui,sans-serif;--script:'Mrs Saint Delafield',cursive;
font-family:var(--serif);font-weight:500;font-size:20px;line-height:1.55;color:var(--truffle);-webkit-font-smoothing:antialiased;overflow:hidden;width:100%}
.csb *{box-sizing:border-box}.csb a{color:inherit}.csb p{margin:0 0 1em}
.csb .wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.csb h1,.csb h2,.csb h3{font-family:var(--display);font-weight:400;line-height:1.12;margin:0 0 .4em;color:var(--truffle);letter-spacing:.015em;text-transform:none}
.csb .eyebrow{font-family:var(--sans);font-weight:500;font-size:12.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--bord);display:block;margin-bottom:14px}
.csb .btn{display:inline-block;font-family:var(--sans);font-weight:500;font-size:13px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;background:var(--bord);color:var(--petal);padding:18px 32px;border-radius:60px;border:0;line-height:1.3;text-align:center}
.csb .btn:hover{background:var(--truffle)}
.csb .ann{background:var(--bord);color:var(--petal);font-family:var(--sans);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;overflow:hidden}
.csb .ann a{display:block;text-decoration:none;padding:11px 0}.csb .ann .track{display:flex;width:max-content}.csb .ann span{padding:0 28px;white-space:nowrap}
@media (prefers-reduced-motion:no-preference){.csb .ann .track{animation:csbm 34s linear infinite}}@keyframes csbm{to{transform:translateX(-50%)}}
.csb .nav{background:var(--petal);border-bottom:1px solid rgba(164,126,130,.22);position:relative}.csb .nav .wrap{display:flex;align-items:center;justify-content:space-between;height:78px;gap:20px}
.csb .logo{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-family:var(--display);font-size:23px;letter-spacing:.14em;white-space:nowrap}
.csb .logo em{font-family:var(--script);font-style:normal;font-size:40px;letter-spacing:0;color:var(--rose);line-height:0;transform:translateY(4px)}
.csb .links{display:flex;gap:26px;align-items:center;list-style:none;margin:0;padding:0}.csb .links a{font-family:var(--sans);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;white-space:nowrap}
.csb .links .btn{padding:13px 20px;font-size:12px}
.csb .mtog{display:none}.csb .burger{display:none;width:46px;height:46px;cursor:pointer;position:relative}
.csb .burger i{position:absolute;left:11px;right:11px;height:1.6px;background:var(--truffle)}.csb .burger i:nth-child(1){top:17px}.csb .burger i:nth-child(2){top:23px}.csb .burger i:nth-child(3){top:29px}
@media (max-width:1080px){.csb .burger{display:block}.csb .links{display:none;position:absolute;top:78px;left:0;right:0;background:var(--petal);flex-direction:column;align-items:flex-start;gap:0;padding:10px 24px 26px;z-index:40;box-shadow:0 30px 40px -30px rgba(94,63,68,.5)}
.csb .links li{width:100%;border-bottom:1px solid rgba(164,126,130,.25)}.csb .links li a:not(.btn){display:block;padding:14px 0;font-family:var(--display);font-size:28px;letter-spacing:.02em;text-transform:none}
.csb .links li:last-child{border:0;padding-top:16px}.csb .mtog:checked~.links{display:flex}}
.csb .hero{background:var(--linen);padding:70px 0 60px;text-align:center;position:relative}.csb .hero h1{font-size:clamp(40px,5.4vw,72px)}
.csb .hero p{max-width:620px;margin:0 auto 26px;font-size:clamp(20px,2vw,23px)}
.csb .pills{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}.csb .pills a{font-family:var(--sans);font-size:12px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;background:var(--white);color:var(--bord);padding:11px 18px;border-radius:40px;box-shadow:0 10px 24px -14px rgba(94,63,68,.5)}
.csb .pills a:hover{background:var(--bord);color:var(--petal)}
.csb .start{background:var(--petal);padding:56px 0}.csb .start h2{text-align:center;font-size:clamp(30px,3vw,42px)}
.csb .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:26px}.csb .cards a{display:block;text-decoration:none;background:var(--white);border-radius:24px;padding:30px 26px;box-shadow:0 30px 60px -34px rgba(94,63,68,.45)}
.csb .cards b{display:block;font-family:var(--display);font-weight:400;font-size:25px;line-height:1.2;margin-bottom:10px}.csb .cards span{font-family:var(--sans);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--rose)}
.csb .optin{background:var(--pink);padding:44px 0}.csb .optin .wrap{display:flex;align-items:center;justify-content:space-between;gap:30px}.csb .optin h2{font-size:clamp(28px,3vw,40px);margin:0 0 6px}.csb .optin p{margin:0}
.csb .coupe{width:70px;flex:0 0 70px;color:var(--truffle)}.csb .coupe .bow{color:var(--rose)}.csb .coupe .bub{fill:var(--gold)}
.csb .box{background:var(--bord);color:var(--petal);border-radius:28px;padding:40px 36px;display:flex;align-items:center;gap:28px;margin:40px 0}.csb .box h2{color:var(--petal);font-size:clamp(28px,3vw,38px)}
.csb .box .btn{background:var(--petal);color:var(--bord)}.csb .box .coupe{color:var(--petal)}.csb .box .coupe .bow{color:var(--pink)}
.csb .foot{background:var(--truffle);color:var(--petal);padding:60px 0 30px}.csb .foot .cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:30px}
.csb .foot h4{font-family:var(--sans);font-weight:500;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin:0 0 14px}
.csb .foot ul{list-style:none;padding:0;margin:0}.csb .foot li{margin-bottom:8px}.csb .foot a{text-decoration:none;opacity:.88}.csb .foot .sign{font-family:var(--script);font-size:50px;color:var(--pink);line-height:1}
.csb .foot .bottom{margin-top:40px;padding-top:20px;border-top:1px solid rgba(247,234,235,.16);font-family:var(--sans);font-size:12.5px;opacity:.8;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media (max-width:800px){.csb .cards,.csb .foot .cols{grid-template-columns:1fr}.csb .optin .wrap,.csb .box{flex-direction:column;text-align:center}.csb .logo{font-size:17px;letter-spacing:.1em}.csb .logo em{font-size:32px}}
</style>"""

LOGO = f'<a class="logo" href="{L["home"]}" aria-label="Champagne and Savings home">CHAMPAGNE<em>&amp;</em>SAVINGS</a>'
ANN = '<div class="ann"><a href="' + L['match'] + '"><div class="track">' + ''.join('<span>Free quiz: find the colors in your closet that already go together ✦ Get 5 outfits you can wear this week →</span>' for _ in range(4)) + '</div></a></div>'
NAV = (f'<header class="nav"><div class="wrap">{LOGO}<input type="checkbox" id="csb-m" class="mtog" aria-label="Open menu"><label for="csb-m" class="burger" aria-hidden="true"><i></i><i></i><i></i></label>'
       f'<ul class="links"><li><a href="{L["about"]}">About</a></li><li><a href="{L["club"]}">The Club</a></li><li><a href="{L["blog"]}">Blog</a></li><li><a href="{L["shop"]}">Shop</a></li><li><a class="btn" href="{L["match"]}">Find my colors</a></li></ul></div></header>')
CATS = [("Capsule Wardrobes","/blog/category/Capsule+Wardrobe"),("Mom Style","#"),("Outfit Formulas","#"),("Trend Reports","#"),("Beauty","/beauty"),("Gift Guides","/gift-guides")]
START = [("How to Build a Capsule Wardrobe Without Becoming a Minimalist","/blog/how-to-build-a-capsule-wardrobe"),
         ("9 Easy Outfit Formulas With Items You Probably Already Own","/blog/outfit-formulas"),
         ("How to Always Look Put Together (Even if You're a Hot Mess)","/blog/how-to-look-put-together")]

header = (FONTS + CSS + '<div class="csb">' + ANN + NAV +
  '<section class="hero"><div class="wrap"><span class="eyebrow">The blog</span><h1>Cute outfits for real mom life</h1>'
  '<p>Capsules, outfit formulas, and honest trend talk for moms who want to look current on a real budget.</p><div class="pills">' +
  ''.join(f'<a href="{u}">{n}</a>' for n,u in CATS) + '</div></div></section>'
  '<section class="start"><div class="wrap"><h2>Start here</h2><div class="cards">' +
  ''.join(f'<a href="{u}"><span>Read the post</span><b>{t}</b></a>' for t,u in START) + '</div></div></section>'
  f'<section class="optin"><div class="wrap">{COUPE}<div style="flex:1"><h2>Not sure what goes with what?</h2><p>Take the free Mom Color Match and get 5 outfits from clothes you already own.</p></div><a class="btn" href="{L["match"]}">Show me my colors</a></div></section></div>')

post_cta = (FONTS + CSS + f'<div class="csb"><div class="box">{COUPE}<div style="flex:1"><h2>Want a closet where everything goes together?</h2>'
  f'<p>The Cute Capsule Club helps you build a capsule from what you already own, and get dressed in 5 minutes.</p><a class="btn" href="{L["club"]}">Start my Closet Reset</a></div></div></div>')

foot = (FONTS + CSS + '<div class="csb"><footer class="foot"><div class="wrap"><div class="cols"><div><p style="max-width:330px">Trendy but classic style for millennial moms on a real budget. Champagne taste, real-life savings.</p><div class="sign">xo, Katie</div></div>' +
  '<div><h4>Explore</h4><ul>' + ''.join(f'<li><a href="{L[k]}">{n}</a></li>' for n,k in [("Home","home"),("About","about"),("The Club","club"),("Shop","shop"),("Free Color Match","match")]) + '</ul></div>' +
  '<div><h4>The fine print</h4><ul>' + ''.join(f'<li><a href="{L[k]}">{n}</a></li>' for n,k in [("Contact","contact"),("Privacy Policy","privacy"),("Terms","terms"),("Affiliate Disclosure","affiliate")]) + '</ul></div></div>'
  '<div class="bottom"><span>© 2026 Champagne &amp; Savings</span><span>Some links are affiliate links. I may earn a small commission at no extra cost to you.</span></div></div></footer></div>')

for name, html in [('blog-header-embed.html', header), ('blog-post-cta-embed.html', post_cta), ('blog-footer-embed.html', foot)]:
    open(os.path.join(OUT, name), 'w').write(html); open(os.path.join(TXT, name.replace('.html','.txt')), 'w').write(html)
print('built blog embeds')
