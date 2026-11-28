(function(){var R=document.querySelector('.m');if(!R)return;

var F=R.querySelector('[data-bfind]');if(F){var qs=F.querySelectorAll('.fq'),dots=F.querySelectorAll('.fdots i'),A=[];
function show(i){Array.prototype.forEach.call(qs,function(q,j){q.classList.toggle('on',j===i)});Array.prototype.forEach.call(dots,function(d,j){d.classList.toggle('on',j<=i)});}
var REC={
 fast:['The Blog Monetization Fast Track Call','I&rsquo;ll examine your business before we meet and prepare a personalized strategic presentation exploring what I would consider changing, why I would change it and what your business could become. Complimentary for qualified prospective private clients.','/apply','Explore the Fast Track Call','/blog-coaching','Explore The BOSS Business Experience'],
 boss:['The BOSS Business Experience','My signature 12 month private business development and growth partnership combining blog coaching, business strategy, Custom Modern Website Design and ongoing professional support.','/blog-coaching','Explore The BOSS Business Experience','/apply','Apply for a Complimentary Fast Track Call'],
 bl:['The Blogging Ladies Membership','Learn the business foundations behind profitable blogging through my signature BOSS Business System.','/membership','Explore Blogging Ladies'],
 fp:['The Futureproof Blogger','A specialized course exploring the evolution of blogging, business models, customer value and entrepreneurship in the age of artificial intelligence.','/futureproof-blogger','Discover The Futureproof Blogger','/futureproof-your-blog','Watch the Free Masterclass'],
 pbm:['The Productive Blogger Method','Learn how to use Claude to turn your business goals, ideas and strategies into organized projects and personalized implementation plans.','/productive-blogger-method','Explore The Productive Blogger Method'],
 icc:['The Interactive Course Creator','Learn my complete methodology for developing interactive online courses using Claude, from capturing your expertise to building your educational experience and preparing it for launch.','/interactive-course-creator','Enter The Interactive Lab'],
 free:['Futureproof Your Blog, my free masterclass','This is where I would encourage you to begin if you&rsquo;re unfamiliar with my business philosophy or uncertain about what your next step should be.','/futureproof-your-blog','Save My Free Seat','/podcast','Listen to the Podcast']};
function pick(){var st=A[0],ch=A[1],sup=A[2],k;
 if(sup==='free')k='free';
 else if(sup==='private')k=(st==='new'||ch==='brand')?'boss':'fast';
 else k={how:'bl',sales:'bl',org:'pbm',ai:'fp',create:'icc',brand:'bl'}[ch]||'bl';
 var r=REC[k];F.querySelector('[data-rt]').innerHTML=r[0];F.querySelector('[data-rd]').innerHTML=r[1];var l=F.querySelector('[data-rl]'),l2=F.querySelector('[data-rl2]');l.href=r[2];l.firstChild.textContent=r[3]+' ';
 if(r[4]){l2.hidden=false;l2.href=r[4];l2.firstChild.textContent=r[5]+' ';}else l2.hidden=true;show(3);}
Array.prototype.forEach.call(qs,function(q,i){Array.prototype.forEach.call(q.querySelectorAll('.opts button'),function(b){b.addEventListener('click',function(){Array.prototype.forEach.call(q.querySelectorAll('.opts button'),function(x){x.setAttribute('aria-pressed',x===b)});A[i]=b.getAttribute('data-v');setTimeout(function(){if(i<2)show(i+1);else pick();},250);});});});
F.querySelector('[data-restart]').addEventListener('click',function(){A=[];Array.prototype.forEach.call(F.querySelectorAll('.opts button'),function(x){x.setAttribute('aria-pressed','false')});show(0);});}
})();
