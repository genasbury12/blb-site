import re,os,sys,html as H
D=os.path.dirname(os.path.abspath(__file__))  # was /tmp/site; pages still say /tmp/site/ and are mapped here
HH='https://raw.githubusercontent.com/genasbury12/blb-site/4d99857666b97bc51579ccfa9ced77e68acdcce5'  # pinned commit that holds every image, incl. freebies and the popup poster
NM=os.environ.get('BLB_NODE_MODULES',os.path.join(os.path.dirname(D),'node_modules'))+'/'
CDN=['https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js','https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js','https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/SplitText.min.js','https://cdn.jsdelivr.net/npm/lenis@1.3.28/dist/lenis.min.js']
LOC=[NM+'gsap/dist/gsap.min.js',NM+'gsap/dist/ScrollTrigger.min.js',NM+'gsap/dist/SplitText.min.js',NM+'lenis/dist/lenis.min.js']
def parts():
    pf=open(f'{D}/data/pfcards.html').read();cards=''
    for i,m in enumerate(re.finditer(r'href="([^"]+)".*?src="([^"]+)" alt="([^"]*)".*?<h3>([^<]+)</h3><p>([^<]+)',pf)):
        href,src,alt,t,d=m.groups();cards+=f'<a class="pf" href="{href}"><span class="shot"><img src="{src}" alt="{alt}" loading="lazy"></span><span class="k">0{i+1} &middot; client project</span><h3>{t}</h3><p>{d}</p></a>'
    vd=open(f'{D}/data/videos.html').read();vids=''
    for m in re.finditer(r'data-yt="([^"]+)" aria-label="([^"]+)"',vd):
        yid,lab=m.groups();nm=re.search(r'Play (\w+)',H.unescape(lab)).group(1)
        vids+=f'<button type="button" class="v" data-yt="{yid}" aria-label="{lab}"><img src="https://i.ytimg.com/vi/{yid}/hqdefault.jpg" alt="" loading="lazy"><span class="pl"><svg width="20" height="20" viewBox="0 0 18 18"><path d="M5 3l10 6-10 6z" fill="#A23E66"/></svg></span><span class="nm">{nm}</span></button>'
    return cards,vids
def build(name):
    body=open(f'{D}/pages/{name}.html').read()
    pcss=''
    if os.path.exists(f'{D}/pages/{name}.css'): pcss=open(f'{D}/pages/{name}.css').read()
    import re as _r
    th=_r.search(r'<!--theme:(\w+)-->',body)
    tcss=tlinks=''
    if th:
        tcss=open(f'{D}/themes/{th.group(1)}.css').read();tlinks=open(f'{D}/themes/{th.group(1)}.links').read()
    cards,vids=parts()
    wave=''.join(f'<i style="animation-delay:-{(i*0.13)%1.2:.2f}s"></i>' for i in range(26))
    proof=f'''<div class="row"><figure data-up><img src="@H@/site/images/proof/proof-first-stripe-payouts-2020-2021.jpg" alt="Blurred sample of early Stripe payouts" loading="lazy"><figcaption>My first Stripe payouts</figcaption></figure><figure data-up><img src="@H@/site/images/proof/proof-monthly-client-payments-2024.jpg" alt="Blurred sample of monthly client payments" loading="lazy"><figcaption>Real client payments, 2024</figcaption></figure><figure data-up><img src="@H@/site/images/proof/proof-81-invoices-paid.jpg" alt="Invoice app showing 81 paid invoices totaling $34,481" loading="lazy"><figcaption><span data-count="81">81</span> invoices paid: $<span data-count="34481" data-comma>34,481</span></figcaption></figure></div><p class="note">My results are my own and are not a guarantee of yours.</p>'''
    items=['Business strategy','Private blog coaching','Custom Modern Website Design','Marketing &amp; sales']
    rib=''.join(f'<span>{x}</span>' for x in items*2)
    checks=''.join(f'<li><svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="15"/><path d="M9 15.5l4 4L21 11"/></svg>{x}</li>' for x in ['The complete eight module BOSS Business System.','Strategic business roadmaps.','Business projects and action plans.','Practical implementation resources.','Ongoing business development direction.'])
    film=''.join(f'<img src="@H@/site/images/photos/{x}.jpg" alt="" loading="lazy">' for x in ['confetti','desk-laptop-mic','portrait-hat','balloons-walk','sitting-glass','pink-desk','letterboard-closeup','champagne-stand','mic-desk-lean','table-candid','stool-balloons','desk-writing']*2)
    if '<!--sh-->' in body: # SEAM
        badge='<div class="seam {c}" aria-hidden="true"><div class="badge"><svg viewBox="0 0 132 132"><defs><path id="sb{i}" d="M66,66 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0"/></defs><circle cx="66" cy="66" r="64" fill="#FBF5EE" stroke="#A23E66" stroke-width="2"/><text font-family="DM Mono, monospace" font-size="9.2" letter-spacing="1.9" fill="#3A1C2A"><textPath href="#sb{i}">BOSS LADY BLOGGERS &#183; NICE TO MEET YOU &#183; </textPath></text></svg><span>Gen</span></div></div>'
        idx=[m.start() for m in _r.finditer(r'\n<section ',body)]
        for k,(pos,c) in enumerate(reversed([(idx[i],['r','l',''][j%3]) for j,i in enumerate([2,6,10]) if i<len(idx)])):
            body=body[:pos]+'\n'+badge.replace('{c}',c).replace('{i}',str(k))+body[pos:]
    if '<!--sh-->' in body: # HLWRAP
        def _w(m):
            inner=m.group(2)
            if '<' in inner: return m.group(0)
            ws=inner.split(' ')
            n=2 if len(ws)>3 else len(ws)
            return m.group(1)+' '.join(ws[:-n])+(' ' if len(ws)>n else '')+'<span class="hl">'+' '.join(ws[-n:])+'</span></em>'
        body=_r.sub(r'(<h[12][^>]*>[^<]*(?:<(?!/h)[^<]*)*?<em[^>]*>)([^<]*)</em>',_w,body)
    if '<!--sh-->' in body: # CIRCWORD
        i=body.find('s-final')
        if i>0:
            m=_r.search(r'<span class="hl">([^<]*)</span>',body[i:])
            if m:
                w=m.group(1)
                body=body[:i]+body[i:].replace(m.group(0),'<span class="circ">'+w+'<svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="100" cy="40" rx="96" ry="34" transform="rotate(-4 100 40)"/></svg></span>',1)
    body=_r.sub(r'@INC:([^@]+)@',lambda m:open(m.group(1).replace('/tmp/site/',D+'/')).read(),body)
    ck=lambda L:''.join(f'<li><svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="15"/><path d="M9 15.5l4 4L21 11"/></svg>{x}</li>' for x in L)
    body=body.replace('@MCCHECKS@',ck(['What&rsquo;s changing in the blogging industry.','Why traditional monetization strategies deserve reconsideration.','What people will continue paying for when information becomes increasingly accessible.','The business model I would prioritize if I were starting today.','How to build a business that can evolve as technology evolves.'])).replace('@FTCHECKS@',ck(['Your existing offers and monetization opportunities.','Potential revenue leaks.','Your brand messaging and positioning.','Your website and customer experience.','Your marketing and sales funnels.','Your AI implementation opportunities.','Your strategic business development priorities.']))
    body=body.replace('@WHYCHECKS@',ck(['Understand buyer psychology.','Investigate what people are willing to pay for.','Validate their offers before creating them.','Develop their positioning before designing their website.','Understand how their marketing connects to their sales process.','Think about the commercial viability of the business they&rsquo;re building.'])).replace('@ABMCCHECKS@',ck(['What&rsquo;s changing in the blogging industry and why it matters.','The vulnerabilities of traditional blogging business models.','What makes an offer valuable when information is increasingly accessible.','The business model I would prioritize if I were starting today.','How to begin building a more adaptable blogging business.'])).replace('@FINCHECKS@',ck(['Learn how business works.','Understand the people you want to serve.','Create something genuinely valuable.','And give yourself the opportunity to build something you&rsquo;re proud to own.']))
    def _trk(n):
        st=['Apply','Business questionnaire','Book your call','Your Fast Track Call']
        it=''.join('<div class="%s"><b>%s</b><span>%s</span></div>'%('done' if i+1<n else ('here' if i+1==n else ''),'&#10003;' if i+1<n else ('&#9742;' if i==3 else '0%d'%(i+1)),t) for i,t in enumerate(st))
        car=open(f'{D}/inc/car.svg').read().replace('data-car','')
        return '<section class="f-track" data-ftrack data-n="'+str(n)+'"><div class="f-w"><div class="rail"><i></i><span class="pace" aria-hidden="true">'+car+'</span></div><div class="stg">'+it+'</div></div></section>'
    body=_r.sub(r'@TRACK:(\d)@',lambda m:_trk(int(m.group(1))),body)
    body=body.replace('@FILM@',film).replace('@RIB@',rib).replace('@CHECKS@',checks).replace('@PF@',cards).replace('@VIDS@',vids).replace('@WAVE@',wave).replace('@PROOF@',proof)
    out=open(f'{D}/links.html').read()+tlinks+'<style>'+open(f'{D}/core.css').read()+open(f'{D}/kit.css').read()+pcss+tcss+'</style>\n'+('<div class="m sh" id="m-root">\n' if '<!--sh-->' in body else '<div class="m" id="m-root">\n')+open(f'{D}/nav.html').read()+body+open(f'{D}/footer.html').read()+'</div>\n'+''.join(f'<script src="{u}"></script>\n' for u in CDN)+'<script>'+open(f'{D}/core.js').read()+'</script>\n'
    out=_r.sub(r'https://cdn\.jsdelivr\.net/gh/genasbury12/blb-site@([0-9a-f]+)/',r'https://raw.githubusercontent.com/genasbury12/blb-site/\1/',out.replace('@H@',HH)) # jsdfix
    out=out.replace('&#8599;','&#8599;&#xFE0E;').replace('&#8595;','&#8595;&#xFE0E;').replace('&#8593;','&#8593;&#xFE0E;').replace('↗','↗︎')
    os.makedirs(f'{D}/out',exist_ok=True)
    open(f'{D}/out/{name}.html','w').write(out)
    p=out
    for u,f in zip(CDN,LOC):
        code=open(f).read().replace('</script','<\\/script').split('//# sourceMappingURL')[0]
        p=p.replace(f'<script src="{u}"></script>','<script>'+code+'</script>')
    pre='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boss Lady Bloggers</title><style>html,body{margin:0}</style></head><body>'
    open(f'{D}/out/{name}.preview.html','w').write(pre+p+'</body></html>')
    return len(out)
for n in sys.argv[1:]: print(n,build(n))
