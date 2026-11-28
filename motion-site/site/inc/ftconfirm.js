<script>
(function(){
  /* Calendly passes the booking details when "Pass event details to your redirected page" is on */
  var q=new URLSearchParams(location.search),st=q.get('event_start_time'),en=q.get('event_end_time'),inv=q.get('invitee_uuid');
  var set=function(k,v){var el=document.querySelector('[data-appt="'+k+'"]');if(el)el.textContent=v;};
  var cal=document.querySelector('[data-cal]');
  var VD='<button type="button" class="btn" data-viewappt>View My Appointment Details</button>';
  if(st){var a=new Date(st),b=en?new Date(en):new Date(a.getTime()+3600000);
    if(!isNaN(a)){
      set('date',a.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
      var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g,' ');}catch(x){}
      set('time',a.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})+(tz?' ('+tz+')':''));
      set('dur',Math.round((b-a)/60000)+' minutes');
      var z=function(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
      var t='Blog Monetization Fast Track Call with Genasys',d='Your private Zoom link is in your appointment confirmation email.';
      var g='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(t)+'&dates='+z(a)+'/'+z(b)+'&details='+encodeURIComponent(d)+'&location=Zoom';
      var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Boss Lady Bloggers//Fast Track//EN','BEGIN:VEVENT','UID:fasttrack-'+z(a)+'@bossladybloggers.com','DTSTAMP:'+z(new Date()),'DTSTART:'+z(a),'DTEND:'+z(b),'SUMMARY:'+t,'DESCRIPTION:'+d,'LOCATION:Zoom','END:VEVENT','END:VCALENDAR'].join('\r\n');
      cal.innerHTML='<a class="btn" href="'+g+'" target="_blank" rel="noopener">Add to My Calendar</a><a class="btn ghost" download="fast-track-call.ics" href="data:text/calendar;charset=utf-8,'+encodeURIComponent(ics)+'">Apple or Outlook</a>'+VD;
    }
  } else if(cal){cal.innerHTML='<p>Your calendar invitation is attached to your confirmation email.</p>'+VD;}
  var vb=document.querySelector('[data-viewappt]');if(vb)vb.addEventListener('click',function(){var t=document.getElementById('appt');t.scrollIntoView({behavior:'smooth',block:'center'});t.classList.remove('pulse');void t.offsetWidth;t.classList.add('pulse');t.focus({preventScroll:true});});
  var r=document.querySelector('[data-resched]');
  if(r)r.innerHTML=inv?'<a class="btn" href="https://calendly.com/reschedulings/'+encodeURIComponent(inv)+'">Reschedule My Appointment</a>':'<p>Use the Reschedule link in your confirmation email.</p>';
})();
</script>