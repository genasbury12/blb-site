<script>
(function(){var R=document.querySelector('.m');
/* ======= Paste the YouTube video ID of the replay here when it's ready ======= */
var REPLAY_ID='';
var pl=R.querySelector('[data-player]');if(REPLAY_ID&&pl){pl.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+REPLAY_ID+'?rel=0&modestbranding=1" title="Futureproof Your Blog masterclass replay" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';}
var ta=R.querySelector('[data-notes]'),nm=R.querySelector('[data-notesmsg]'),KEY='fpyb_replay_notes';
if(ta){try{ta.value=localStorage.getItem(KEY)||''}catch(x){nm.textContent='Your notes stay on this page until you leave.'}
 var t;ta.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){try{localStorage.setItem(KEY,ta.value);nm.textContent='Saved.'}catch(x){}},400)});}
var dl=R.querySelector('[data-dlnotes]');if(dl)dl.addEventListener('click',function(){var a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent('Futureproof Your Blog: my notes\n\n'+(ta?ta.value:''));a.download='futureproof-your-blog-notes.txt';document.body.appendChild(a);a.click();a.remove();});
var ql=R.querySelectorAll('[data-qstep] li'),qn=R.querySelector('[data-qnext]'),qk=0;if(qn)qn.addEventListener('click',function(){ql[qk].classList.remove('on');qk=(qk+1)%ql.length;ql[qk].classList.add('on');qn.textContent=qk===ql.length-1?'Start over ↺':'Next question →';});
})();
</script>