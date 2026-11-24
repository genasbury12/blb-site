import html
P='/home/user/blb-site/site/_pages/academy.html'
def e(t): return html.escape(t,quote=False).replace("'","&rsquo;")
ARR='<i aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"><path d="M3 11L11 3M5 3h6v6"></path></svg></i>'
def btn(label,href,cls=''): return f'<a class="ac-btn {cls}" href="{href}">{e(label)} {ARR}</a>'
def slot(t,dark=False): return f'<span class="ac-slot{" dk" if dark else ""}">{e(t)}</span>'
CATS=[("business","Business & Monetization","Business","Develop profitable business models, discover valuable offer opportunities and create products people have a genuine reason to purchase."),
("branding","Branding & Messaging","Branding","Understand your audience, communicate your value and build a brand people actively seek out."),
("marketing","Marketing & Audience Growth","Marketing","Attract potential customers, create demand for your offers and build meaningful relationships with your audience."),
("sales","Sales & Buyer Psychology","Sales","Understand what influences purchasing decisions and learn how to turn interested readers into paying customers."),
("ai","AI & Productivity","AI","Use artificial intelligence to organize your business, implement strategies, create innovative products and accomplish more with your available time."),
("websites","Website & Conversion","Websites","Build a strategic online presence that communicates your value, supports your offers and helps visitors become customers."),
("future","The Future of Blogging","Future of Blogging","Understand emerging technology, changing consumer behavior and the evolving blogging industry so you can make informed decisions about your business.")]
COURSES=[("futureproof","The Futureproof Blogger","Business strategy & the future of blogging",["business","future"],"#A23E66",
 "What happens when the blogging strategies you've been relying on stop working?",
 ["AI is changing how people discover information, consume content and make purchasing decisions. Learn how to adapt your blogging business, rethink traditional monetization strategies and create value that goes beyond publishing information.","Inside, you'll explore how to build a business that doesn't depend entirely on Google, pageviews or outdated blogging strategies."],
 "Understand where blogging is headed and what your business needs to become."),
("pbm","The Productive Blogger Method","AI & business productivity",["ai"],"#3A1C2A",
 "Stop spending your working hours figuring out what you're supposed to be working on.",
 ["You have business goals, endless ideas, unfinished projects and approximately a hundred things you think you should be doing.","Learn how to use Claude to turn your business strategies into organized projects, personalized action plans and a practical implementation system built around your business.","Know what to work on, what needs to happen first and how to turn your ideas into completed projects without drowning in complicated productivity tools."],
 "Spend less time managing your business and more time actually building it."),
("interactive","The Interactive Course Creator","AI & digital product creation",["ai","business"],"#E9B9CA",
 "What if your next online course was something your customers could actually interact with instead of just watch?",
 ["Discover how to use Claude to transform your knowledge into interactive educational experiences that go beyond traditional video lessons, static workbooks and downloadable PDFs.","Learn a new approach to course creation that encourages active participation, engagement and implementation.","Explore what's possible when artificial intelligence meets digital education, and rethink how you package and deliver your expertise."],
 "Because the future of online courses doesn't have to look like another dashboard filled with prerecorded videos.")]
o=[]
o.append('''<style>
/* The BOSS Academy storefront. A calm editorial shop: plum hero with a stack of course "books", category tiles,
   a filterable course library, the All Access collection, a course finder and the three ways to work together. */
.ac{--plum:#3A1C2A;--berry:#A23E66;--rose:#E9B9CA;--blush:#F6E1E8;--cream:#FBF5EE;--cocoa:#4A2F3B;--mauve:#6E4B5B;--pop:#F6C9D8}
.ac section{padding:clamp(72px,9vw,120px) clamp(16px,4vw,48px)}
.ac .in{max-width:1180px;margin:0 auto}
.ac .nar{max-width:780px;margin:0 auto}
.ac .lbl{margin:0;font:500 12px/1.4 var(--font-label);letter-spacing:.2em;text-transform:uppercase;color:var(--berry)}
.ac .dk .lbl{color:var(--rose)}
.ac h1,.ac h2,.ac h3{margin:0;font-family:var(--font-display);font-weight:400;letter-spacing:-.015em;text-wrap:balance;color:var(--plum)}
.ac h2{font-size:clamp(38px,5vw,64px);line-height:1.02}
.ac h2 em,.ac h1 em{color:var(--berry)}
.ac .dk h1,.ac .dk h2,.ac .dk h3{color:var(--cream)}
.ac .dk h1 em,.ac .dk h2 em{color:var(--pop)}
.ac p{margin:0}
.ac .body{font:400 18px/1.7 var(--font-body);color:var(--cocoa)}
.ac .dk .body{color:#F1DDE2}
.ac .big{font:400 clamp(24px,3vw,34px)/1.25 var(--font-display);color:var(--plum)}
.ac .dk .big{color:var(--cream)}
.ac .it{font-style:italic;color:var(--berry)}
.ac .dk .it{color:var(--pop)}
.ac .stack{display:flex;flex-direction:column;gap:20px}
.ac .ac-btn{display:inline-flex;align-items:center;gap:12px;min-height:54px;padding:8px 10px 8px 24px;border-radius:999px;background:var(--plum);color:#fff;font:600 15.5px/1.2 var(--font-body);text-decoration:none;border:0;cursor:pointer;transition:transform .2s ease,background .2s ease}
.ac .ac-btn i{flex:none;width:36px;height:36px;border-radius:999px;background:var(--berry);display:grid;place-items:center;transition:transform .2s ease}
.ac .ac-btn.cr{background:var(--cream);color:var(--plum)}
.ac .ac-btn.br{background:var(--berry)}.ac .ac-btn.br i{background:var(--plum)}
.ac .ac-btn.gh{background:transparent;color:var(--cream);border:1.5px solid rgba(233,185,202,.55)}
.ac .ac-btn.gh i{background:var(--pop)}.ac .ac-btn.gh i svg{stroke:#3A1C2A}
.ac .ac-btn.ol{background:transparent;color:var(--plum);border:1.5px solid var(--plum)}
@media (hover:hover){.ac .ac-btn:hover{transform:translateY(-2px)}.ac .ac-btn:hover i{transform:rotate(45deg)}}
.ac .ac-btn:focus-visible,.ac .flt button:focus-visible,.ac summary:focus-visible{outline:3px solid var(--berry);outline-offset:3px}
.ac .ac-slot{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:2px dashed var(--berry);border-radius:12px;font:500 12px/1.3 var(--font-label);letter-spacing:.1em;text-transform:uppercase;color:var(--berry);background:rgba(162,62,102,.05)}
.ac .ac-slot.dk{border-color:var(--pop);color:var(--pop)}

/* hero */
.ac .hero{background:var(--plum);position:relative;overflow:hidden;isolation:isolate}
.ac .hero::before{content:"";position:absolute;left:-10%;bottom:-40%;width:70vw;height:70vw;max-width:760px;max-height:760px;border-radius:50%;background:radial-gradient(circle,rgba(162,62,102,.5),rgba(162,62,102,0) 65%);z-index:-1}
.ac .hero-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(36px,5vw,72px);align-items:center}
.ac .hero h1{font-size:clamp(48px,7vw,104px);line-height:.94;letter-spacing:-.025em}
.ac .hero .sub{font:400 italic clamp(22px,2.6vw,30px)/1.3 var(--font-display);color:var(--pop)}
.ac .ctas{display:flex;flex-wrap:wrap;gap:12px}
.ac .books{position:relative;height:420px}
.ac .book{position:absolute;left:50%;width:min(300px,78%);aspect-ratio:3/4;border-radius:10px 18px 18px 10px;padding:26px 24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:-10px 0 0 rgba(0,0,0,.18) inset,0 30px 60px -24px rgba(0,0,0,.7)}
.ac .book small{font:500 10.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase;opacity:.85}
.ac .book b{font:400 clamp(26px,2.6vw,34px)/1.02 var(--font-display);font-weight:400}
.ac .book.b1{background:#E9B9CA;color:#3A1C2A;transform:translateX(-78%) rotate(-10deg);top:40px}
.ac .book.b2{background:#FBF5EE;color:#3A1C2A;transform:translateX(-50%) rotate(-1deg);top:6px;z-index:2}
.ac .book.b3{background:#A23E66;color:#fff;transform:translateX(-22%) rotate(9deg);top:46px;z-index:3}

/* intro */
.ac .intro{background:var(--cream)}
.ac .learn{margin-top:28px;padding:26px 28px;border-radius:24px;background:#fff;text-align:center;font:400 italic clamp(24px,2.8vw,32px)/1.3 var(--font-display);color:var(--berry);box-shadow:0 20px 44px -34px rgba(58,28,42,.6)}

/* categories */
.ac .cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.ac .cat.feat{grid-column:span 2}
@media (max-width:1000px){.ac .cats{grid-template-columns:repeat(2,minmax(0,1fr))}.ac .cat.feat{grid-column:span 2}}
@media (max-width:600px){.ac .cats{grid-template-columns:minmax(0,1fr)}.ac .cat.feat{grid-column:auto}}
.ac .cat{background:#fff;border-radius:24px;padding:26px;display:flex;flex-direction:column;gap:12px;border:1.5px solid transparent;transition:border-color .2s ease,transform .2s ease}
@media (hover:hover){.ac .cat:hover{border-color:var(--rose);transform:translateY(-3px)}}
.ac .cat .n{font:500 12px/1 var(--font-label);letter-spacing:.14em;color:var(--berry)}
.ac .cat h3{font-size:28px;line-height:1.08}
.ac .cat p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.ac .cat button{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0;background:none;border:0;cursor:pointer;font:600 15px/1.2 var(--font-body);color:var(--berry);text-decoration:underline;text-underline-offset:5px}
.ac .cat.feat{background:var(--plum)}
.ac .cat.feat h3{color:var(--cream)}.ac .cat.feat p{color:#F1DDE2}.ac .cat.feat button{color:var(--pop)}.ac .cat.feat .n{color:var(--pop)}

/* library */
.ac .lib{background:var(--blush)}
.ac .flt{position:sticky;top:76px;z-index:5;display:flex;gap:8px;overflow-x:auto;padding:12px;margin:0 -12px 26px;scrollbar-width:none;background:var(--blush)}
.ac .flt::-webkit-scrollbar{display:none}
.ac .flt button{flex:none;min-height:44px;padding:0 18px;border-radius:999px;border:1.5px solid var(--rose);background:#fff;color:var(--plum);font:500 12px/1 var(--font-label);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
.ac .flt button[aria-pressed="true"]{background:var(--plum);border-color:var(--plum);color:var(--cream)}
.ac .courses{display:grid;gap:22px}
.ac .course{display:grid;grid-template-columns:minmax(0,.62fr) minmax(0,1.38fr);gap:clamp(22px,4vw,52px);background:#fff;border-radius:30px;padding:clamp(22px,3.6vw,40px);box-shadow:0 26px 54px -44px rgba(58,28,42,.7)}
.ac .course[hidden]{display:none}
.ac .cover{aspect-ratio:3/4;border-radius:10px 20px 20px 10px;padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;justify-content:space-between;box-shadow:-10px 0 0 rgba(0,0,0,.16) inset,0 24px 44px -26px rgba(58,28,42,.8);align-self:start}
.ac .cover small{font:500 10.5px/1.4 var(--font-label);letter-spacing:.16em;text-transform:uppercase}
.ac .cover b{font:400 clamp(30px,3.4vw,44px)/1 var(--font-display);font-weight:400}
.ac .course .meta{display:flex;flex-direction:column;gap:14px}
.ac .course h3{font-size:clamp(32px,3.6vw,46px);line-height:1.02}
.ac .course .hook{font:400 italic clamp(21px,2.2vw,26px)/1.3 var(--font-display);color:var(--berry)}
.ac .course .body{font-size:16.5px}
.ac .course .close{font:600 16.5px/1.5 var(--font-body);color:var(--plum)}
.ac .course .buy{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:6px}
.ac .empty{background:#fff;border-radius:24px;padding:30px;text-align:center;font:400 22px/1.3 var(--font-display);color:var(--plum)}

/* all access */
.ac .aa{background:var(--plum)}
.ac .aa-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(26px,5vw,64px);align-items:center}
.ac .aa-box{position:relative;background:var(--cream);border-radius:30px;padding:clamp(26px,4vw,44px);display:flex;flex-direction:column;gap:16px}
.ac .aa-box h3{font-size:clamp(32px,3.6vw,44px);color:var(--plum)}
.ac .ticks{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ac .ticks li{position:relative;padding:12px 16px 12px 48px;border-radius:14px;background:#fff;font:500 16px/1.5 var(--font-body);color:var(--plum)}
.ac .ticks li::before{content:"";position:absolute;left:14px;top:13px;width:22px;height:22px;border-radius:7px;background:var(--berry) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 12.5l4 4L18 8' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/16px no-repeat}
.ac .wants{display:flex;flex-direction:column;gap:10px}
.ac .wants p{padding:14px 18px;border-radius:16px;border:1.5px solid rgba(233,185,202,.3);font:400 clamp(20px,2.2vw,24px)/1.3 var(--font-display);color:var(--cream)}

/* finder */
.ac .finder{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.ac .fc{background:#fff;border-radius:26px;padding:28px;display:flex;flex-direction:column;gap:12px}
.ac .fc .q{font:400 clamp(24px,2.6vw,30px)/1.15 var(--font-display);color:var(--plum)}
.ac .fc .q::before{content:"\\201C";color:var(--berry)}
.ac .fc .q::after{content:"\\201D";color:var(--berry)}
.ac .fc p.d{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.ac .fc .s{font:600 16px/1.5 var(--font-body);color:var(--berry)}
.ac .fc .ac-btn{margin-top:auto;align-self:flex-start}
.ac .fc.all{background:var(--berry)}
.ac .fc.all .q,.ac .fc.all p.d,.ac .fc.all .s{color:#fff}
.ac .fc.all .q::before,.ac .fc.all .q::after{color:var(--pop)}

/* philosophy */
.ac .phil{background:var(--cream)}
.ac .chg{display:grid;gap:12px;margin:8px 0}
.ac .chg p{padding:16px 20px;border-left:3px solid var(--berry);background:#fff;border-radius:0 16px 16px 0;font:500 17px/1.5 var(--font-body);color:var(--plum)}
.ac .keep{padding:clamp(22px,4vw,36px);border-radius:26px;background:var(--plum);font:400 clamp(22px,2.6vw,30px)/1.3 var(--font-display);color:var(--cream)}

/* meet */
.ac .meet{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:clamp(30px,5vw,72px);align-items:center}
.ac .arch{aspect-ratio:3/4;border-radius:999px 999px 26px 26px;overflow:hidden;border:10px solid #fff;box-shadow:0 40px 80px -40px rgba(58,28,42,.7);max-width:400px}
.ac .arch img{width:100%;height:100%;object-fit:cover;object-position:50% 22%;display:block}
.ac .loves{display:flex;flex-wrap:wrap;gap:8px}
.ac .loves span{padding:10px 16px;border-radius:999px;background:var(--blush);font:500 14.5px/1.3 var(--font-body);color:var(--plum)}

/* three ways */
.ac .ways{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.ac .way{border-radius:28px;padding:30px 26px;display:flex;flex-direction:column;gap:14px;background:#fff}
.ac .way.mid{background:var(--berry)}
.ac .way.top{background:var(--plum)}
.ac .way h3{font-size:clamp(28px,2.8vw,34px);line-height:1.05}
.ac .way.mid h3,.ac .way.top h3{color:#fff}
.ac .way p{font:400 16px/1.6 var(--font-body);color:var(--cocoa)}
.ac .way.mid p,.ac .way.top p{color:#F6E1E8}
.ac .way .for{font:500 11.5px/1.4 var(--font-label);letter-spacing:.14em;text-transform:uppercase;color:var(--berry)}
.ac .way.mid .for,.ac .way.top .for{color:var(--pop)}
.ac .way .price{font:400 40px/1 var(--font-display);color:#fff}
.ac .way .ac-btn{margin-top:auto;align-self:flex-start}

/* faq */
.ac .faqs{background:var(--plum)}
.ac .faq{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.ac .faq details{border:1.5px solid rgba(246,225,232,.35);border-radius:24px;padding:6px 24px}
.ac .faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:56px;font:600 16.5px/1.35 var(--font-body);color:var(--cream);cursor:pointer;list-style:none}
.ac .faq summary::-webkit-details-marker{display:none}
.ac .faq .faq-plus{flex:none;font:400 26px/1 var(--font-body);color:var(--rose);transition:transform .2s ease}
.ac .faq details[open] .faq-plus{transform:rotate(45deg)}
.ac .faq-a{padding:0 0 18px}
.ac .faq-a p{font:400 16px/1.65 var(--font-body);color:#F0DCE3}
.ac .faq-a p+p{margin-top:10px}

/* final */
.ac .final{background:var(--cream);text-align:center}
.ac .mores{display:flex;flex-direction:column;gap:6px;margin:10px 0}
.ac .mores p{font:400 clamp(22px,2.6vw,30px)/1.3 var(--font-display);color:var(--plum)}
.ac .mores p:nth-child(even){color:var(--berry)}
.ac .sign{margin-top:46px;padding-top:34px;border-top:1.5px solid var(--rose);display:flex;flex-direction:column;gap:8px;align-items:center}
.ac .sign b{font:400 clamp(30px,3.4vw,42px)/1 var(--font-display);font-weight:400;letter-spacing:.06em;color:var(--plum)}
.ac .sign span{font:500 12px/1.5 var(--font-label);letter-spacing:.16em;text-transform:uppercase;color:var(--mauve)}

@media (max-width:900px){
 .ac .hero-grid,.ac .aa-card,.ac .meet{grid-template-columns:minmax(0,1fr)}
 .ac .books{height:360px;max-width:420px;margin:0 auto;width:100%}
 .ac .ways{grid-template-columns:minmax(0,1fr)}
}
@media (max-width:700px){
 .ac .course{grid-template-columns:minmax(0,1fr)}
 .ac .cover{max-width:240px;aspect-ratio:4/5}
 .ac .finder{grid-template-columns:minmax(0,1fr)}
 .ac .books{height:300px}
 .ac .flt{top:64px}
}
@media (prefers-reduced-motion:reduce){.ac *{transition:none!important}}
</style>
<main id="main" class="ac">''')
# hero
o.append(f'''<section class="hero dk"><div class="in hero-grid">
<div class="stack" style="gap:24px">
<p class="lbl">Welcome to the BOSS Academy</p>
<h1>Business education for a new era of <em>blogging.</em></h1>
<p class="sub">The internet is changing. The way people buy is changing. And the way we build profitable blogging businesses needs to change with it.</p>
<p class="body">Master modern business strategies, buyer psychology, marketing, artificial intelligence and the skills you need to build a business that remains valuable as the digital world evolves.</p>
<p class="body" style="color:#FBF5EE;font-weight:600">Shop individual courses or unlock the complete BOSS Academy collection.</p>
<div class="ctas">{btn("Shop All Courses","#library","cr")}{btn("Explore All Access","#all-access","gh")}</div>
</div>
<div class="books" aria-hidden="true">
<div class="book b1"><small>BOSS Academy</small><b>The Productive Blogger Method</b><small>AI &amp; business productivity</small></div>
<div class="book b2"><small>BOSS Academy</small><b>The Futureproof Blogger</b><small>The future of blogging</small></div>
<div class="book b3"><small>BOSS Academy</small><b>The Interactive Course Creator</b><small>AI &amp; digital products</small></div>
</div></div></section>''')
# intro
o.append(f'''<section class="intro"><div class="nar stack" style="text-align:center;align-items:center">
<h2>Become more than a blogger. <em>Become a better business owner.</em></h2>
<p class="body">You don&rsquo;t need another course teaching you how to publish more blog posts, chase pageviews or keep up with another social media algorithm.</p>
<p class="big">You need to understand how businesses make money, why people buy, what makes an offer valuable and how to use modern technology to bring your ideas to life.</p>
<p class="body">The BOSS Academy is an expanding collection of specialized courses designed to help ambitious women develop those skills.</p>
<p class="learn">Learn what your business needs today. Return for what it needs tomorrow.</p>
</div></section>''')
# categories
cards=''.join(f'<article class="cat{" feat" if k=="future" else ""}"><span class="n">{i+1:02d}</span><h3>{e(t)}</h3><p>{e(d)}</p><button type="button" data-go="{k}">Explore Courses <span aria-hidden="true">&#8594;</span></button></article>' for i,(k,t,_,d) in enumerate(CATS))
o.append(f'''<section style="background:#FFFFFF"><div class="in stack" style="gap:34px">
<div class="nar stack" style="text-align:center;gap:12px"><p class="lbl">Shop by Category</p><h2>What do you want to <em>master?</em></h2></div>
<div class="cats">{cards}</div></div></section>''')
# library
flt='<button type="button" data-f="all" aria-pressed="true">All Courses</button>'+''.join(f'<button type="button" data-f="{k}" aria-pressed="false">{e(s)}</button>' for k,_,s,_ in CATS)
cc=''
for slug,name,tag,cats,col,hook,ps,close in COURSES:
    fg='#3A1C2A' if col in ('#E9B9CA',) else '#FFFFFF'
    cc+=f'''<article class="course" id="course-{slug}" data-cats="{' '.join(cats)}">
<div class="cover" style="background:{col};color:{fg}"><small>The BOSS Academy</small><b>{e(name)}</b><small>{e(tag)}</small></div>
<div class="meta"><p class="lbl">{e(tag)}</p><h3>{e(name)}</h3><p class="hook">{e(hook)}</p>{''.join(f'<p class="body">{e(p)}</p>' for p in ps)}<p class="close">{e(close)}</p>
<div class="buy">{slot("Course price")}{btn("Explore "+name,"#course-"+slug)}</div></div></article>'''
o.append(f'''<section class="lib" id="library" style="scroll-margin-top:70px"><div class="in">
<div class="nar stack" style="text-align:center;gap:14px;margin-bottom:30px"><p class="lbl">Explore the Course Library</p><h2>Specialized business education. Practical strategies. <em>Skills you can put to work.</em></h2><p class="body">Purchase the courses you need, when you need them.</p></div>
<div class="flt" role="group" aria-label="Filter courses by category">{flt}</div>
<div class="courses">{cc}<p class="empty" data-empty hidden>More courses are coming to this category. In the meantime, explore <button type="button" data-f="all" style="background:none;border:0;padding:0;font:inherit;color:#A23E66;text-decoration:underline;cursor:pointer">all courses</button>.</p></div>
</div></section>''')
# all access
wants=["You want to understand where blogging is headed.","You want to master AI.","You want to create better products, understand why people buy, strengthen your marketing and become more strategic about the business you're building."]
inc=["Access every included BOSS Academy course.","Explore business, marketing, sales, AI, branding and digital product creation.","Learn at your own pace.","Access applicable course frameworks, tools and resources.","Develop new skills as your business needs evolve."]
o.append(f'''<section class="aa dk" id="all-access" style="scroll-margin-top:70px"><div class="in aa-card">
<div class="stack">
<p class="lbl">The complete educational collection</p>
<h2>Why stop at <em>just one course?</em></h2>
<div class="wants">{''.join(f'<p>{e(w)}</p>' for w in wants)}</div>
<p class="body">And as your business evolves, there will always be something new you want to learn.</p>
<p class="big">Instead of purchasing every course individually, unlock the complete educational collection with The BOSS Academy All Access.</p>
</div>
<div class="aa-box"><span class="ac-slot" style="align-self:flex-start">All Access price</span>
<h3>The BOSS Academy All Access</h3>
<p style="font:400 italic 22px/1.35 var(--font-display);color:#A23E66">One investment. An entire collection of specialized business education.</p>
<ul class="ticks">{''.join(f'<li>{e(i)}</li>' for i in inc)}</ul>
<p class="body" style="font-size:16px">Whether you&rsquo;re reinventing your business strategy, developing innovative digital products or learning how to operate your business more efficiently, you&rsquo;ll have a collection of specialized education to return to.</p>
{btn("Explore BOSS Academy All Access","/all-access/","br")}
</div></div></section>''')
# finder
fd=[("I'm worried about where blogging is headed.","You're questioning whether traditional blogging strategies will continue working and want to understand how to build a business that can adapt to AI and the changing internet.","Start with The Futureproof Blogger.","#course-futureproof","Explore Course",""),
("I have too many ideas and don't know how to get everything done.","You know there's work that needs to happen in your business, but you're overwhelmed by scattered information, unfinished projects and competing priorities.","Start with The Productive Blogger Method.","#course-pbm","Explore Course",""),
("I want to create digital products that stand out.","You want to turn your knowledge into something more valuable and engaging than another static ebook, PDF or traditional online course.","Start with The Interactive Course Creator.","#course-interactive","Explore Course",""),
("I want to learn all of it.","You're serious about developing your business skills and want access to the complete specialized course collection.","Explore The BOSS Academy All Access.","#all-access","Explore All Access","all")]
fh=''.join(f'<article class="fc {c}"><p class="q">{e(q)}</p><p class="d">{e(d)}</p><p class="s">{e(s)}</p>{btn(b,h,"cr" if c else "")}</article>' for q,d,s,h,b,c in fd)
o.append(f'''<section style="background:#F6E1E8"><div class="in stack" style="gap:30px">
<div class="nar stack" style="text-align:center;gap:12px"><p class="lbl">Not sure which course you need?</p><h2>Start with the problem <em>you&rsquo;re trying to solve.</em></h2></div>
<div class="finder">{fh}</div></div></section>''')
# philosophy
chg=["The tools you use today might not be the tools you use three years from now.","The platforms that currently bring you traffic might not always perform the same way.","The products people purchase, the content they consume and the expectations they have of online businesses will continue to evolve."]
o.append(f'''<section class="phil"><div class="nar stack">
<h2>The internet will keep changing. <em>Keep learning.</em></h2>
<div class="chg">{''.join(f'<p>{e(c)}</p>' for c in chg)}</div>
<p class="keep">But understanding how to identify customer needs, create meaningful value, communicate effectively, sell strategically and adapt to change will remain valuable.</p>
<p class="big">That&rsquo;s the philosophy behind The BOSS Academy.</p>
<p class="body">I&rsquo;m not interested in teaching you strategies that only work under one set of circumstances.</p>
<p class="body">I want to help you become the kind of business owner who understands how to make informed decisions, recognize new opportunities and continue building as the industry changes.</p>
<p class="big it">Because your business education shouldn&rsquo;t end when you finish a course.</p>
</div></section>''')
# meet
loves=["Studying how people make purchasing decisions.","Experimenting with AI.","Developing new business frameworks.","Exploring technology.","Challenging traditional blogging advice."]
o.append(f'''<section style="background:#FFFFFF"><div class="in meet">
<div class="arch"><img src="/images/photos/desk-mic-smile.jpg" alt="Genasys smiling at her desk with her microphone" loading="lazy"></div>
<div class="stack">
<p class="lbl">Meet the woman behind The BOSS Academy</p>
<h2>Hi, I&rsquo;m <em>Genasys.</em></h2>
<p class="body" style="color:#3A1C2A;font-weight:600">Founder of Boss Lady Bloggers, blogging business coach, Showit website designer and a slightly obsessive student of business, buyer psychology and emerging technology.</p>
<p class="body">I built my money making business from my aunt&rsquo;s basement during my son&rsquo;s nap times.</p>
<p class="body">Since then, I&rsquo;ve helped women develop their businesses, create offers, establish their brands, design professional websites and understand how the individual pieces of an online business work together.</p>
<p class="body">But one of my favorite parts of entrepreneurship is discovering better ways of doing things.</p>
<div class="loves">{''.join(f'<span>{e(l)}</span>' for l in loves)}</div>
<p class="body">The BOSS Academy is where I bring that knowledge together.</p>
<p class="body">Every course is created with the intention of helping you understand something more deeply, develop a valuable skill or approach a business problem differently.</p>
<p class="body">Because I don&rsquo;t just want you to know how to blog.</p>
<p class="big it">I want you to know how to build, operate, monetize and evolve a business.</p>
<div>{btn("Explore My Courses","#library")}</div>
</div></div></section>''')
# three ways
o.append(f'''<section style="background:#FBF5EE"><div class="in stack" style="gap:30px">
<div class="nar stack" style="text-align:center;gap:12px"><p class="lbl">Looking for something beyond specialized courses?</p><h2>There are three ways to build your business with <em>Boss Lady Bloggers.</em></h2></div>
<div class="ways">
<article class="way"><p class="for">For the independent learner</p><h3>The BOSS Academy</h3><p>Master specific business skills through specialized courses in monetization, marketing, sales, AI, productivity and more.</p><p>Purchase individual courses or unlock the complete Academy collection.</p>{btn("Shop Courses","#library")}</article>
<article class="way mid"><p class="for">For the woman who needs direction</p><h3>The Blogging Ladies Membership</h3><p>You don&rsquo;t necessarily need more specialized education. You need to understand how to build your entire blogging business and know which projects to prioritize.</p><p>Get access to the signature eight module BOSS Business System, strategic business roadmaps, projects and implementation resources.</p><p class="price">$47<span style="font-size:.45em;color:#F6C9D8">/month</span></p>{btn("Explore the Membership","/membership/","cr")}</article>
<article class="way top"><p class="for">For the woman who wants professional support</p><h3>The BOSS Business Experience</h3><p>You have the vision, but you don&rsquo;t want to spend the next year figuring out how to build every piece of your business independently.</p><p>Work with me privately through personalized 1:1 blog business mentorship, custom website design and done for you business development.</p><p>Get the strategy, expertise and professional implementation your business needs.</p>{btn("Explore Private Coaching & Design","/coaching/","cr")}</article>
</div></div></section>''')
# faq
faq=[("Can I purchase individual courses?",["Absolutely. Every available standalone course inside The BOSS Academy can be purchased individually. Choose the education that addresses your current business needs."]),
("Can I purchase the entire course library?",["Yes. The BOSS Academy All Access gives you access to the complete included collection instead of purchasing each course separately."]),
("Do I need to complete the courses in a particular order?",["No. The Academy is organized around specialized business skills, not a single curriculum. You can choose courses based on your interests, existing knowledge and current business priorities."]),
("Are the courses suitable for beginners?",["Yes. The Academy is designed for women at different stages of business. Individual course sales pages explain what each course covers and who it is best suited for."]),
("Will new courses be added?",["The BOSS Academy is designed to be an evolving educational collection, with new courses exploring modern business strategies, emerging technology and relevant industry developments."]),
("Is The BOSS Academy the same as the Blogging Ladies Membership?",["No. The Blogging Ladies Membership provides a structured business methodology through the eight module BOSS Business System and its implementation resources.","The BOSS Academy is a separate collection of specialized courses that explore individual business subjects in greater depth."]),
("Is the entire Academy included in the $47 membership?",["No. Academy courses and All Access are separate educational purchases."]),
("Do Academy courses include private coaching?",["Academy courses are designed for independent learning. If you want personalized business strategy, custom website design and done for you implementation, explore the BOSS Business Experience."]),
("How long will I have access to my courses?",None),
("Can I upgrade to All Access after purchasing an individual course?",None)]
fq=''
for q,a in faq:
    ans=''.join(f'<p>{e(x)}</p>' for x in a) if a else f'<p>{slot("To fill in: " + ("confirmed course access policy" if "access" in q else "confirmed Academy upgrade policy"),True)}</p>'
    fq+=f'<details><summary>{e(q)}<span class="faq-plus" aria-hidden="true">+</span></summary><div class="faq-a">{ans}</div></details>'
o.append(f'''<section class="faqs dk"><div class="in stack" style="gap:30px"><div class="nar" style="text-align:center"><h2>Frequently Asked <em>Questions</em></h2></div><div class="faq">{fq}</div></div></section>''')
mores=["Become more strategic about what you build.","More intentional about how you market it.","More knowledgeable about why people buy.","More capable of using technology to bring your ideas to life.","And more prepared to adapt as the world around your business changes."]
o.append(f'''<section class="final"><div class="nar stack" style="align-items:center">
<h2>Build the knowledge behind the business <em>you want to own.</em></h2>
<div class="mores">{''.join(f'<p>{e(m)}</p>' for m in mores)}</div>
<p class="body">Whatever your business needs next, there&rsquo;s a place to keep learning inside The BOSS Academy.</p>
<div class="ctas" style="justify-content:center">{btn("Shop All Courses","#library")}{btn("Unlock BOSS Academy All Access","/all-access/","br")}</div>
<div class="sign"><b>THE BOSS ACADEMY</b><span>An educational division of Boss Lady Bloggers.</span><span>Modern business education for ambitious women.</span></div>
</div></section>''')
o.append('''<script>
(function(){
  var root=document.querySelector('.ac');if(!root)return;
  var lib=document.getElementById('library');
  var btns=lib.querySelectorAll('.flt [data-f]'),cards=lib.querySelectorAll('.course'),empty=lib.querySelector('[data-empty]');
  function setF(f){
    var shown=0;
    btns.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-f')===f?'true':'false');});
    cards.forEach(function(c){var on=f==='all'||(' '+c.getAttribute('data-cats')+' ').indexOf(' '+f+' ')>-1;c.hidden=!on;if(on)shown++;});
    empty.hidden=shown>0;
  }
  lib.addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(b)setF(b.getAttribute('data-f'));});
  root.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(!g)return;setF(g.getAttribute('data-go'));
    var top=lib.getBoundingClientRect().top+window.pageYOffset-60;window.scrollTo({top:top,behavior:'smooth'});
    var on=lib.querySelector('.flt [aria-pressed="true"]');if(on)setTimeout(function(){on.focus({preventScroll:true});},500);});
})();
</script>
</main>''')
out='\n'.join(o)
for bad in ['—','–','…']: assert bad not in out, bad
open(P,'w').write(out); print('wrote',len(out))
