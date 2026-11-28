<script>
(function(){
var red=matchMedia('(prefers-reduced-motion: reduce)').matches;
function onView(el,fn,th){if(!('IntersectionObserver' in window)||red){fn();return}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){fn();io.disconnect()}})},{threshold:th||.3});io.observe(el)}
document.querySelectorAll('[data-bld],[data-br]').forEach(function(el){onView(el,function(){el.classList.add('on')})});
var NS='http://www.w3.org/2000/svg';
document.querySelectorAll('[data-bp]').forEach(function(bp){
 var svg=bp.querySelector('.bp-svg'),hub=bp.querySelector('[data-bphub] figure'),ns=[].slice.call(bp.querySelectorAll('[data-bpn]')),paths=[];
 function draw(){
  svg.innerHTML='';paths=[];
  if(getComputedStyle(svg).display==='none')return;
  var B=bp.getBoundingClientRect(),H=hub.getBoundingClientRect();
  svg.setAttribute('viewBox','0 0 '+B.width+' '+B.height);
  var hx=H.left+H.width/2-B.left,hy=H.top+H.height/2-B.top;
  ns.forEach(function(n,i){
   var r=n.getBoundingClientRect(),left=(r.left+r.width/2-B.left)<hx;
   var x=left?r.right-B.left:r.left-B.left,y=r.top+r.height/2-B.top;
   var sx=left?H.left-B.left:H.right-B.left,mx=(x+sx)/2;
   var p=document.createElementNS(NS,'path');p.setAttribute('d','M'+sx+' '+hy+' C'+mx+' '+hy+' '+mx+' '+y+' '+x+' '+y);p.setAttribute('class','bp-ln');svg.appendChild(p);
   var d=document.createElementNS(NS,'circle');d.setAttribute('cx',x);d.setAttribute('cy',y);d.setAttribute('r',5);d.setAttribute('class','bp-dot');svg.appendChild(d);
   paths.push(p)});
  var c=document.createElementNS(NS,'circle');c.setAttribute('class','bp-run');c.setAttribute('r',6);svg.appendChild(c);run.c=c;
 }
 var run={i:0,t:0,c:null};
 function tick(ts){
  if(run.c&&paths.length){var p=paths[run.i],L=p.getTotalLength(),k=Math.min(1,(ts-run.t)/1300),pt=p.getPointAtLength(L*k);run.c.setAttribute('cx',pt.x);run.c.setAttribute('cy',pt.y);
   if(k>=1){ns.forEach(function(n,j){n.classList.toggle('lit',j===run.i)});paths.forEach(function(q,j){q.classList.toggle('lit',j===run.i)});if(ts-run.t>2600){run.i=(run.i+1)%paths.length;run.t=ts}}}
  requestAnimationFrame(tick)}
 draw();addEventListener('resize',draw);addEventListener('load',draw);
 onView(bp,function(){bp.classList.add('on');if(!red)requestAnimationFrame(function(ts){run.t=ts;tick(ts)});else ns.forEach(function(n){n.classList.add('lit')})},.2);
 ns.forEach(function(n,i){n.addEventListener('mouseenter',function(){run.i=i;run.t=performance.now()-1300})});
});
})();
</script>
