/* ════════════════════════════════════════════════════════════
   DRAKARIS — JS
════════════════════════════════════════════════════════════ */

/* ── PRELOADER ── */
window.addEventListener('load',()=>{
  const pl=document.getElementById('preloader');
  setTimeout(()=>pl.classList.add('out'),900);
  setTimeout(()=>pl.style.display='none',1500);
});

/* ── STAR FIELD (red tinted) ── */
(()=>{
  const c=document.getElementById('starCanvas');if(!c)return;
  const ctx=c.getContext('2d');let stars=[],w,h,mx=0,my=0;
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    w=window.innerWidth;h=window.innerHeight;
    c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);initStars();
  }
  function initStars(){
    const count=Math.min(Math.floor((w*h)/5000),700);
    stars=[];
    for(let i=0;i<count;i++){
      stars.push({
        x:Math.random()*w,y:Math.random()*h,
        r:Math.random()*1.8+0.3,
        a:Math.random()*0.5+0.1,
        s:Math.random()*0.3+0.05,
        t:Math.random()*200,
        d:Math.random()*300+50,
        red:Math.random()>0.6 // 40% red-tinted
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const px=(mx/w-0.5)*2,py=(my/h-0.5)*2;
    for(const st of stars){
      const sx=st.x+px*st.d*0.05,sy=st.y+py*st.d*0.05;
      const tw=0.5+0.5*Math.sin(st.t);
      const op=st.a*(0.6+0.4*tw);
      const tint=st.red?`rgba(220,50,50,${op*0.7})`:`rgba(255,240,240,${op})`;
      ctx.beginPath();ctx.arc(sx,sy,st.r,0,Math.PI*2);ctx.fillStyle=tint;ctx.fill();
      if(st.r>1.2){
        ctx.beginPath();ctx.arc(sx,sy,st.r*3,0,Math.PI*2);
        ctx.fillStyle=st.red?`rgba(220,50,50,${op*0.05})`:`rgba(255,200,200,${op*0.04})`;
        ctx.fill();
      }
      st.t+=st.s;
    }
    // Shooting star (gold trimmed)
    if(Math.random()<0.001){
      const sx=Math.random()*w,sy=Math.random()*h*0.5;
      const len=70+Math.random()*50;
      const angle=Math.PI/4+Math.random()*0.5;
      const g=ctx.createLinearGradient(sx,sy,sx+Math.cos(angle)*len,sy+Math.sin(angle)*len);
      g.addColorStop(0,'rgba(220,150,50,0)');
      g.addColorStop(0.3,'rgba(220,150,50,0.5)');
      g.addColorStop(0.7,'rgba(220,150,50,0.2)');
      g.addColorStop(1,'rgba(220,150,50,0)');
      ctx.beginPath();ctx.moveTo(sx,sy);
      ctx.lineTo(sx+Math.cos(angle)*len,sy+Math.sin(angle)*len);
      ctx.strokeStyle=g;ctx.lineWidth=1;ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
  window.addEventListener('resize',resize);resize();draw();
})();

/* ── HERO RED PARTICLE RAIN ── */
(()=>{
  const c=document.createElement('canvas');
  c.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1';
  const hero=document.querySelector('.cz-hero');
  if(!hero)return;
  hero.style.position='relative';
  hero.appendChild(c);
  const ctx=c.getContext('2d');
  let w,h,drops=[];
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    w=hero.offsetWidth;h=hero.offsetHeight;
    c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);
    drops=[];
    for(let i=0;i<25;i++)drops.push({x:Math.random()*w,y:Math.random()*h,sp:Math.random()*0.5+0.2,sz:Math.random()*2+1,t:Math.random()*100});
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const d of drops){
      const flick=0.6+0.4*Math.sin(d.t);
      ctx.beginPath();ctx.arc(d.x,d.y,d.sz,0,Math.PI*2);
      ctx.fillStyle=`rgba(220,38,38,${0.08*flick})`;
      ctx.fill();
      ctx.beginPath();ctx.arc(d.x-1,d.y-1,d.sz*1.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(220,38,38,${0.03*flick})`;
      ctx.fill();
      d.y+=d.sp;
      d.t+=0.03;
      if(d.y>h){d.y=-10;d.x=Math.random()*w;}
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  resize();draw();
})();

/* ── SKILLS DATA (local images where available) ── */
const SKILL_DATA = [
  {n:'Amazon Web Services', cat:'cloud', i:'img/aws.png'},
  {n:'Microsoft Azure',     cat:'cloud', i:'img/azure.png'},
  {n:'Google Cloud',        cat:'cloud', i:'img/gcp.png'},
  {n:'Kubernetes',          cat:'cloud', i:'https://cdn.simpleicons.org/kubernetes/326CE5'},
  {n:'Docker',              cat:'cloud', i:'https://cdn.simpleicons.org/docker/2496ED'},
  {n:'Linux',               cat:'cloud', i:'https://cdn.simpleicons.org/linux/FCC624'},
  {n:'Python',              cat:'tools', i:'https://cdn.simpleicons.org/python/3776AB'},
  {n:'Bash / Shell',        cat:'tools', i:'https://cdn.simpleicons.org/gnubash/4EAA25'},
  {n:'Burp Suite',          cat:'tools', i:'img/burpsuite.png'},
  {n:'OWASP ZAP',           cat:'tools', i:'img/zap.png'},
  {n:'Trivy',               cat:'tools', i:'img/trivy.png'},
  {n:'Snyk',                cat:'tools', i:'img/snyk.png'},
  {n:'SonarQube',           cat:'tools', i:'https://cdn.simpleicons.org/sonarqube/4EAA25'},
  {n:'Checkmarx',           cat:'tools', i:'img/checkmarx.png'},
  {n:'Jenkins',             cat:'tools', i:'img/jenkins.png'},
  {n:'Falco',               cat:'tools', i:'img/falco.png'},
  {n:'Cilium',              cat:'tools', i:'img/cilium.png'},
  {n:'KubeArmor',           cat:'tools', i:'img/kubearmor.png'},
  {n:'Calico',              cat:'tools', i:'img/calico.png'},
  {n:'kube-bench',          cat:'tools', i:'img/kubeBench.png'},
  {n:'Splunk / SIEM',       cat:'tools', i:'https://cdn.simpleicons.org/splunk/000000'},
  {n:'GitHub Actions',      cat:'tools', i:'https://cdn.simpleicons.org/githubactions/2088FF'},
  {n:'Vulnerability Mgmt',  cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#dc2626" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="Inter">VM</text></svg>')},
  {n:'Incident Response',   cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#e01e5a" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="Inter">IR</text></svg>')},
  {n:'Compliance & Audit',  cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#7f1d1d" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="12" font-weight="700" font-family="Inter">C&A</text></svg>')},
  {n:'Threat Modeling',     cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#b91c1c" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="14" font-weight="700" font-family="Inter">TM</text></svg>')},
  {n:'DevSecOps',           cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#ef4444" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="12" font-weight="700" font-family="Inter">DO</text></svg>')},
  {n:'Penetration Testing', cat:'core', i:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="6" fill="#dc2626" opacity=".7"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="12" font-weight="700" font-family="Inter">PT</text></svg>')},
];

/* ── RENDER SKILL GRID ── */
(()=>{
  const grid=document.getElementById('skGrid');if(!grid)return;
  const btns=document.querySelectorAll('.sk-fb');let cur='all';
  function render(f){
    grid.innerHTML='';
    const items=f==='all'?SKILL_DATA:SKILL_DATA.filter(s=>s.cat===f);
    for(const sk of items){
      const el=document.createElement('div');el.className='sk-item';
      el.innerHTML=`<img src="${sk.i}" alt="${sk.n}" loading="lazy"><span class="sk-n">${sk.n}</span><span class="sk-c">${sk.cat}</span>`;
      grid.appendChild(el);
    }
  }
  render('all');
  btns.forEach(b=>b.addEventListener('click',()=>{
    btns.forEach(x=>x.classList.remove('active'));b.classList.add('active');
    render(b.dataset.f);
  }));
})();

/* ── ROLE TYPEWRITER ── */
(()=>{
  const el=document.getElementById('roleType');if(!el)return;
  const roles=['Senior Security Engineer','Cloud Security Architect','DevSecOps Practitioner','Penetration Tester','K8s Security Specialist'];
  let ri=0,ci=0,del=false;
  function tick(){
    const cur=roles[ri];
    if(del){el.textContent=cur.substring(0,ci-1);ci--}
    else{el.textContent=cur.substring(0,ci+1);ci++}
    if(!del&&ci===cur.length){setTimeout(()=>{del=true;tick();},2000);return}
    if(del&&ci===0){del=false;ri=(ri+1)%roles.length;setTimeout(tick,400);return}
    setTimeout(tick,del?30:75);
  }tick();
})();

/* ── SCROLL REVEAL ── */
(()=>{
  const sel='.cz-label,.cz-title,.cz-sub,.stats-row,.sk-grid,.journey-grid,.proj-grid,.ach-grid,.con-grid,.about-split,.about-tags';
  const els=document.querySelectorAll(sel);
  const hidden=[];
  els.forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0)return;
    hidden.push(el);
    el.style.opacity='0';el.style.transform='translateY(28px)';
    el.style.transition='opacity .8s cubic-bezier(0.22,1,0.36,1),transform .8s cubic-bezier(0.22,1,0.36,1)';
  });
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(!en.isIntersecting)return;
      en.target.style.opacity='1';en.target.style.transform='translateY(0)';
      obs.unobserve(en.target);
    });
  },{threshold:0.08});
  hidden.forEach(el=>obs.observe(el));
})();

/* ── STAT COUNTERS ── */
(()=>{
  const obs=new IntersectionObserver((entries,o)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting)return;
      const el=en.target;const t=+(el.dataset.count||0);const suf=el.dataset.suffix||'';
      if(!t){o.unobserve(el);return}
      let cur=0;const step=t/40;const iv=setInterval(()=>{cur+=step;if(cur>=t){cur=t;clearInterval(iv)}el.textContent=Math.floor(cur)+suf},28);
      o.unobserve(el);
    });
  },{threshold:0.5});
  document.querySelectorAll('.sc-n[data-count]').forEach(el=>obs.observe(el));
})();

/* ── STYLE SWITCHER ── */
(()=>{
  const tog=document.getElementById('sswTog'),ssw=document.getElementById('ssw');
  if(tog)tog.addEventListener('click',()=>ssw.classList.toggle('open'));
  document.querySelectorAll('.sw-cols span').forEach(s=>{
    s.addEventListener('click',()=>{
      const h=s.dataset.hue;
      document.documentElement.style.setProperty('--blood',`hsl(${h},75%,50%)`);
      document.documentElement.style.setProperty('--crimson',`hsl(${h-10},75%,55%)`);
      document.documentElement.style.setProperty('--darkred',`hsl(${h},50%,30%)`);
      document.documentElement.style.setProperty('--red',`hsl(${h},80%,60%)`);
      document.documentElement.style.setProperty('--accent',`hsl(${h},75%,50%)`);
    });
  });
  // Light/Dark toggle
  const lmTog=document.getElementById('lmTog'),lmIcon=document.getElementById('lmIcon'),lmLabel=document.getElementById('lmLabel');
  const html=document.documentElement;
  const saved=localStorage.getItem('drakaris-light');
  const sysLight=window.matchMedia('(prefers-color-scheme: light)').matches;
  if(saved==='true'||(!saved&&sysLight)){html.classList.add('light-mode');if(lmIcon)lmIcon.className='fas fa-sun';if(lmLabel)lmLabel.textContent='Dark';}
  if(lmTog){
    lmTog.addEventListener('click',()=>{
      const is=html.classList.toggle('light-mode');
      if(lmIcon)lmIcon.className=is?'fas fa-sun':'fas fa-moon';
      if(lmLabel)lmLabel.textContent=is?'Dark':'Light';
      localStorage.setItem('drakaris-light',is);
    });
  }
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change',e=>{
    if(localStorage.getItem('drakaris-light')!==null)return;
    if(e.matches){html.classList.add('light-mode');if(lmIcon)lmIcon.className='fas fa-sun';if(lmLabel)lmLabel.textContent='Dark';}
    else{html.classList.remove('light-mode');if(lmIcon)lmIcon.className='fas fa-moon';if(lmLabel)lmLabel.textContent='Light';}
  });
})();

/* ── BACK TO TOP ── */
(()=>{
  const btt=document.getElementById('btt');if(!btt)return;
  btt.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll',()=>btt.classList.toggle('show',window.scrollY>window.innerHeight*0.5));
})();

/* ── BAT SWARM ── */
(()=>{
  const DT='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M50,30 C44,22 30,20 16,24 C10,26 4,24 2,18 C2,14 4,10 6,8 C10,16 18,20 24,18 C18,10 12,4 6,0 C14,8 24,18 34,24 C42,28 48,30 50,30 C52,30 58,28 66,24 C76,18 86,8 94,0 C88,4 82,10 76,18 C82,20 90,16 94,8 C96,10 98,14 98,18 C96,24 90,26 84,24 C70,20 56,22 50,30 Z" fill="#000"/></svg>');
  const RD='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><path d="M50,30 C44,22 30,20 16,24 C10,26 4,24 2,18 C2,14 4,10 6,8 C10,16 18,20 24,18 C18,10 12,4 6,0 C14,8 24,18 34,24 C42,28 48,30 50,30 C52,30 58,28 66,24 C76,18 86,8 94,0 C88,4 82,10 76,18 C82,20 90,16 94,8 C96,10 98,14 98,18 C96,24 90,26 84,24 C70,20 56,22 50,30 Z" fill="#1a0202"/></svg>');
  const cls=['bat-1','bat-2','bat-3','bat-r'];
  const sw=document.createElement('div');sw.className='bat-swarm';document.body.appendChild(sw);
  for(let i=0;i<10;i++){
    const b=document.createElement('div');
    b.className='bat '+cls[Math.floor(Math.random()*cls.length)];
    const sz=24+Math.floor(Math.random()*60);
    b.style.cssText=`top:${5+Math.random()*85}vh;width:${sz}px;height:${Math.round(sz*0.55)}px;--dur:${14+Math.random()*18}s;--del:${Math.random()*25}s;animation-duration:var(--dur);animation-delay:var(--del);opacity:${(0.06+Math.random()*0.12).toFixed(3)}`;
    b.style.backgroundImage=`url("${i%3===0?RD:DT}")`;
    // Blood glow on every 2nd bat
    if(i%2===0)b.style.filter='drop-shadow(0 0 3px rgba(220,38,38,0.15))';
    sw.appendChild(b);
  }
})();
