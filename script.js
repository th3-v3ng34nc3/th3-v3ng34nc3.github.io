/* ════════════════════════════════════════════
   PRELOADER
════════════════════════════════════════════ */
(()=>{
  const txt = "Aditya.";
  const el  = document.getElementById('preText');
  [...txt].forEach((c,i)=>{
    const s = document.createElement('span');
    s.textContent = c === ' ' ? '\u00A0' : c;
    s.style.animationDelay = (i*0.07)+'s';
    el.appendChild(s);
  });
})();

window.addEventListener('load',()=>{
  const pre = document.getElementById('preloader');
  setTimeout(()=>{
    pre.classList.add('out');
    setTimeout(()=>{ pre.style.display='none'; initReveal(); },700);
  }, 900);
});

/* ════════════════════════════════════════════
   CURSOR
════════════════════════════════════════════ */
(()=>{
  const dot  = document.getElementById('cdot');
  const ring = document.getElementById('cring');
  let rx=0, ry=0, mx=0, my=0;
  document.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
  (function loop(){ rx+=(mx-rx)*.12; ry+=(my-ry)*.12; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(loop); })();
  document.querySelectorAll('a,button,.btn-p,.btn-o,.svc-card,.pf-inner,.tab,.fi').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('big'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('big'));
  });
})();

/* ════════════════════════════════════════════
   TYPEWRITER
════════════════════════════════════════════ */
(()=>{
  const phrases=['Security Engineer','Cloud Security Expert','Kubernetes Administrator','DevSecOps Engineer','Penetration Tester'];
  const el=document.getElementById('twEl');
  let pi=0,ci=0,del=false;
  function run(){
    const p=phrases[pi];
    if(!del){ el.textContent=p.slice(0,++ci); if(ci===p.length){del=true;setTimeout(run,1800);return;} }
    else{ el.textContent=p.slice(0,--ci); if(ci===0){del=false;pi=(pi+1)%phrases.length;} }
    setTimeout(run,del?50:90);
  }
  run();
})();

/* ════════════════════════════════════════════
   HEADER SCROLL + BACK-TO-TOP
════════════════════════════════════════════ */
window.addEventListener('scroll',()=>{
  document.getElementById('hdr').classList.toggle('stuck',window.scrollY>50);
  document.getElementById('btt').classList.toggle('show',window.scrollY>400);
  document.getElementById('ssw').classList.remove('open');
});
document.getElementById('btt').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

/* ════════════════════════════════════════════
   NAV / SECTION ROUTING
════════════════════════════════════════════ */
const allSecs   = document.querySelectorAll('.sec');
const allLinks  = document.querySelectorAll('.nl');
const navEl     = document.getElementById('navEl');
const overlay   = document.getElementById('overlay');
const fadeFx    = document.getElementById('fadeFx');
const hamBtn    = document.getElementById('hamBtn');
const navClose  = document.getElementById('navClose');

function openNav(){ navEl.classList.add('open'); overlay.classList.add('on'); document.body.classList.add('no-scroll'); }
function closeNav(){ navEl.classList.remove('open'); overlay.classList.remove('on'); document.body.classList.remove('no-scroll'); }
hamBtn.addEventListener('click', openNav);
navClose.addEventListener('click', closeNav);
overlay.addEventListener('click', closeNav);

document.addEventListener('click', e=>{
  const a = e.target.closest('.nl');
  if(a && a.getAttribute('href')){
    if(a.getAttribute('href').startsWith('#')){
      closeNav();
      allLinks.forEach(l=>l.classList.toggle('on', l.getAttribute('href')===a.getAttribute('href')));
    }
  }
});

/* ════════════════════════════════════════════
   REVEAL ON SCROLL
════════════════════════════════════════════ */
function initReveal(){
  const els = document.querySelectorAll('.rv:not(.done)');
  if(!els.length) return;
  const obs = new IntersectionObserver((entries,o)=>{
    entries.forEach((en,i)=>{
      if(en.isIntersecting){
        en.target.style.transitionDelay=(i*0.07)+'s';
        en.target.classList.add('done');
        o.unobserve(en.target);
      }
    });
  },{threshold:0.1});
  els.forEach(el=>obs.observe(el));
}
initReveal();

/* ════════════════════════════════════════════
   STYLE SWITCHER
════════════════════════════════════════════ */
document.getElementById('sswTog').addEventListener('click',()=>document.getElementById('ssw').classList.toggle('open'));

/* ════════════════════════════════════════════
   LIGHT/DARK MODE TOGGLE
════════════════════════════════════════════ */
const modeBtn = document.getElementById('modeBtn');
const modeIcon = document.getElementById('modeIcon');
if(modeBtn && modeIcon) {
  modeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
    
    if (document.body.classList.contains('light')) {
      modeIcon.classList.replace('fa-sun', 'fa-moon');
    } else {
      modeIcon.classList.replace('fa-moon', 'fa-sun');
    }
  });
}