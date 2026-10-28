/* ════════════════════════════════════════════════════════════
   UNIT — JS
   WebGL contour-field background, Three.js hero Aegis gate, skills marquee, project bento, GSAP/ScrollTrigger, Typed.js, terminal.
════════════════════════════════════════════════════════════ */

const REDUCE_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER  = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── THEME — one definitive palette, no toggle. onThemeChange/THEME_RETINT
   stay as harmless no-op plumbing so the WebGL scenes below (which call
   onThemeChange to wire up retinting) don't need to be touched. ── */
const THEME_RETINT = [];
function onThemeChange(fn){ THEME_RETINT.push(fn); }
function isLightMode(){ return false; }
function threePalette(){
  return { a:0x3fc6ff, b:0x9d4dff, c:0x39f3d6, aHex:'#3fc6ff', bHex:'#9d4dff', cHex:'#39f3d6' };
}

/* ── HUD CLOCK ── */
(()=>{
  const el=document.getElementById('clock');if(!el)return;
  function tick(){ el.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false}); }
  tick(); setInterval(tick,1000);
})();

/* ── NAV DOCK ── */
(()=>{
  const links=document.querySelectorAll('.navdock a');
  if(!links.length) return;
  const map=new Map();
  links.forEach(a=>{ const id=a.getAttribute('href').slice(1); const sec=document.getElementById(id); if(sec) map.set(sec,a); });
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      const a=map.get(en.target); if(!a) return;
      if(en.isIntersecting){ links.forEach(x=>x.classList.remove('active')); a.classList.add('active'); }
    });
  },{rootMargin:'-45% 0px -45% 0px'});
  map.forEach((a,sec)=>obs.observe(sec));
})();

/* ── CURSOR ── */
(()=>{
  if(!FINE_POINTER) return;
  const dot=document.getElementById('curDot'),ring=document.getElementById('curRing');
  if(!dot||!ring) return;
  document.documentElement.classList.add('has-cursor');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
  document.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    dot.style.transform=`translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
  });
  (function loop(){
    rx+=(mx-rx)*0.18;ry+=(my-ry)*0.18;
    ring.style.transform=`translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover',e=>{
    ring.classList.toggle('big', !!e.target.closest('a,button,.arr-fb,.skill-item,.bento-card'));
  });
})();

/* ── LIVING BACKGROUND — a full-page WebGL2 contour field. Domain-warped noise
   becomes flowing topographic energy lines: they bend away from the cursor and
   light up around it, drift with scroll, and the palette slides from ice-blue
   through teal to indigo down the page. Drawn at reduced resolution (the glass
   panels blur it anyway), paused when the tab is hidden, one still frame under
   reduced motion. If WebGL2 is unavailable the CSS gradient on <body> remains. ── */
(()=>{
  const canvas=document.getElementById('bgGL'); if(!canvas) return;
  const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,powerPreference:'high-performance'}); if(!gl) return;
  const VS=`#version 300 es
  in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;
  const FS=`#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uEnergy;
  float h(vec2 p){ p=fract(p*vec2(.1031,.1030)); p+=dot(p,p.yx+33.33); return fract((p.x+p.y)*p.x); }
  float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float v=0.,a=.5; mat2 m=mat2(.8,.6,-.6,.8)*2.03; for(int i=0;i<5;i++){ v+=a*n(p); p=m*p; a*=.5; } return v; }
  void main(){
    vec2 uv=gl_FragCoord.xy/uRes;
    vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
    vec2 m=(uMouse-.5)*vec2(uRes.x/uRes.y,1.);
    float t=uTime*.035;
    vec2 d=p-m; float r=length(d);
    p+=d/(r+.08)*exp(-r*2.6)*.11*(.6+uEnergy);          // the field bends away from the cursor
    p+=vec2(uScroll*.6,uScroll*2.4);                      // and drifts as the page scrolls
    vec2 q=vec2(fbm(p*1.15+vec2(t,-.6*t)),fbm(p*1.15+vec2(5.2,1.3)-vec2(.8*t,t)));
    float f=fbm(p*1.05+2.1*q+vec2(0.,t*.5));
    float s1=smoothstep(.25,.55,uScroll), s2=smoothstep(.65,.95,uScroll);
    vec3 cA=mix(vec3(.10,.58,.98),vec3(.08,.85,.78),s1*.65);
    vec3 cB=mix(vec3(.44,.30,.98),vec3(.30,.34,.98),s2*.6);
    vec3 col=mix(vec3(.010,.016,.040),vec3(.020,.034,.078),smoothstep(.25,.85,f));
    col+=cA*smoothstep(.50,.95,f)*.17+cB*smoothstep(.50,.9,q.y)*.15;
    float lv=f*17.;
    float l1=1.-smoothstep(0.,fwidth(lv)*1.35,abs(fract(lv)-.5));
    float lv2=lv/4.;
    float l2=1.-smoothstep(0.,fwidth(lv2)*1.6,abs(fract(lv2)-.5));
    float reveal=smoothstep(.22,.85,fbm(p*.6+vec2(3.,-t*.8)+q*.5));
    float spot=exp(-r*r*5.5);
    float k=(.30+1.9*spot*(.5+uEnergy))*(.58+.42*reveal);
    vec3 lc=mix(cB,cA,smoothstep(.3,.75,f));
    float g=fbm(p*2.2+q*1.5+vec2(-t*.6,t*.3));                 // finer second field: texture everywhere
    float lv3=g*28.;
    float l3=1.-smoothstep(0.,fwidth(lv3)*1.3,abs(fract(lv3)-.5));
    col+=lc*(l1*.42+l2*.9)*k*.56 + lc*l3*k*.30*(.5+.5*reveal);
    col+=cA*spot*.06;
    col+=(h(gl_FragCoord.xy+uTime)-.5)/255.;                // dither: no banding in the dark ramps
    o=vec4(col,1.);
  }`;
  const mk=(type,src)=>{ const sh=gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh); return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null; };
  const vs=mk(gl.VERTEX_SHADER,VS), fs=mk(gl.FRAGMENT_SHADER,FS); if(!vs||!fs) return;
  const pr=gl.createProgram(); gl.attachShader(pr,vs); gl.attachShader(pr,fs); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={}; ['uRes','uTime','uMouse','uScroll','uEnergy'].forEach(k=>U[k]=gl.getUniformLocation(pr,k));

  let W=1,H=1;
  function resize(){
    const sc=innerWidth<760?0.5:0.7;
    W=Math.max(2,Math.round(innerWidth*sc)); H=Math.max(2,Math.round(innerHeight*sc));
    if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; }
    gl.viewport(0,0,W,H);
  }
  window.addEventListener('resize',resize); resize();

  let mx=.62,my=.55,tx=.62,ty=.55,energy=0,sc=0;
  if(!REDUCE_MOTION) window.addEventListener('pointermove',e=>{
    const nx=e.clientX/innerWidth, ny=1-e.clientY/innerHeight;
    energy=Math.min(1,energy+Math.hypot(nx-tx,ny-ty)*6); tx=nx; ty=ny;
  },{passive:true});
  const scrollProg=()=>{ const m=document.documentElement.scrollHeight-innerHeight; sc=m>0?Math.min(1,Math.max(0,scrollY/m)):0; };
  window.addEventListener('scroll',scrollProg,{passive:true}); scrollProg();

  function draw(t){
    mx+=(tx-mx)*0.07; my+=(ty-my)*0.07; energy*=0.94;
    gl.uniform2f(U.uRes,W,H); gl.uniform1f(U.uTime,t); gl.uniform2f(U.uMouse,mx,my);
    gl.uniform1f(U.uScroll,sc); gl.uniform1f(U.uEnergy,energy);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  if(REDUCE_MOTION){ draw(9); window.addEventListener('resize',()=>draw(9)); return; }
  const t0=performance.now();
  (function loop(){ draw(9+(performance.now()-t0)/1000); requestAnimationFrame(loop); })();
})();

/* ── HERO AEGIS GATE — a holographic arch portal behind the walk-in. Two nested
   glowing arches draw themselves upward as the boot doors open; between them
   a light-curtain of vertical streaks climbs while a scan band sweeps the
   height; light motes rise past; and a radar-pulse platform sits under his
   feet. Everything is in local units where 1 = the walker's height, anchored
   to him in layout(). Transparent wherever dark (a final pass turns brightness
   into alpha), so only emitted light composites over the contour field. ── */
(()=>{
  if(typeof THREE==='undefined') return;
  const canvas=document.getElementById('heroGate');if(!canvas) return;
  // No WebGL (old GPU, blocklisted driver, privacy mode) → skip the scene
  // instead of throwing and killing every script block after this one.
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'}); }catch(err){ return; }
  const DPR=Math.min(devicePixelRatio||1,1.5);
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,0.1,100);
  camera.position.set(0,0,10);

  const uTime={value:0}, uReveal={value:0};
  const rig=new THREE.Group(); scene.add(rig);
  const ADD={transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide};
  const CYAN='vec3(0.27,0.85,1.0)', VIOLET='vec3(0.61,0.42,1.0)';

  // arch outline as a path from bottom-left, up, over the top, down to bottom-right
  const YB=-0.52;                                           // base (just under his feet)
  function archPts(w,top){
    const r=w/2, yc=top-r, pts=[];
    for(let i=0;i<=24;i++) pts.push([-r, YB+(yc-YB)*i/24]);
    for(let i=1;i<=72;i++){ const a=Math.PI-Math.PI*i/72; pts.push([r*Math.cos(a), yc+r*Math.sin(a)]); }
    for(let i=1;i<=24;i++) pts.push([r, yc+(YB-yc)*i/24]);
    return pts;
  }
  // thin glowing ribbon along a path (WebGL lines are 1px; a ribbon gets real width + bloom)
  function ribbon(pts,hw,alpha,z,speed){
    const n=pts.length, pos=[], aY=[], aU=[], idx=[]; let len=0; const L=[0];
    for(let i=1;i<n;i++){ len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); L.push(len); }
    const top=Math.max(...pts.map(p=>p[1])), h=top-YB;
    for(let i=0;i<n;i++){
      const a=pts[Math.max(0,i-1)], b=pts[Math.min(n-1,i+1)];
      let tx=b[0]-a[0], ty=b[1]-a[1]; const m=Math.hypot(tx,ty)||1; tx/=m; ty/=m;
      const nx=-ty, ny=tx, yN=(pts[i][1]-YB)/h;
      pos.push(pts[i][0]+nx*hw,pts[i][1]+ny*hw,z, pts[i][0]-nx*hw,pts[i][1]-ny*hw,z);
      aY.push(yN,yN); aU.push(L[i]/len,L[i]/len);
      if(i<n-1){ const k=i*2; idx.push(k,k+1,k+2, k+1,k+3,k+2); }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('aY',new THREE.Float32BufferAttribute(aY,1));
    g.setAttribute('aU',new THREE.Float32BufferAttribute(aU,1));
    g.setIndex(idx);
    const m=new THREE.Mesh(g,new THREE.ShaderMaterial({
      uniforms:{uTime,uReveal,uAlpha:{value:alpha},uSpd:{value:speed}}, ...ADD,
      vertexShader:`attribute float aY; attribute float aU; varying float vY; varying float vU;
        void main(){ vY=aY; vU=aU; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`uniform float uTime; uniform float uReveal; uniform float uAlpha; uniform float uSpd; varying float vY; varying float vU;
        void main(){
          float front=uReveal*1.08;                                    // drawn bottom → top
          float on=smoothstep(front,front-0.07,vY);
          float pulse=pow(fract(vU-uTime*uSpd),9.0);                   // a bright head circling the arch
          vec3 c=mix(${CYAN},${VIOLET},smoothstep(0.1,1.0,vY));
          float a=uAlpha*on*(0.7+pulse*1.0);
          gl_FragColor=vec4(mix(c,vec3(0.9,0.98,1.0),pulse*0.35)*a,a);
        }`
    }));
    rig.add(m); return m;
  }
  const outer=ribbon(archPts(0.84,0.57),0.0045,0.85,-0.02,0.07);       // crown clears the masthead, just above his head (+0.5)
  const inner=ribbon(archPts(0.74,0.51),0.0016,0.45,0.0,-0.05);

  // light-curtain fill between the arches: vertical streaks that climb, a scan band, a base glow
  const shp=new THREE.Shape(); { const r=0.37, yc=0.51-r; shp.moveTo(-r,YB); shp.lineTo(-r,yc); shp.absarc(0,yc,r,Math.PI,0,true); shp.lineTo(r,YB); shp.closePath(); }
  const fill=new THREE.Mesh(new THREE.ShapeGeometry(shp,48),new THREE.ShaderMaterial({
    uniforms:{uTime,uReveal}, ...ADD,
    vertexShader:`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform float uTime; uniform float uReveal; varying vec3 vP;
      void main(){
        float yN=(vP.y+0.52)/1.03;           // 0 at the base → 1 at the crown
        float on=smoothstep(uReveal*1.08,uReveal*1.08-0.1,yN);
        float x=vP.x;
        float streak=pow(0.5+0.5*sin(x*150.0+sin(vP.y*9.0-uTime*1.1)*2.2+uTime*0.6),7.0);
        float climb=0.55+0.45*sin(vP.y*14.0-uTime*2.4+x*9.0);
        float base=pow(1.0-yN,2.4);
        float band=exp(-pow((yN-fract(uTime*0.15))*10.0,2.0));
        float side=smoothstep(0.0,0.35,0.4-abs(x))*0.8+0.2;           // a little brighter toward the arch centre
        float a=(0.05+base*0.26+streak*climb*0.17*(1.0-yN*0.5)+band*0.30)*side*on;
        vec3 c=mix(${CYAN},${VIOLET},smoothstep(0.15,1.0,yN));
        gl_FragColor=vec4(mix(c,vec3(0.85,0.97,1.0),band*0.5)*a,a);
      }`
  }));
  fill.position.z=-0.03; rig.add(fill);

  // platform under his feet: ellipses (rings tilted toward the viewer), a radar sweep, expanding pulses
  const floor=new THREE.Group(); floor.position.set(0,-0.468,-0.01); floor.rotation.x=1.2; rig.add(floor);
  const ringMat=(r0,r1,alpha)=>new THREE.Mesh(new THREE.RingGeometry(r0,r1,128),new THREE.ShaderMaterial({
    uniforms:{uTime,uReveal,uA:{value:alpha}}, ...ADD,
    vertexShader:`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform float uReveal; uniform float uA; varying vec2 vP;
      void main(){ float on=smoothstep(0.0,0.35,uReveal); float a=uA*on; gl_FragColor=vec4(${CYAN}*a,a); }`
  }));
  floor.add(ringMat(0.335,0.34,0.9), ringMat(0.52,0.523,0.45));
  // dashed tick dial with a sweeping highlight
  const dial=new THREE.Mesh(new THREE.RingGeometry(0.43,0.447,160),new THREE.ShaderMaterial({
    uniforms:{uTime,uReveal}, ...ADD,
    vertexShader:`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform float uTime; uniform float uReveal; varying vec2 vP;
      void main(){ float u=atan(vP.y,vP.x)/6.2831853+0.5;
        float dash=step(0.5,fract(u*96.0)); float major=step(0.84,fract(u*96.0/6.0));
        float sweep=pow(fract(u-uTime*0.09),6.0);
        float a=(dash*(0.16+major*0.2)+sweep*0.9)*smoothstep(0.0,0.4,uReveal);
        gl_FragColor=vec4(${CYAN}*a,a); }`
  }));
  floor.add(dial);
  // radar wedge inside the platform
  const radar=new THREE.Mesh(new THREE.CircleGeometry(0.34,96),new THREE.ShaderMaterial({
    uniforms:{uTime,uReveal}, ...ADD,
    vertexShader:`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform float uTime; uniform float uReveal; varying vec2 vP;
      void main(){ float r=length(vP)/0.34; float u=atan(vP.y,vP.x)/6.2831853+0.5;
        float wedge=pow(fract(u+uTime*0.22),3.2);
        float a=(wedge*0.30*(1.0-r*0.25)+0.05*(1.0-r))*smoothstep(0.1,0.5,uReveal);
        gl_FragColor=vec4(mix(${CYAN},${VIOLET},r)*a,a); }`
  }));
  floor.add(radar);
  const pulses=[0,1].map(k=>{
    const m=new THREE.Mesh(new THREE.RingGeometry(0.995,1.0,128),new THREE.MeshBasicMaterial({color:0x7fdcff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
    m.userData.ph=k*0.5; floor.add(m); return m;
  });

  // rising light motes
  const MN=innerWidth<980?60:140, mp=new Float32Array(MN*3), ms=[];
  for(let i=0;i<MN;i++){ mp[i*3]=(Math.random()*2-1)*0.38; mp[i*3+1]=0; mp[i*3+2]=Math.random()*0.2-0.1; ms.push(Math.random()); }
  const mg=new THREE.BufferGeometry(); mg.setAttribute('position',new THREE.Float32BufferAttribute(mp,3)); mg.setAttribute('aS',new THREE.Float32BufferAttribute(ms,1));
  mg.boundingSphere=new THREE.Sphere(new THREE.Vector3(),3);
  const uPx={value:2};
  rig.add(new THREE.Points(mg,new THREE.ShaderMaterial({
    uniforms:{uTime,uPx,uReveal}, ...ADD,
    vertexShader:`attribute float aS; uniform float uTime; uniform float uPx; uniform float uReveal; varying float vA;
      void main(){ vec3 p=position; float f=fract(aS*5.0+uTime*(0.035+aS*0.05));
        p.y=mix(-0.5,0.66,f); p.x+=sin(f*6.28+aS*30.0)*0.025;
        vA=sin(f*3.14159)*(0.35+aS*0.6)*smoothstep(0.3,0.9,uReveal);
        gl_PointSize=uPx*(0.6+aS*1.1); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader:`varying float vA; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard;
      float a=smoothstep(0.5,0.0,d)*vA; gl_FragColor=vec4(vec3(0.6,0.88,1.0)*a,a); }`
  })));

  let composer=null;
  if(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass){
    composer=new THREE.EffectComposer(renderer);
    composer.setPixelRatio(DPR);
    composer.addPass(new THREE.RenderPass(scene,camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(512,512),1.0,0.6,0.03));
    // brightness → premultiplied alpha, so the canvas composites like a screen blend
    // against whatever sits behind it (the page's contour field) with no CSS blend mode
    if(THREE.ShaderPass) composer.addPass(new THREE.ShaderPass({
      uniforms:{tDiffuse:{value:null}},
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader:`uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); gl_FragColor=vec4(c.rgb,clamp(max(c.r,max(c.g,c.b)),0.,1.)); }`
    }));
  }

  // anchored on the walker: local unit = his height, origin = the middle of his box
  function layout(){
    const w=canvas.clientWidth||innerWidth, h=canvas.clientHeight||innerHeight;
    renderer.setSize(w,h,false); if(composer) composer.setSize(w,h);
    camera.aspect=w/h; camera.updateProjectionMatrix();
    const visH=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z, visW=visH*camera.aspect;
    // offset* are layout boxes, so the walker's entrance transform doesn't skew this
    const wk=document.getElementById('heroWalker');
    let cx=0.66, cy=0.5, U=h*0.7;
    if(wk&&wk.offsetHeight){ cx=(wk.offsetLeft+wk.offsetWidth/2)/w; cy=(wk.offsetTop+wk.offsetHeight/2)/h; U=wk.offsetHeight; }
    rig.position.set(-visW/2+visW*cx, visH/2-visH*cy, 0);
    const sc=visH*(U/h), narrow=w<980;
    rig.scale.set(narrow?sc*0.52:sc, sc, sc);          // phones: squeeze the arch so it frames the figure instead of running off-screen
    uPx.value=Math.max(1.6,U*0.0034)*DPR;
  }
  window.addEventListener('resize',layout); layout();

  let mx=0,my=0,sx=0,sy=0;
  window.addEventListener('mousemove',e=>{ mx=e.clientX/innerWidth-0.5; my=e.clientY/innerHeight-0.5; },{passive:true});

  // the gate draws itself as the boot doors open (1.7s ease-out), then breathes
  let t0=null;
  const clock=new THREE.Clock();
  const startReveal=()=>{ if(t0===null) t0=clock.getElapsedTime(); };
  if(window.__bootDone || !document.getElementById('boot')) startReveal(); else document.addEventListener('boot:done',startReveal,{once:true});

  function draw(t){
    uTime.value=t;
    const k=t0===null?0:Math.min(1,(t-t0)/1.7); uReveal.value=1-Math.pow(1-k,3);
    sx+=(mx-sx)*0.04; sy+=(my-sy)*0.04;
    rig.rotation.y=sx*0.24; rig.rotation.x=sy*0.08;
    outer.position.z=-0.02+sx*0.0; inner.rotation.z=Math.sin(t*0.3)*0.004;
    floor.rotation.z=t*0.0;
    pulses.forEach(r=>{ const f=((t*0.42+r.userData.ph)%1); r.scale.setScalar(0.32+f*0.62); r.material.opacity=(1-f)*(1-f)*0.8*uReveal.value; });
    composer ? composer.render() : renderer.render(scene,camera);
  }
  if(REDUCE_MOTION){ uReveal.value=1; t0=-9; draw(7.1); return; }   // 7.1s parks the arch's pulse head on the crown

  let rafId=null;
  function tick(){ draw(clock.getElapsedTime()); rafId=requestAnimationFrame(tick); }
  new IntersectionObserver(([e])=>{
    if(e.isIntersecting){ if(!rafId) tick(); }
    else if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
  },{threshold:0.01}).observe(document.querySelector('.hero-zone'));
})();

/* ── HERO WALK-IN — plays the transparent clip once as the boot doors open,
   then holds the final frame. Scrolling away and back replays it. Reduced
   motion (or any playback failure) falls back to the last-frame still. ── */
(()=>{
  const box=document.getElementById('heroWalker'), v=document.getElementById('heroWalk');
  if(!box||!v) return;
  const still=()=>box.classList.add('is-still');
  if(REDUCE_MOTION){ still(); return; }
  v.addEventListener('error',still);
  const go=()=>{ const p=v.play(); if(p&&p.catch) p.catch(still); };
  if(window.__bootDone || !document.getElementById('boot')) go();
  else document.addEventListener('boot:done',go,{once:true});
  let away=false;
  new IntersectionObserver(([e])=>{
    if(e.intersectionRatio<0.12) away=true;
    else if(away && e.intersectionRatio>0.6 && v.ended){ away=false; v.currentTime=0; go(); }
  },{threshold:[0.05,0.12,0.6]}).observe(document.querySelector('.hero-zone'));
})();

/* ── HERO PHOTO 3D TILT (cursor-driven parallax on the portrait) ── */
(()=>{
  if(!FINE_POINTER || REDUCE_MOTION) return;
  const hero=document.querySelector('.hero-zone'), wrap=document.querySelector('.hero-photo-wrap');
  if(!hero||!wrap) return;
  hero.addEventListener('mousemove',e=>{
    const r=hero.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
    wrap.style.setProperty('--tx',(px*3.2)+'deg');
    wrap.style.setProperty('--ty',(-py*2.4)+'deg');
  });
  hero.addEventListener('mouseleave',()=>{ wrap.style.setProperty('--tx','0deg'); wrap.style.setProperty('--ty','0deg'); });
})();

/* ── GLASS CARD 3D TILT (contact rows, commendation cards, and the bigger
   panels at a gentler angle so they tilt without warping) ── */
(()=>{
  if(!FINE_POINTER || REDUCE_MOTION) return;
  function wireTilt(selector,deg){
    document.querySelectorAll(selector).forEach(el=>{
      el.addEventListener('mousemove',e=>{
        const r=el.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
        el.style.transform=`perspective(900px) rotateY(${px*deg}deg) rotateX(${-py*deg}deg) translateY(-3px) translateZ(8px)`;
      });
      el.addEventListener('mouseleave',()=>{ el.style.transform=''; });
    });
  }
  wireTilt('.up-chan, .rec, .dz-cap', 5);
  wireTilt('.dz-id, .dz-lead, .dz-card, .log-col', 2.2);
  wireTilt('.dz-kpi', 6);
})();

/* ── LIQUID GLASS GLINT — every frosted surface tracks the cursor and
   brightens a soft specular highlight under it (the --gx/--gy vars the
   .glass::after / .car-panel::after etc. rules in style.css read). ── */
(()=>{
  if(!FINE_POINTER) return;
  const SEL='.glass, .bx-s';
  document.addEventListener('pointermove',e=>{
    for(let el=e.target.closest?.(SEL); el; el=el.parentElement?.closest(SEL)){
      const r=el.getBoundingClientRect();
      el.style.setProperty('--gx',((e.clientX-r.left)/r.width*100)+'%');
      el.style.setProperty('--gy',((e.clientY-r.top)/r.height*100)+'%');
    }
  });
})();

/* ── NEURAL ARRAY — WebGL orbiting skill cluster. Each category gets its
   own vivid, distinct neon color (cloud=sky-blue, tools=neon-purple,
   core=hot-rose) instead of one uniform tint cycling arbitrarily — the
   whole point being the cluster should read as colorful at a glance. ── */
const CAT_COLOR={ cloud:'#3fc6ff', tools:'#a855ff', core:'#ff4d8d' };
function svgBadge(label,fill,size){
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="14" fill="${fill}"/><text x="40" y="52" text-anchor="middle" fill="#0b0613" font-size="${size}" font-weight="800" font-family="Arial">${label}</text></svg>`);
}
/* local icon files — previously inlined as ~240KB of base64 in this script */
const ICON_FILES={
  aws:'img/icons/aws.webp',
  azure:'img/icons/azure.webp',
  gcp:'img/icons/gcp.webp',
  burpsuite:'img/icons/burpsuite.webp',
  zap:'img/icons/zap.webp',
  trivy:'img/icons/trivy.webp',
  snyk:'img/icons/snyk.webp',
  checkmarx:'img/icons/checkmarx.webp',
  jenkins:'img/icons/jenkins.webp',
  falco:'img/icons/falco.webp',
  cilium:'img/icons/cilium.webp',
  kubearmor:'img/icons/kubearmor.webp',
  calico:'img/icons/calico.webp',
  kubeBench:'img/icons/kubeBench.webp',
};
const SKILL_DATA=[
  {n:'AWS',        cat:'cloud', i:ICON_FILES.aws},
  {n:'Azure',      cat:'cloud', i:ICON_FILES.azure},
  {n:'GCP',        cat:'cloud', i:ICON_FILES.gcp},
  {n:'Kubernetes', cat:'cloud', i:'https://cdn.simpleicons.org/kubernetes/326CE5'},
  {n:'Docker',     cat:'cloud', i:'https://cdn.simpleicons.org/docker/2496ED'},
  {n:'Linux',      cat:'cloud', i:'https://cdn.simpleicons.org/linux/FCC624'},
  {n:'Python',     cat:'tools', i:'https://cdn.simpleicons.org/python/3776AB'},
  {n:'Bash',       cat:'tools', i:'https://cdn.simpleicons.org/gnubash/4EAA25'},
  {n:'Burp Suite', cat:'tools', i:ICON_FILES.burpsuite},
  {n:'OWASP ZAP',  cat:'tools', i:ICON_FILES.zap},
  {n:'Trivy',      cat:'tools', i:ICON_FILES.trivy},
  {n:'Snyk',       cat:'tools', i:ICON_FILES.snyk},
  {n:'SonarQube',  cat:'tools', i:svgBadge('SQ',CAT_COLOR.tools,30)},
  {n:'Checkmarx',  cat:'tools', i:ICON_FILES.checkmarx},
  {n:'Jenkins',    cat:'tools', i:ICON_FILES.jenkins},
  {n:'Falco',      cat:'tools', i:ICON_FILES.falco},
  {n:'Cilium',     cat:'tools', i:ICON_FILES.cilium},
  {n:'KubeArmor',  cat:'tools', i:ICON_FILES.kubearmor},
  {n:'Calico',     cat:'tools', i:ICON_FILES.calico},
  {n:'kube-bench', cat:'tools', i:ICON_FILES.kubeBench},
  {n:'Splunk',     cat:'tools', i:'https://cdn.simpleicons.org/splunk/e9edf5'},
  {n:'GH Actions', cat:'tools', i:'https://cdn.simpleicons.org/githubactions/2088FF'},
  {n:'Vuln Mgmt',  cat:'core', i:svgBadge('VM',CAT_COLOR.core,28)},
  {n:'Incident Resp', cat:'core', i:svgBadge('IR',CAT_COLOR.core,28)},
  {n:'Compliance', cat:'core', i:svgBadge('C&amp;A',CAT_COLOR.core,22)},
  {n:'Threat Model', cat:'core', i:svgBadge('TM',CAT_COLOR.core,28)},
  {n:'DevSecOps',  cat:'core', i:svgBadge('DO',CAT_COLOR.core,28)},
  {n:'Pentest',    cat:'core', i:svgBadge('PT',CAT_COLOR.core,28)},
  {n:'Risk Assess', cat:'core', i:svgBadge('RA',CAT_COLOR.core,28)},
  {n:'IAM',        cat:'core', i:svgBadge('IAM',CAT_COLOR.core,22)},
  {n:'Audits',     cat:'core', i:svgBadge('SA',CAT_COLOR.core,28)},
];

/* ── BENTO GRID INJECTIONS ── */
const PROJECT_DATA=[
  { name: 'sandman', status: 'ACTIVE', class: 'feat', tech: ['python', 'gnubash', 'docker'], title: 'Sandman', desc: 'Unified security scanning CLI — Trivy, Opengrep, OWASP ZAP, ClamAV. SAST, DAST, IaC, malware.', link: 'https://github.com/th3-v3ng34nc3/sandman', linkText: 'Source', icon: 'github' },
  { name: 'sandman-web', status: 'LIVE', statusClass: 'live', tech: ['typescript', 'react', 'nextdotjs/e2e8f8'], title: 'Sandman Web', desc: 'VAPT Reporter — streamlined report creation & delivery. Next.js platform.', link: 'https://sandman-web-seven.vercel.app/', linkText: 'Demo', icon: 'external-link-alt' },
  { name: 'sandman-pt', status: 'PRIVATE', tech: ['python', 'gnubash', 'docker'], title: 'Sandman PT', desc: 'Automated VAPT orchestration chaining 15 tools, CVSS × EPSS scoring.', link: 'https://github.com/th3-v3ng34nc3/sandman-pt', linkText: 'Source', icon: 'github' },
  { name: 'sandmancer', status: 'CLI', tech: ['python', 'gnubash', 'docker'], title: 'Sandmancer', desc: 'Recon, enumeration, exploitation — intelligent prioritisation.', link: 'https://github.com/th3-v3ng34nc3', linkText: 'Source', icon: 'github' },
  { name: 'security-veda', status: 'LIVE', statusClass: 'live', class: 'wide', techIcon: 'book-skull', title: 'Security Veda', desc: 'Curated security knowledge platform. Learning paths for cloud security, K8s hardening, DevSecOps & compliance.', link: 'https://th3-v3ng34nc3.github.io/SecurityVeda/', linkText: 'Live', icon: 'external-link-alt' },
  { name: 'sandman-osint', status: 'OSINT', tech: ['python', 'gnubash', 'selenium'], title: 'Sandman OSINT', desc: 'Public data aggregation, passive recon, footprint mapping.', link: 'https://github.com/th3-v3ng34nc3', linkText: 'Source', icon: 'github' },
  { name: 'se-training', status: 'LIVE', statusClass: 'live', class: 'wide', tech: ['typescript', 'react', 'tailwindcss'], title: 'SE Training Plan', desc: 'Training tracker — goal-setting, dashboards, cert roadmaps.', link: 'https://th3-v3ng34nc3.github.io/SE-Training-Plan/', linkText: 'Demo', icon: 'external-link-alt' }
];

// Skills marquee — two counter-moving rows; the category filter dims the rest
// rather than removing it, so the loop never jumps
(()=>{
  const tracks=[...document.querySelectorAll('#skillMarquee .mq-track')];
  if(!tracks.length) return;
  const half=Math.ceil(SKILL_DATA.length/2), sets=[SKILL_DATA.slice(0,half),SKILL_DATA.slice(half)];
  const card=sk=>{
    const c=CAT_COLOR[sk.cat]||CAT_COLOR.cloud;
    return `<div class="sk-card glass" data-cat="${sk.cat}" style="--skill-color:${c}"><img src="${sk.i}" alt="" width="40" height="40" draggable="false" decoding="async"><div class="sk-txt"><h4>${sk.n}</h4><span>${sk.cat}</span></div></div>`;
  };
  tracks.forEach((t,i)=>{ const html=sets[i].map(card).join(''); t.innerHTML=html+html; });   // 2nd copy = seamless loop
  const btns=document.querySelectorAll('.arr-fb');
  btns.forEach(b=>b.addEventListener('click',()=>{
    btns.forEach(x=>x.classList.toggle('active',x===b));
    const f=b.dataset.f;
    document.querySelectorAll('.sk-card').forEach(c=>c.classList.toggle('dim',f!=='all'&&c.dataset.cat!==f));
  }));
})();

// ── GSAP SCROLL REVEALS ──
(()=>{
  const targets=document.querySelectorAll('.sx, .hero-grid');
  if(!window.gsap){ targets.forEach(el=>el.style.opacity=1); return; }
  gsap.registerPlugin(ScrollTrigger);
  if(REDUCE_MOTION){ targets.forEach(el=>el.style.opacity=1); return; }

  // Staggered section reveals with ScrollTrigger
  document.querySelectorAll('.sx').forEach(el=>{
    gsap.fromTo(el.children,
      {opacity:0,y:32},
      {opacity:1,y:0,duration:1,ease:'power3.out',stagger:0.06,
        scrollTrigger:{trigger:el,start:'top 85%',once:true,
          onEnter:()=>el.classList.add('in-view')}
        });
  });

  // Parallax index numbers
  document.querySelectorAll('.sx-idx').forEach(el=>{
    gsap.to(el, {yPercent: 40, ease: 'none', scrollTrigger: {trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true}});
  });

  // Hero intro is built paused (so its start state applies under the boot
  // doors) and plays as the doors swing open.
  const heroIntro=gsap.timeline({paused:true})
    .from('.hero-eyebrow,.hero-name,.hero-role,.hero-tag,.hero-actions,.hero-social',{opacity:0,y:26,duration:1,ease:'power3.out',stagger:0.08},0.35)
    .from('.hero-walker',{opacity:0,y:26,filter:'blur(10px)',duration:1.1,ease:'power3.out'},0.15)
    .from('.hero-chip',{opacity:0,y:16,duration:1,ease:'power2.out',stagger:0.12},0.7);
  if(window.__bootDone || !document.getElementById('boot')) heroIntro.play();
  else document.addEventListener('boot:done',()=>heroIntro.play(),{once:true});
})();

// Inject Projects Bento
// icons come from the inline sprite in index.html (#i-<name>)
function icon(name){
  const vb=document.getElementById('i-'+name)?.getAttribute('viewBox')||'0 0 512 512';
  return `<svg class="ic" viewBox="${vb}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}
(()=>{
  const container = document.getElementById('projectBento');
  if(!container) return;

  container.innerHTML = PROJECT_DATA.map(p => {
    let techHtml = '';
    if(p.tech) {
      techHtml = p.tech.map(t => `<img src="https://cdn.simpleicons.org/${t}" alt="${t.split('/')[0]}" width="22" height="22" loading="lazy" decoding="async">`).join('');
    } else if(p.techIcon) {
      techHtml = `<span style="color:var(--accent)">${icon(p.techIcon)}</span>`;
    }

    return `
      <div class="bento-card glass ${p.class || ''}">
        <div class="card-head">
          <span class="card-tag ${p.statusClass || ''}">${p.status}</span>
          <div class="card-tech">${techHtml}</div>
        </div>
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <div class="card-foot">
          <a href="${p.link}" target="_blank" class="car-l">${icon(p.icon)} ${p.linkText}</a>
        </div>
      </div>
    `;
  }).join('');

  if(window.gsap && window.ScrollTrigger && !REDUCE_MOTION){
    gsap.from(container.children,{opacity:0,y:28,duration:.8,ease:'power3.out',stagger:.07,
      scrollTrigger:{trigger:container,start:'top 85%',once:true}});
  }
})();

/* ── PROFILE DATA — one source for the career chart and the terminal ── */
const ME={
  name:'Aditya Raj', handle:'th3-v3ng34nc3', role:'Senior Security Engineer', org:'AccuKnox',
  email:'adityasinghusa1@gmail.com', phone:'+91 6207338299',
  site:'https://th3-v3ng34nc3.github.io',
  links:{ linkedin:'https://www.linkedin.com/in/th3-v3ng34nc3/', github:'https://github.com/th3-v3ng34nc3', tryhackme:'https://tryhackme.com/p/th3-v3ng34nc3', resume:'img/cv.html', pdf:'img/cv.pdf' },
  about:[
    'Senior Security Engineer with 3+ years hunting through cloud-native, hybrid and on-premise',
    'infrastructure — multi-cloud (AWS, Azure, GCP), Kubernetes clusters and enterprise apps.',
    'Architects end-to-end security postures weaving CNAPP, CSPM, CWPP, KSPM and AppSec into one',
    'coherent, compliance-driven strategy.'
  ],
  exp:[
    { role:'Senior Security Engineer', org:'AccuKnox', range:'Mar 2023 — Present', s:2023+2/12, e:null, bullets:[
      'Security assessment program mitigating vulnerabilities in critical IT systems',
      'Managed SIEM for real-time threat detection & incident response',
      'Cloud security controls aligned to ISO 27001, CIS, NIST, SOC 2',
      'Automated compliance engine (CIS & STIG) — cut manual audit effort 80% across 200+ systems',
      'CNAPP for multi-cloud & Kubernetes security posture management',
      'Operationalised RBI CSF, SAMA CSF, SEBI CSCRF & DPDP into the CSPM product' ] },
    { role:'AppSec Intern', org:'CyberXplore Pvt Ltd', range:'Jan — Jun 2022', s:2022, e:2022.5, bullets:[
      'Web application, network & Android penetration testing',
      'Prepared detailed pentest reports of findings' ] }
  ],
  edu:[
    { t:'B.Tech — CS & Engineering', o:'Lovely Professional University', lab:'Lovely Professional University', p:'Phagwara', range:'2019 – 2023', s:2019, e:2023, x:'Minors: Cyber Security' },
    { t:'Senior Secondary School', o:'Patna Central School', lab:'Patna Central', p:'Patna', range:'2017 – 2019', s:2017, e:2019 },
    { t:'Secondary School', o:'Indian Public School', lab:'Indian Public School', p:'Hajipur', range:'2013 – 2017', s:2013, e:2017 }
  ],
  certs:[
    { n:'eJPT', t:'Junior Penetration Tester', o:'eLearnSecurity', range:'Jul 2021 – Present', s:2021+6/12, e:null },
    { n:'C|EH', t:'Certified Ethical Hacker', o:'EC-Council', range:'Mar 2022 – Mar 2025', s:2022+2/12, e:2025+2/12 },
    { n:'CKA', t:'Certified Kubernetes Administrator', o:'Linux Foundation', range:'Oct 2023', s:2023+9/12, e:2023+9/12 }
  ],
  awards:[
    { tag:'Award', t:'Employee of the Month ×2', d:'Recognised twice for exceptional dedication at AccuKnox.' },
    { tag:'Award', t:'Most Dedicated Employee', d:'Quarterly honour for exemplary customer security management.' },
    { tag:'Delivery', t:'Compliance Framework Integration', d:'DPDP, RBI CSF, SAMA CSF, SEBI CSCRF, CIS & ISO 27001 into the CSPM product.' },
    { tag:'Delivery', t:'Automated Compliance Engine', d:'CIS/STIG engine — cut manual audit effort 80% across 200+ systems.' },
    { tag:'Delivery', t:'Centralised SIEM', d:'Implemented for real-time threat detection and faster incident response.' },
    { tag:'Rank', t:'Top 1% — TryHackMe', d:'Sustained practical pentesting ranking, top percentile globally.' }
  ],
  frameworks:['ISO 27001','CIS','NIST','SOC 2','STIG','RBI CSF','SAMA CSF','SEBI CSCRF','DPDP'],
  focus:['Cloud Native','Kubernetes','DevSecOps','AppSec','CNAPP','Pentest','SIEM','Compliance']
};

/* ── TOAST + CLIPBOARD (shared by contact, terminal) ── */
const toast=(()=>{
  let el=null,t=0;
  return (msg)=>{
    el=el||document.getElementById('toast'); if(!el) return;
    el.innerHTML=`<svg class="ic" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-check"/></svg><span></span>`;
    el.lastElementChild.textContent=msg; el.classList.add('show');
    clearTimeout(t); t=setTimeout(()=>el.classList.remove('show'),2200);
  };
})();
async function copyText(txt){
  try{ await navigator.clipboard.writeText(txt); return true; }
  catch(e){
    try{ const ta=document.createElement('textarea'); ta.value=txt; ta.setAttribute('readonly',''); ta.style.cssText='position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.select(); const ok=document.execCommand('copy'); ta.remove(); return ok; }catch(e2){ return false; }
  }
}

/* ── CAREER CHART — education / experience / certifications drawn to scale ── */
(()=>{
  const host=document.getElementById('career'); if(!host) return;
  const now=new Date(), NOW=now.getFullYear()+now.getMonth()/12+(now.getDate()-1)/365;
  const Y0=2013, Y1=Math.max(Math.ceil(NOW),NOW+0.35), pct=t=>(t-Y0)/(Y1-Y0)*100;
  const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  let n=0;
  const bar=(it,r,c)=>{
    const s=pct(it.s), e=pct(it.e==null?NOW:it.e), w=Math.max(e-s,0.6), d=(n++)*120;
    const short=(it.e==null?NOW:it.e)-it.s<1.6, tip=esc(it.tip);
    return `<div class="cr-bar${it.e==null?' live':''}" style="left:${s}%;width:${w}%;--r:${r};--d:${d}" title="${tip}"><span>${short?'':esc(it.lab)}</span></div>`+
      (short?`<span class="cr-lbl" style="right:calc(${100-s}% + 9px);--r:${r}">${esc(it.lab)}</span>`:'');
  };
  const pin=(it,r)=>`<div class="cr-pin" style="left:${pct(it.s)}%;--r:${r};--d:${(n++)*120}" title="${esc(it.tip)}"><span>${esc(it.lab)}</span></div>`;
  const lanes=[
    { l:'Education', c:'var(--purple)', rows:1, html:ME.edu.slice().reverse().map(e=>bar({s:e.s,e:e.e,lab:e.lab,tip:`${e.t} · ${e.o} · ${e.range}`},0)).join('') },
    { l:'Experience', c:'var(--blue)', rows:1, html:ME.exp.slice().reverse().map(e=>bar({s:e.s,e:e.e,lab:`${e.org} · ${e.role}`,tip:`${e.role} · ${e.org} · ${e.range}`},0)).join('') },
    { l:'Certifications', c:'var(--warm)', rows:3, html:ME.certs.map((c,i)=>{
        const it={s:c.s,e:c.e,lab:`${c.n} · ${c.o}`,tip:`${c.n} — ${c.t} · ${c.o} · ${c.range}`};
        return c.s===c.e ? pin(it,i) : bar(it,i); }).join('') }
  ];
  let ticks='', grid='';
  for(let y=Y0;y<=Math.floor(NOW);y++){ ticks+=`<span style="left:${pct(y)}%">${y}</span>`; grid+=`<i style="left:${pct(y)}%"></i>`; }
  host.innerHTML=`<div class="cr">
    <div class="cr-axis">${ticks}</div>
    <div class="cr-body">
      <div class="cr-grid">${grid}</div>
      <div class="cr-now" style="left:calc(var(--lab) + (100% - var(--lab)) * ${pct(NOW)/100})"><b>Now</b></div>
      ${lanes.map(l=>`<div class="cr-lane" style="--c:${l.c};--rows:${l.rows}"><div class="cr-lane-l">${l.l}</div><div class="cr-track">${l.html}</div></div>`).join('')}
    </div>
    <p class="cr-note">Dates drawn to scale · hover a bar for details</p>
  </div>`;
  const cr=host.firstElementChild;
  // on phones the chart is wider than the screen: open on the recent end, where the career is
  if(host.scrollWidth>host.clientWidth) host.scrollLeft=host.scrollWidth;
  if(REDUCE_MOTION||!('IntersectionObserver' in window)){ cr.classList.add('in'); return; }
  new IntersectionObserver(([e],o)=>{ if(e.isIntersecting){ cr.classList.add('in'); o.disconnect(); } },{threshold:0.25}).observe(host);
})();

/* ── GAUGE RINGS fill when scrolled into view ── */
(()=>{
  const rings=[...document.querySelectorAll('.ring')]; if(!rings.length) return;
  rings.forEach(r=>r.style.setProperty('--off',100-(+r.dataset.pct||0)));
  if(REDUCE_MOTION||!('IntersectionObserver' in window)){ rings.forEach(r=>r.classList.add('in')); return; }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:0.6});
  rings.forEach(r=>io.observe(r));
})();

/* ── CONTACT: one-tap copy + mailto composer ── */
(()=>{
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-copy]'); if(!b) return;
    const ok=await copyText(b.dataset.copy);
    toast(ok?`Copied ${b.dataset.copy}`:'Copy failed — select it manually');
    if(!ok) return;
    const u=b.querySelector('use'); b.classList.add('done'); if(u) u.setAttribute('href','#i-check');
    setTimeout(()=>{ b.classList.remove('done'); if(u) u.setAttribute('href','#i-copy'); },1600);
  });
  const form=document.getElementById('upForm'); if(!form) return;
  const name=document.getElementById('upName'), msg=document.getElementById('upMsg'), err=document.getElementById('upErr');
  const parts=()=>{
    const who=name.value.trim(), topic=(form.querySelector('input[name="topic"]:checked')||{}).value||'Hello';
    const subject=`${topic} — ${who||'via your portfolio'}`;
    const body=`${msg.value.trim()}\n\n— ${who||'(no name given)'}\n(sent from th3-v3ng34nc3.github.io)`;
    return {subject,body};
  };
  const valid=()=>{
    const ok=msg.value.trim().length>=10;
    msg.closest('.fld').classList.toggle('bad',!ok); err.hidden=ok;
    if(!ok){ err.textContent='Add a short message first (at least a sentence).'; msg.focus(); }
    return ok;
  };
  msg.addEventListener('input',()=>{ if(msg.value.trim().length>=10){ msg.closest('.fld').classList.remove('bad'); err.hidden=true; } });
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!valid()) return;
    const {subject,body}=parts();
    location.href=`mailto:${ME.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast('Opening your mail app…');
  });
  document.getElementById('upCopyMsg').addEventListener('click',async()=>{
    if(!valid()) return;
    const {subject,body}=parts();
    toast((await copyText(`To: ${ME.email}\nSubject: ${subject}\n\n${body}`))?'Message copied to clipboard':'Copy failed');
  });
})();

/* ── TYPED.JS — role line ── */
(()=>{
  if(!window.Typed) return;
  const el=document.getElementById('typedRole');if(!el)return;
  new Typed(el,{
    strings:['Senior Security Engineer','Cloud Security Architect','DevSecOps Practitioner','Penetration Tester','K8s Security Specialist'],
    typeSpeed:55, backSpeed:22, backDelay:1900, startDelay:300, loop:true, smartBackspace:true
  });
})();


/* ── TERMINAL SHELL ──
   A small command interpreter over the same data the page is built from.
   Output is generated from trusted constants (everything user-typed goes
   through textContent / escape), commands are listed in `help`, and Tab
   completes, ↑/↓ walk history, Ctrl+L clears, Ctrl+C cancels a running job. */
(()=>{
  const modal=document.getElementById('terminalModal'), input=document.getElementById('termInput'),
        logs=document.getElementById('termLogs'), body=document.getElementById('termBody'),
        close=document.getElementById('termClose'), trigger=document.getElementById('terminalTriggerIcon'),
        chipsEl=document.getElementById('termChips'), win=modal&&modal.querySelector('.term-window');
  if(!modal||!input||!logs||!body) return;

  /* ── helpers ── */
  const E=x=>String(x).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const C=(k,t)=>`<span class="tc-${k}">${E(t)}</span>`;
  const A=(href,t)=>`<a href="${E(href)}"${/^(https?:|img\/)/.test(href)?' target="_blank" rel="noopener"':''}>${E(t||href)}</a>`;
  const X=(cmd,t)=>`<span class="cmd-link" data-cmd="${E(cmd)}" role="button" tabindex="0">${E(t||cmd)}</span>`;
  const pad=(x,n)=>String(x).padEnd(n);
  const NAMES={ 'Vuln Mgmt':'Vulnerability Management','Incident Resp':'Incident Response','Threat Model':'Threat Modeling','Risk Assess':'Risk Assessment','Audits':'Security Audits','Pentest':'Penetration Testing','GH Actions':'GitHub Actions' };
  const TECH={ python:'Python', gnubash:'Bash', docker:'Docker', typescript:'TypeScript', react:'React', 'nextdotjs/e2e8f8':'Next.js', selenium:'Selenium', tailwindcss:'Tailwind CSS' };
  const SECTIONS={ hero:'hero', top:'hero', home:'hero', init:'hero', spec:'spec', about:'spec', array:'array', skills:'array', log:'log', timeline:'log', career:'log', build:'build', projects:'build', commend:'commend', awards:'commend', recognition:'commend', uplink:'uplink', contact:'uplink' };
  const scroll=()=>{ body.scrollTop=body.scrollHeight; };
  function line(html,cls){ const d=document.createElement('div'); d.className='term-line'+(cls?' '+cls:''); d.innerHTML=html; logs.appendChild(d); return d; }
  function out(lines){ (Array.isArray(lines)?lines:[lines]).forEach(l=>{ if(l===''){ const g=document.createElement('div'); g.className='term-gap'; logs.appendChild(g); } else line(l); }); scroll(); }
  const bar=(p,w=120)=>`<span class="term-bar" style="width:${w}px"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></span>`;
  const hdr=t=>C('a',`── ${t} ${'─'.repeat(Math.max(2,56-t.length))}`);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const openUrl=u=>{ const w=window.open(u,'_blank','noopener'); return !!w; };
  const skillsBy=c=>SKILL_DATA.filter(k=>k.cat===c).map(k=>NAMES[k.n]||k.n);
  const projIdx=q=>{ q=String(q||'').toLowerCase(); const n=parseInt(q,10);
    if(n>=1&&n<=PROJECT_DATA.length) return n-1;
    return PROJECT_DATA.findIndex(p=>p.name===q||p.title.toLowerCase()===q||p.name.replace(/-/g,' ')===q||p.title.toLowerCase().replace(/\s+/g,'-')===q); };
  const PS=`<span class="ps-u">visitor</span><span class="ps-s">@</span><span class="ps-h">ar-01</span><span class="ps-s">:</span><span class="ps-p">~</span><span class="ps-s">$</span>`;
  const psEl=modal.querySelector('.term-prompt-symbol'); if(psEl) psEl.innerHTML=PS;

  /* ── state ── */
  const hist=[]; let hp=0, job=null, started=false, matrixOff=null;
  const t0=performance.now();

  /* ── command registry ── */
  const CMDS={}, ORDER=[];
  function def(name,cat,desc,run,o={}){ const c={name,cat,desc,run,usage:o.usage||name,args:o.args,hidden:o.hidden}; CMDS[name]=c; ORDER.push(c); (o.alias||[]).forEach(a=>CMDS[a]=c); }

  /* identity */
  def('about','Identity','who this is',()=>[hdr('about'),'',...ME.about.map(l=>C('d',l)),'',`${C('m','try:')} ${X('skills')} ${X('experience')} ${X('projects')} ${X('contact')}`],{alias:['bio','profile']});
  def('whoami','Identity','who you are (and who I am)',()=>[`${C('g','visitor')} ${C('m','— guest session, read-only')}`,`${C('m','operator:')} ${C('w',ME.name)} ${C('m','·')} ${C('a',ME.role)} ${C('m','@')} ${C('p',ME.org)}`]);
  def('id','Identity','user and group ids',()=>[`uid=1000(${C('g','visitor')}) gid=1000(guests) groups=1000(guests),1337(curious)`],{hidden:true});
  def('status','Identity','system status',()=>[hdr('status'),`${pad('integrity',14)} ${bar(99.9)} ${C('g','99.9%')}`,`${pad('uplink',14)} ${C('g','STABLE')}`,`${pad('neural load',14)} ${bar(14.2)} ${C('d','14.2%')}`,`${pad('k8s security',14)} ${C('g','OPTIMIZED')}`,`${pad('threat level',14)} ${C('g','LOW')} ${C('m','— you are welcome here')}`]);
  def('stats','Identity','career in numbers',()=>[hdr('stats'),
    `${C('a',pad('3+',8))} years in the field`,`${C('a',pad('3',8))} certifications ${C('m','(CKA · C|EH · eJPT)')}`,`${C('a',pad('30+',8))} tools wielded`,`${C('a',pad('7',8))} open-source builds`,
    `${C('a',pad('80%',8))} less manual audit effort ${C('m','across 200+ systems')}`,`${C('a',pad('Top 1%',8))} on TryHackMe`]);
  def('neofetch','Identity','system info, with style',()=>{
    const logo=['    ▄▄▄▄▄▄▄▄▄▄    ','   ██▀▀▀██▀▀▀██   ','   ██   ██   ██   ','   ██▄▄▄██▄▄▄██   ','    ▀██▄▄▄▄██▀    ','      ▀████▀      ','        ▀▀        '];
    const up=Math.round((performance.now()-t0)/1000);
    const info=[`${C('g','visitor')}${C('m','@')}${C('a','ar-01')}`,C('m','─────────────────'),
      `${C('a','OS')}       AR-01 Portfolio 3.0`,`${C('a','Operator')} ${ME.name} (${ME.handle})`,`${C('a','Role')}     ${ME.role}`,`${C('a','Org')}      ${ME.org}`,
      `${C('a','Certs')}    CKA · C|EH · eJPT`,`${C('a','Skills')}   ${SKILL_DATA.length} tracked`,`${C('a','Builds')}   ${PROJECT_DATA.length} open-source`,`${C('a','Shell')}    arsh 3.0`,`${C('a','Uptime')}   ${up}s on this page`];
    return logo.map((l,i)=>C('a',l)+' '+(info[i]||'')).concat(info.slice(logo.length).map(l=>' '.repeat(logo[0].length+1)+l)).concat(['']);
  },{alias:['fetch','sysinfo']});
  def('banner','Identity','the AR-01 banner',()=>[`<div class="term-banner" style="white-space:pre">    _    ____          ___  _ \n   / \\  |  _ \\        / _ \\/ |\n  / _ \\ | |_) |_____ | | | | |\n / ___ \\|  _ <|_____|| |_| | |\n/_/   \\_\\_| \\_\\       \\___/|_|</div>`,C('m','UNIT // AR-01 — Autonomous Security Uplink')],{alias:['logo']});
  def('quote','Identity','the core directive',()=>[`${C('y','न दैन्यं न पलायनम्')}`,C('d','No begging, no fleeing.')],{alias:['shlok','motto']});

  /* the record */
  def('experience','Record','work history',()=>{
    const o=[hdr('experience')];
    ME.exp.forEach(e=>{ o.push('',`${C('w',e.role)} ${C('m','@')} ${C('p',e.org)}  ${C('a',e.range)}`); e.bullets.forEach(b=>o.push(`  ${C('a','▸')} ${C('d',b)}`)); });
    return o;
  },{alias:['exp','work','career']});
  def('education','Record','schools',()=>{
    const o=[hdr('education')];
    ME.edu.forEach(e=>o.push('',`${C('w',e.t)}`,`  ${C('p',e.o)} ${C('m','·')} ${e.p} ${C('m','·')} ${C('a',e.range)}${e.x?'  '+C('m',e.x):''}`));
    return o;
  },{alias:['edu','school']});
  def('certs','Record','certifications',()=>{
    const o=[hdr('certifications'),''];
    ME.certs.forEach(c=>o.push(`${C('y',pad(c.n,6))} ${C('w',c.t)} ${C('m','·')} ${C('p',c.o)} ${C('m','·')} ${C('a',c.range)}`));
    return o;
  },{alias:['certifications','cert','certificates']});
  def('awards','Record','honours & delivery',()=>{
    const col={Award:'y',Delivery:'a',Rank:'p'};
    return [hdr('recognition'),'',...ME.awards.map((a,i)=>`${C('m',String(i+1).padStart(2,'0'))} ${C(col[a.tag],pad(a.tag,9))} ${C('w',a.t)}\n${' '.repeat(15)}${C('d',a.d)}`)];
  },{alias:['achievements','recognition','honours']});
  def('skills','Record','skills — try: skills cloud | tools | core',a=>{
    const cats={ cloud:['Cloud & Platform','a'], tools:['Tools & Security','p'], core:['Core Disciplines','y'] };
    const pick=(a[0]||'').toLowerCase(); const keys=cats[pick]?[pick]:Object.keys(cats);
    const o=[hdr('skills')];
    keys.forEach(k=>{ o.push('',C(cats[k][1],`${cats[k][0]} (${skillsBy(k).length})`)); o.push('  '+skillsBy(k).map(x=>C('d',x)).join(C('m',' · '))); });
    if(!pick) o.push('',`${C('m','filter:')} ${X('skills cloud')} ${X('skills tools')} ${X('skills core')}`);
    return o;
  },{usage:'skills [cloud|tools|core]',args:()=>['cloud','tools','core']});
  def('tools','Record','the toolkit',()=>[hdr('toolkit'),'',...['cloud','tools'].map(k=>'  '+skillsBy(k).map(x=>C(k==='cloud'?'a':'p',x)).join(C('m',' · ')))]);
  def('frameworks','Record','compliance frameworks',()=>[hdr('frameworks'),'','  '+ME.frameworks.map(f=>C('a',f)).join(C('m',' · ')),'',C('d','Operationalised into the CSPM product; assessed automatically across cloud environments.')],{alias:['compliance','standards']});
  def('focus','Record','focus areas',()=>['  '+ME.focus.map(f=>C('p',f)).join(C('m',' · '))],{hidden:true});
  def('projects','Record','open-source builds',()=>{
    const o=[hdr('open source arsenal'),''];
    const wide=body.clientWidth>=600;   // narrow screens: name + status only, the table would wrap
    PROJECT_DATA.forEach((p,i)=>o.push(`${C('m',String(i+1).padStart(2,'0'))} ${X('project '+(i+1),pad(p.title,17))} ${C(p.statusClass==='live'?'g':'m',pad(p.status,8))}${wide?' '+C('d',p.desc.length>52?p.desc.slice(0,50)+'…':p.desc):''}`));
    o.push('',`${C('m','detail:')} ${X('project 1')} ${C('m','·')} ${C('m','open one:')} ${X('open sandman-web')}`);
    return o;
  },{alias:['repos','builds','ls-projects']});
  def('project','Record','one project in detail',a=>{
    const i=projIdx(a.join(' ')); if(i<0) return [`${C('r','no such project')} — try ${X('projects')}`];
    const p=PROJECT_DATA[i], tech=(p.tech||[]).map(t=>TECH[t]||t);
    return [hdr(p.title),`${C('m','status')}  ${C(p.statusClass==='live'?'g':'a',p.status)}`,tech.length?`${C('m','stack')}   ${tech.map(t=>C('p',t)).join(C('m',' · '))}`:'',`${C('m','about')}   ${C('d',p.desc)}`,`${C('m','link')}    ${A(p.link)}  ${X('open '+p.name,'[open]')}`].filter(Boolean);
  },{usage:'project <name|number>',args:()=>PROJECT_DATA.map(p=>p.name)});
  def('search','Record','search skills, projects, awards',a=>{
    const q=a.join(' ').toLowerCase().trim(); if(!q) return [C('m','usage: search <term>')];
    const hits=[];
    SKILL_DATA.forEach(k=>{ const n=NAMES[k.n]||k.n; if(n.toLowerCase().includes(q)) hits.push(`${C('a',pad('skill',9))} ${n} ${C('m','('+k.cat+')')}`); });
    PROJECT_DATA.forEach((p,i)=>{ if((p.title+' '+p.desc).toLowerCase().includes(q)) hits.push(`${C('p',pad('project',9))} ${X('project '+(i+1),p.title)} ${C('m','— '+p.status)}`); });
    ME.awards.forEach(w=>{ if((w.t+' '+w.d).toLowerCase().includes(q)) hits.push(`${C('y',pad('award',9))} ${w.t}`); });
    ME.certs.forEach(c=>{ if((c.n+' '+c.t+' '+c.o).toLowerCase().includes(q)) hits.push(`${C('g',pad('cert',9))} ${c.n} — ${c.t}`); });
    ME.frameworks.forEach(f=>{ if(f.toLowerCase().includes(q)) hits.push(`${C('c',pad('standard',9))} ${f}`); });
    return hits.length?[C('m',`${hits.length} match${hits.length>1?'es':''} for "${q}"`),...hits]:[C('r',`nothing found for "${q}"`)];
  },{usage:'search <term>',alias:['grep','find']});

  /* reach */
  def('contact','Reach','every way to reach me',()=>[hdr('contact'),
    `${C('a',pad('email',10))} ${A('mailto:'+ME.email,ME.email)}  ${X('copy email','[copy]')}`,
    `${C('a',pad('phone',10))} ${A('tel:'+ME.phone.replace(/\s/g,''),ME.phone)}  ${X('copy phone','[copy]')}`,
    `${C('a',pad('linkedin',10))} ${A(ME.links.linkedin,'linkedin.com/in/'+ME.handle)}`,
    `${C('a',pad('github',10))} ${A(ME.links.github,'github.com/'+ME.handle)}`,
    `${C('a',pad('tryhackme',10))} ${A(ME.links.tryhackme,'tryhackme.com/p/'+ME.handle)}`,
    `${C('a',pad('résumé',10))} ${A(ME.links.resume,'open résumé')} ${C('m','·')} ${A(ME.links.pdf,'download PDF')}`,'',
    `${C('m','prefer a form?')} ${X('goto contact')}   ${C('m','or:')} ${X('sudo hire-me')}`]);
  def('email','Reach','my email address',()=>[`${A('mailto:'+ME.email,ME.email)}  ${X('copy email','[copy]')}  ${X('mail','[compose]')}`]);
  def('phone','Reach','my phone number',()=>[`${A('tel:'+ME.phone.replace(/\s/g,''),ME.phone)}  ${X('copy phone','[copy]')}`],{alias:['tel','call']});
  def('linkedin','Reach','open LinkedIn',()=>openLink('linkedin',ME.links.linkedin));
  def('github','Reach','open GitHub',()=>openLink('GitHub',ME.links.github),{alias:['git']});
  def('thm','Reach','open TryHackMe',()=>openLink('TryHackMe',ME.links.tryhackme),{alias:['tryhackme']});
  def('resume','Reach','open the résumé (add --pdf to download)',a=>{
    if(a.includes('--pdf')||a.includes('pdf')){ const l=document.createElement('a'); l.href=ME.links.pdf; l.download='Aditya-Raj-Resume.pdf'; document.body.appendChild(l); l.click(); l.remove(); return [`${C('g','✓')} downloading ${A(ME.links.pdf,'Aditya-Raj-Resume.pdf')}`]; }
    return openLink('résumé',ME.links.resume,true);
  },{usage:'resume [--pdf]',alias:['cv']});
  def('copy','Reach','copy email or phone to the clipboard',async a=>{
    const w=(a[0]||'email').toLowerCase(), val=w.startsWith('p')?ME.phone:w.startsWith('e')?ME.email:null;
    if(!val) return [C('m','usage: copy <email|phone>')];
    const ok=await copyText(val); if(ok) toast(`Copied ${val}`); return [ok?`${C('g','✓')} copied ${C('w',val)}`:C('r','clipboard unavailable — select the text instead')];
  },{usage:'copy <email|phone>',args:()=>['email','phone']});
  def('mail','Reach','compose an email',()=>{ location.href=`mailto:${ME.email}?subject=${encodeURIComponent('Hello from your portfolio')}`; return [`${C('g','✓')} opening your mail app → ${C('w',ME.email)}`]; },{alias:['compose']});
  function openLink(label,url,self){
    const ok=openUrl(url);
    return [ok?`${C('g','✓')} opening ${label}…`:`${C('y','!')} popup blocked — open it here: ${A(url)}`];
  }

  /* navigate */
  def('goto','Navigate','jump to a section — try: goto projects',a=>{
    const id=SECTIONS[(a[0]||'').toLowerCase()]; if(!id) return [C('m','usage: goto <section>'),C('d','sections: ')+Object.keys(SECTIONS).filter((k,i,ar)=>ar.indexOf(k)===i).map(k=>C('a',k)).join(C('m',' · '))];
    closeTerm(); setTimeout(()=>{ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:REDUCE_MOTION?'auto':'smooth'}); },280);
    return [`${C('g','✓')} → ${id}`];
  },{usage:'goto <section>',alias:['cd','jump','scrollto'],args:()=>Object.keys(SECTIONS)});
  def('open','Navigate','open a section, project or link',a=>{
    const k=(a[0]||'').toLowerCase(); if(!k) return [C('m','usage: open <section|project|linkedin|github|thm|resume|site>')];
    if(SECTIONS[k]) return CMDS.goto.run(a);
    const i=projIdx(a.join(' ')); if(i>=0) return openLink(PROJECT_DATA[i].title,PROJECT_DATA[i].link);
    const map={linkedin:ME.links.linkedin,github:ME.links.github,thm:ME.links.tryhackme,tryhackme:ME.links.tryhackme,resume:ME.links.resume,cv:ME.links.resume,site:ME.site,website:ME.site};
    if(map[k]) return openLink(k,map[k]);
    return [`${C('r','nothing called')} ${E(k)} — try ${X('sections')} or ${X('projects')}`];
  },{usage:'open <target>',args:()=>[...Object.keys(SECTIONS),...PROJECT_DATA.map(p=>p.name),'linkedin','github','thm','resume','site']});
  def('sections','Navigate','list the page sections',()=>[hdr('sections'),'',...[['hero','landing'],['spec','about'],['array','skills'],['log','timeline'],['build','projects'],['commend','recognition'],['uplink','contact']].map(([k,n])=>`  ${X('goto '+k,pad(k,9))} ${C('d',n)}`)],{alias:['map']});
  def('top','Navigate','scroll to the top',()=>CMDS.goto.run(['hero']),{hidden:true});

  /* system */
  def('help','System','this list — help <command> for details',a=>{
    if(a[0]){ const c=CMDS[a[0].toLowerCase()]; if(!c) return [`${C('r','no help for')} ${E(a[0])}`]; return [`${C('a',c.usage)}`,`${C('d',c.desc)}`]; }
    const cats=['Identity','Record','Reach','Navigate','System','Fun']; const o=[hdr('commands')];
    cats.forEach(cat=>{ const list=ORDER.filter(c=>c.cat===cat&&!c.hidden); if(!list.length) return;
      o.push('',C('y',cat)); list.forEach(c=>o.push(`  ${X(c.name,pad(c.name,12))} ${C('d',c.desc)}`)); });
    o.push('',C('m','Tab completes · ↑/↓ history · Ctrl+L clears · Ctrl+C cancels · Esc closes'));
    return o;
  },{usage:'help [command]',alias:['?','commands']});
  def('man','System','manual page for a command',a=>CMDS.help.run(a),{usage:'man <command>',hidden:true});
  def('clear','System','clear the screen',()=>{ logs.innerHTML=''; stopMatrix(); return null; },{alias:['cls']});
  def('history','System','commands you have run',()=>hist.length?hist.map((h,i)=>`${C('m',String(i+1).padStart(3))}  ${E(h)}`):[C('m','(empty)')]);
  def('date','System','current date and time',()=>{ const d=new Date(); return [`${C('w',d.toString())}`,`${C('m','UTC')} ${d.toISOString()}`]; },{alias:['time']});
  def('uptime','System','time on this page',()=>{ const s=Math.round((performance.now()-t0)/1000); return [`up ${Math.floor(s/60)}m ${s%60}s, 1 user, load average: 0.14, 0.09, 0.05`]; },{hidden:true});
  def('uname','System','system name',a=>[a.includes('-a')?'AR-01 portfolio 3.0.0 #1 SMP WebGL2 x86_64 GNU/Web':'AR-01'],{usage:'uname [-a]',hidden:true});
  def('pwd','System','working directory',()=>['/home/visitor/portfolio'],{hidden:true});
  def('hostname','System','host name',()=>['ar-01'],{hidden:true});
  def('echo','System','print text',(a,raw)=>[E(raw.replace(/^\s*echo\s?/i,''))],{usage:'echo <text>',hidden:true});
  def('env','System','environment',()=>['USER=visitor','HOME=/home/visitor','SHELL=/bin/arsh','EDITOR=vim  # (leaving is the hard part)','OPERATOR='+ME.handle,'LANG=en_IN.UTF-8','PATH=/usr/local/sbin:/usr/local/bin:/portfolio/bin'].map(l=>C('d',l)),{hidden:true});
  const FILES={ 'about.txt':'about','skills.txt':'skills','projects.md':'projects','contact.txt':'contact','resume.txt':'experience','certs.txt':'certs','awards.txt':'awards','quote.txt':'quote','README.md':'help' };
  def('ls','System','list files',()=>[ '  '+Object.keys(FILES).map(f=>C(f.endsWith('.md')?'p':'a',f)).join('   ')+'   '+C('m','secrets.txt') ],{alias:['dir','ll']});
  def('cat','System','print a file — try: cat about.txt',a=>{
    const f=a[0]; if(!f) return [C('m','usage: cat <file>   (see ls)')];
    if(f==='secrets.txt') return [`${C('r','cat: secrets.txt: Permission denied')}  ${C('m','(nice try)')}`];
    return FILES[f]?CMDS[FILES[f]].run([]):[`${C('r','cat: '+E(f)+': No such file or directory')}`];
  },{usage:'cat <file>',args:()=>Object.keys(FILES)});
  def('tree','System','site map as a tree',()=>[C('a','portfolio/'),...['├── hero        landing','├── spec        about + capabilities','├── array       skills marquee ('+SKILL_DATA.length+' tracked)','├── log         career chart, education, experience, certs','├── build       '+PROJECT_DATA.length+' open-source builds','├── commend     6 recognitions','└── uplink      contact form + channels'].map(l=>C('d',l))],{hidden:true});
  def('exit','System','close the terminal',()=>{ setTimeout(closeTerm,180); return [C('m','logout')]; },{alias:['quit','q','logout']});

  /* fun */
  def('matrix','Fun','digital rain',()=>{ startMatrix(); return [C('g','wake up, visitor…'),C('m','(any key or Ctrl+C to stop)')]; });
  def('hack','Fun','breach the mainframe (ethically)',async()=>{
    const el=line(''); let p=0;
    const steps=['mapping attack surface','enumerating services','fuzzing inputs','chaining exploits','escalating privileges','exfiltrating… nothing, this is a portfolio'];
    for(let i=0;i<steps.length;i++){ for(let k=0;k<=8;k++){ if(!job) return null; p=(i*9+k)/ (steps.length*9) *100; el.innerHTML=`${bar(p,200)} ${C('a',Math.round(p)+'%')} ${C('d',steps[i])}`; scroll(); await sleep(60); } }
    return [`${C('g','✓ access granted')}`,C('d','…to a static site. Ethical hackers disclose responsibly — see '+'sudo hire-me.')];
  });
  def('nmap','Fun','scan this portfolio',async a=>{
    const t=a[0]||'localhost'; const rows=[['22/tcp','filtered','ssh','(not for visitors)'],['80/tcp','open','http','portfolio'],['443/tcp','open','https','portfolio (secure)'],['1337/tcp','open','uplink','contact — send a transmission'],['8080/tcp','closed','http-proxy','—'],['31337/tcp','open','elite','secrets.txt (permission denied)']];
    out([C('m',`Starting scan of ${t} …`),`${C('a',pad('PORT',10))}${C('a',pad('STATE',10))}${C('a',pad('SERVICE',12))}${C('a','NOTE')}`]);
    for(const r of rows){ if(!job) return null; await sleep(230); line(`${pad(r[0],10)}${C(r[1]==='open'?'g':r[1]==='closed'?'r':'y',pad(r[1],10))}${pad(r[2],12)}${C('d',r[3])}`); scroll(); }
    return ['',C('m','Nmap done: 1 host up (0.0004s latency). All vulnerabilities fixed or documented.')];
  },{usage:'nmap [host]'});
  def('whois','Fun','look up the handle',a=>{ const q=(a[0]||ME.handle).toLowerCase(); if(q!==ME.handle&&q!=='aditya'&&q!=='adityaraj') return [C('r',`No match for "${E(q)}". Try: whois ${ME.handle}`)];
    return [hdr('whois'),`${C('a',pad('Handle',12))} ${ME.handle}`,`${C('a',pad('Name',12))} ${ME.name}`,`${C('a',pad('Role',12))} ${ME.role} @ ${ME.org}`,`${C('a',pad('Status',12))} ${C('g','Available for missions')}`,`${C('a',pad('Certified',12))} since 2021 (eJPT)`,`${C('a',pad('Rank',12))} Top 1% TryHackMe`]; },{usage:'whois [handle]'});
  def('ping','Fun','ping a host',async a=>{
    const h=a[0]||'ar-01'; out(C('m',`PING ${E(h)} (127.0.0.1) 56 bytes of data.`)); let t=0;
    for(let i=1;i<=4;i++){ if(!job) return null; await sleep(420); const ms=(8+Math.random()*9).toFixed(1); t+=+ms; line(`64 bytes from ${E(h)}: icmp_seq=${i} ttl=64 time=${C('g',ms+' ms')}`); scroll(); }
    return ['',C('m',`4 packets transmitted, 4 received, 0% packet loss, avg ${(t/4).toFixed(1)} ms`)];
  },{usage:'ping [host]'});
  def('sudo','Fun','run as root (good luck)',async a=>{
    const w=a.join(' ').toLowerCase().trim();
    if(w==='hire-me'||w==='hire me'||w==='hire'){
      out([C('y','[sudo] password for visitor: ')+C('m','••••••••'),C('g','✓ authentication successful — granting access to the hiring channel')]); await sleep(650);
      closeTerm(); setTimeout(()=>{ const u=document.getElementById('uplink'); if(u) u.scrollIntoView({behavior:REDUCE_MOTION?'auto':'smooth'}); toast("Let's talk — drop a note below"); setTimeout(()=>{ const m=document.getElementById('upMsg'); if(m&&!REDUCE_MOTION) m.focus({preventScroll:true}); },900); },300);
      return null;
    }
    return [`${C('r','visitor is not in the sudoers file.')} ${C('m','This incident will be reported.')}`,C('m','hint: sudo hire-me')];
  },{usage:'sudo <command>'});
  def('rm','Fun','remove files (not here)',a=>[a.join(' ').includes('-rf')?`${C('r','rm: it is dangerous to operate recursively on \'/\'')} ${C('m','(this site is read-only, and I am a security engineer)')}`:C('r','rm: permission denied')],{hidden:true});
  def('vim','Fun','a text editor',()=>[C('m','Nope. You would never leave.')],{alias:['vi','nano','emacs'],hidden:true});
  def('cowsay','Fun','a cow with opinions',a=>{ const t=(a.join(' ')||'secure by design').slice(0,40), b='─'.repeat(t.length+2);
    return ['  ┌'+b+'┐','  │ '+E(t)+' │','  └'+b+'┘','        \\   ^__^','         \\  (oo)\\_______','            (__)\\       )\\/\\','                ||----w |','                ||     ||'].map(l=>C('a',l)); },{usage:'cowsay <text>'});
  def('fortune','Fun','a security proverb',()=>{
    const f=['Security is a process, not a product.','Trust, but verify.','Least privilege: give access like you give out house keys.','Every secret in a repo is public — it just doesn\'t know yet.','Patch early, patch often, and read the changelog.','Assume breach. Design so that it does not matter.','A backup you have never restored is a hope, not a backup.'];
    return [C('y','“'+f[Math.floor(Math.random()*f.length)]+'”')]; });

  /* ── matrix rain (overlay on the whole window, stops on any key) ── */
  function startMatrix(){
    stopMatrix(); if(!win) return;
    const cv=document.createElement('canvas'); cv.className='term-matrix'; win.appendChild(cv);
    const w=cv.width=win.clientWidth, h=cv.height=win.clientHeight, cx=cv.getContext('2d'); const fs=15, cols=Math.floor(w/fs); const drops=Array(cols).fill(0).map(()=>Math.random()*-30);
    const chars='アイウエオカキクケコサシスセソ01{}<>/;$#ARO1'; let id=0, n=0;
    const step=()=>{ cx.fillStyle='rgba(2,6,12,.12)'; cx.fillRect(0,0,w,h); cx.font=fs+'px monospace';
      drops.forEach((d,i)=>{ cx.fillStyle=Math.random()>.96?'#d9fff2':'#3dffa8'; cx.fillText(chars[Math.floor(Math.random()*chars.length)],i*fs,d*fs); drops[i]=d*fs>h&&Math.random()>.975?0:d+1; });
      if(++n>520){ stopMatrix(); return; } id=requestAnimationFrame(step); };
    step(); matrixOff=()=>{ cancelAnimationFrame(id); cv.remove(); matrixOff=null; };
  }
  function stopMatrix(){ if(matrixOff) matrixOff(); }

  /* ── open / close ── */
  const isOpen=()=>modal.classList.contains('open'); let lastFocus=null;
  function welcome(){
    out([`<div class="term-banner" style="white-space:pre">    _    ____          ___  _ \n   / \\  |  _ \\        / _ \\/ |\n  / _ \\ | |_) |_____ | | | | |\n / ___ \\|  _ <|_____|| |_| | |\n/_/   \\_\\_| \\_\\       \\___/|_|</div>`,
      C('d','UNIT // AR-01 Autonomous Security Uplink — initialised.'),
      `${C('m','Type')} ${X('help','help')} ${C('m','for every command, or tap a chip below. Tab completes, ↑/↓ browse history.')}`,'']);
  }
  function openTerm(){
    lastFocus=document.activeElement; modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    if(!started){ started=true; welcome(); } setTimeout(()=>input.focus(),60); scroll();
  }
  function closeTerm(){ if(!isOpen()) return; job=null; stopMatrix(); modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); const f=lastFocus; setTimeout(()=>{ f&&f.focus&&f.focus(); },150); }
  trigger&&trigger.addEventListener('click',openTerm);
  close&&close.addEventListener('click',closeTerm);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeTerm(); });
  window.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); isOpen()?closeTerm():openTerm(); }
    else if(e.key==='Escape') closeTerm();
  });

  /* ── run ── */
  function cancelJob(){ if(job){ job=null; line(C('r','^C')); } }
  async function run(raw,fromUI){
    const val=raw.trim();
    line(`${PS} ${E(val)}`);
    if(!val){ scroll(); return; }
    if(hist[hist.length-1]!==val) hist.push(val); hp=hist.length;
    stopMatrix();
    const parts=val.split(/\s+/), name=parts[0].toLowerCase(), args=parts.slice(1), c=CMDS[name];
    if(!c){
      const lev=(a,b)=>{ const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]); for(let j=1;j<=b.length;j++) d[0][j]=j;
        for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[a.length][b.length]; };
      const near=ORDER.filter(x=>!x.hidden).map(x=>[x.name,lev(name,x.name)]).sort((p,q)=>p[1]-q[1])[0];
      const guess=near&&near[1]<=Math.max(1,Math.floor(name.length/3))?near[0]:null;
      out([`${C('r','command not found:')} ${E(name)}${guess?`   ${C('m','did you mean')} ${X(guess)}${C('m','?')}`:''}`,`${C('m','type')} ${X('help')} ${C('m','for the list')}`]); return;
    }
    const mine=job={};
    try{
      const res=await c.run(args,val);
      if(res&&job===mine) out(res);
    }catch(err){ out(C('r','error: '+(err&&err.message||'command failed'))); }
    if(job===mine) job=null;
    scroll();
  }
  function complete(){
    const v=input.value, parts=v.split(/\s+/), last=parts[parts.length-1].toLowerCase();
    let pool;
    if(parts.length<=1) pool=Object.keys(CMDS);
    else { const c=CMDS[parts[0].toLowerCase()]; pool=(c&&c.args&&c.args())||[]; }
    const m=pool.filter(k=>k.toLowerCase().startsWith(last));
    if(m.length===1){ parts[parts.length-1]=m[0]; input.value=parts.join(' ')+' '; }
    else if(m.length>1){ out([`${PS} ${E(v)}`,'  '+m.map(x=>C('a',x)).join('   ')]); const pre=m.reduce((a,b)=>{ let i=0; while(i<a.length&&a[i]===b[i]) i++; return a.slice(0,i); }); if(pre.length>last.length){ parts[parts.length-1]=pre; input.value=parts.join(' '); } }
  }
  input.addEventListener('keydown',e=>{
    if(matrixOff&&e.key!=='Enter'){ stopMatrix(); }
    if(e.key==='Enter'){ e.preventDefault(); if(job){ out(C('m','(a command is still running — Ctrl+C to cancel)')); return; } const v=input.value; input.value=''; run(v); }   // preventDefault: a closing command must not leave Enter to "click" the button that gets focus back
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(hp>0){ hp--; input.value=hist[hp]||''; } }
    else if(e.key==='ArrowDown'){ e.preventDefault(); if(hp<hist.length-1){ hp++; input.value=hist[hp]; } else { hp=hist.length; input.value=''; } }
    else if(e.key==='Tab'){ e.preventDefault(); complete(); }
    else if(e.key.toLowerCase()==='l'&&e.ctrlKey){ e.preventDefault(); logs.innerHTML=''; }
    else if(e.key.toLowerCase()==='c'&&e.ctrlKey){ e.preventDefault(); if(job||matrixOff){ cancelJob(); stopMatrix(); } else { line(`${PS} ${E(input.value)}^C`); input.value=''; scroll(); } }
  });
  body.addEventListener('click',e=>{ if(!window.getSelection().toString()) input.focus(); });
  logs.addEventListener('click',e=>{ const x=e.target.closest('[data-cmd]'); if(x){ run(x.dataset.cmd,true); input.focus(); } });
  logs.addEventListener('keydown',e=>{ if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-cmd]')){ e.preventDefault(); run(e.target.dataset.cmd,true); input.focus(); } });
  if(chipsEl){
    ['help','about','neofetch','skills','projects','experience','certs','awards','contact','nmap','matrix','sudo hire-me'].forEach(c=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=c; b.addEventListener('click',()=>{ if(!isOpen()) openTerm(); run(c,true); input.focus(); }); chipsEl.appendChild(b);
    });
  }
})();

/* ── STATUS BAR ── */
(()=>{
  const clk=document.getElementById('fsClock');
  if(!clk) return;
  const tick=()=>clk.textContent=new Date().toLocaleTimeString('en-GB',{hour12:false,timeZone:'UTC'});
  tick(); setInterval(tick,1000);
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
  document.querySelectorAll('.v[data-count]').forEach(el=>obs.observe(el));
})();

/* ── SCROLL PROGRESS — a hairline gradient bar across the very top ── */
(()=>{
  const bar=document.getElementById('scrollProg'); if(!bar) return;
  let raf=0;
  const upd=()=>{ raf=0; const m=document.documentElement.scrollHeight-innerHeight; bar.style.transform=`scaleX(${m>0?Math.min(1,scrollY/m):0})`; };
  addEventListener('scroll',()=>{ if(!raf) raf=requestAnimationFrame(upd); },{passive:true}); upd();
})();

/* ── MAGNETIC CONTROLS — buttons lean toward the cursor when it's near. Uses
   the independent `translate` property so hover transforms still compose;
   the centre is measured minus the offset already applied, so it can't
   feed back on itself. ── */
(()=>{
  if(!FINE_POINTER||REDUCE_MOTION) return;
  const els=[...document.querySelectorAll('.bx, .hero-social a, .gn-term-btn, .arr-fb, #btt')];
  let raf=0,mx=-999,my=-999;
  const run=()=>{
    raf=0;
    els.forEach(el=>{
      const r=el.getBoundingClientRect(), ox=el._mx||0, oy=el._my||0;
      const cx=r.left+r.width/2-ox, cy=r.top+r.height/2-oy, dx=mx-cx, dy=my-cy, d=Math.hypot(dx,dy);
      const reach=Math.max(r.width,r.height)/2+80;
      if(d<reach){ const k=1-d/reach; el._mx=dx*.4*k; el._my=dy*.4*k; el.style.translate=`${el._mx}px ${el._my}px`; }
      else if(el._mx||el._my){ el._mx=el._my=0; el.style.translate=''; }
    });
  };
  document.addEventListener('pointermove',e=>{ mx=e.clientX; my=e.clientY; if(!raf) raf=requestAnimationFrame(run); },{passive:true});
})();

/* ── BACK TO TOP ── */
(()=>{
  const btt=document.getElementById('btt');if(!btt)return;
  btt.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll',()=>btt.classList.toggle('show',window.scrollY>window.innerHeight*0.5));
})();
