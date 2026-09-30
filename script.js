const portrait=document.querySelector(".portrait");
const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- typographic background ---------- */
const bg=document.querySelector(".background-type");
const layers=[];
if(bg){
  // a second, identical layer that is revealed by the cursor spotlight
  const spot=bg.cloneNode(true);
  spot.classList.add("spot");
  bg.after(spot);
  layers.push(bg,spot);
}
const allLines=()=>layers.flatMap(l=>[...l.querySelectorAll(".type-line")]);
const SPEEDS=[46,30,54,24,38];           // px per second, one per row
const LAYER_SIZE=()=>layers[0]?layers[0].querySelectorAll(".type-line").length:0;

function buildType(){
  const vw=window.innerWidth;
  layers.forEach(layer=>{
    layer.querySelectorAll(".type-line").forEach((line,i)=>{
      if(!line.dataset.set)line.dataset.set=line.innerHTML;
      line.innerHTML=line.dataset.set;
      const setW=line.getBoundingClientRect().width;
      if(!setW)return;
      const copies=Math.ceil(vw/setW)+1;   // always enough text to fill the screen
      line.innerHTML=line.dataset.set.repeat(copies);
      const dur=setW/SPEEDS[i%SPEEDS.length];
      line.style.setProperty("--shift",setW+"px");
      line.style.setProperty("--dur",dur+"s");
      line.style.setProperty("--delay",-(((i*.37)%1)*dur)+"s"); // stagger start positions
      line.style.animationDirection=i%2?"reverse":"normal";      // rows alternate direction
    });
  });
}
buildType();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(buildType);
let resizeTimer;
addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(buildType,150)});

/* ---------- pointer ---------- */
let mouseX=0,mouseY=0;
let currentX=0,currentY=0;
let parallaxX=0,parallaxY=0,pxC=0,pyC=0;
let spotX=-999,spotY=-999,tSpotX=-999,tSpotY=-999,spotR=1,tSpotR=1;
const SPOT_RADIUS=260;

function setPointerPosition(clientX,clientY){
  const x=clientX/window.innerWidth-.5;
  const y=clientY/window.innerHeight-.5;
  mouseX=x*28;
  mouseY=y*22;
  parallaxX=x;
  parallaxY=y;
  if(tSpotR<=1){spotX=clientX;spotY=clientY}   // first appearance: start under the cursor
  tSpotX=clientX;
  tSpotY=clientY;
  tSpotR=SPOT_RADIUS;
}
function pointerGone(){
  mouseX=mouseY=parallaxX=parallaxY=0;
  tSpotR=1;
}

document.addEventListener("mousemove",e=>setPointerPosition(e.clientX,e.clientY));
document.documentElement.addEventListener("mouseleave",pointerGone);
document.addEventListener("touchmove",e=>{
  if(e.touches.length>0)setPointerPosition(e.touches[0].clientX,e.touches[0].clientY);
},{passive:true});
document.addEventListener("touchend",pointerGone,{passive:true});

/* ---------- one animation loop ---------- */
function animate(){
  currentX+=(mouseX-currentX)*.075;
  currentY+=(mouseY-currentY)*.075;

  if(portrait){
    // Gentle body sway only. Head and eyes are handled by head-tracker.js.
    const sway=.35;
    portrait.style.transform=`translate3d(${currentX*sway}px,${currentY*sway}px,0)`;
  }

  if(!reduceMotion){
    pxC+=(parallaxX-pxC)*.06;
    pyC+=(parallaxY-pyC)*.06;
    // transform-based parallax (no layout work), each row moves a little more than the last
    allLines().forEach((line,i)=>{
      const strength=((i%LAYER_SIZE())+1)*3;
      line.style.translate=`${(pxC*strength).toFixed(2)}px ${(pyC*strength).toFixed(2)}px`;
    });
  }

  spotX+=(tSpotX-spotX)*.18;
  spotY+=(tSpotY-spotY)*.18;
  spotR+=(tSpotR-spotR)*.12;
  const spot=layers[1];
  if(spot){
    spot.style.setProperty("--mx",spotX.toFixed(1)+"px");
    spot.style.setProperty("--my",spotY.toFixed(1)+"px");
    spot.style.setProperty("--r",Math.max(1,spotR).toFixed(1)+"px");
  }

  requestAnimationFrame(animate);
}
animate();
