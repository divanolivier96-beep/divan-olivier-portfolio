import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/build/pdf.worker.min.mjs";

const PDF_URL="divan-portfolio.pdf";
const book=document.getElementById("book");
const spread=document.getElementById("spread");
const leftPage=document.getElementById("left-page");
const rightPage=document.getElementById("right-page");
const loading=document.getElementById("loading");
const counter=document.getElementById("counter");
const prev=[document.getElementById("prev"),document.getElementById("prev-bottom")];
const next=[document.getElementById("next"),document.getElementById("next-bottom")];
const fullscreen=document.querySelector(".fullscreen");

let pdf=null;
let current=1;
let busy=false;
let touchX=0;

const mobile=()=>window.matchMedia("(max-width:800px)").matches;
const pageCanvas=async(pageNumber,slot)=>{
  slot.innerHTML="";
  if(!pdf||pageNumber<1||pageNumber>pdf.numPages)return;
  const page=await pdf.getPage(pageNumber);
  const base=page.getViewport({scale:1});
  const availableWidth=mobile()?slot.clientWidth:slot.clientWidth;
  const availableHeight=slot.clientHeight;
  const scale=Math.min(availableWidth/base.width,availableHeight/base.height);
  const viewport=page.getViewport({scale});
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const canvas=document.createElement("canvas");
  canvas.width=Math.floor(viewport.width*dpr);
  canvas.height=Math.floor(viewport.height*dpr);
  canvas.style.width=Math.floor(viewport.width)+"px";
  canvas.style.height=Math.floor(viewport.height)+"px";
  const ctx=canvas.getContext("2d",{alpha:false});
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle="#f4f4f1";
  ctx.fillRect(0,0,viewport.width,viewport.height);
  await page.render({canvasContext:ctx,viewport}).promise;
  slot.appendChild(canvas);
};

function range(){
  if(mobile())return [current,null];
  if(current===1)return [1,null];
  return [current,current+1];
}

async function renderSpread(direction=1){
  if(!pdf||busy)return;
  busy=true;
  const [a,b]=range();
  const total=pdf.numPages;
  counter.textContent=mobile()?a+" / "+total:(a===1?"1 / "+total:a+"–"+Math.min(b,total)+" / "+total);
  spread.classList.remove("is-turning");
  void spread.offsetWidth;
  spread.classList.add("is-turning");
  await pageCanvas(a,leftPage);
  if(mobile()){
    rightPage.style.display="flex";
    leftPage.style.display="none";
    await pageCanvas(a,rightPage);
  }else{
    leftPage.style.display=a===1?"none":"flex";
    rightPage.style.display="flex";
    if(a===1) await pageCanvas(1,rightPage); else await pageCanvas(b,rightPage);
  }
  loading.hidden=true;
  busy=false;
}

function forward(){
  if(!pdf||busy)return;
  if(mobile())current=Math.min(pdf.numPages,current+1);
  else if(current===1)current=2;
  else current=Math.min(pdf.numPages,current+2);
  renderSpread(1);
}
function backward(){
  if(!pdf||busy)return;
  if(mobile())current=Math.max(1,current-1);
  else if(current<=2)current=1;
  else current=Math.max(2,current-2);
  renderSpread(-1);
}
prev.forEach(b=>b.addEventListener("click",backward));
next.forEach(b=>b.addEventListener("click",forward));

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key==="PageDown"){e.preventDefault();forward()}
  if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();backward()}
  if(e.key==="Home"){e.preventDefault();current=1;renderSpread(-1)}
  if(e.key==="End"){e.preventDefault();current=mobile()?pdf?.numPages:(pdf?.numPages%2===0?pdf.numPages:pdf.numPages-1)||1;renderSpread(1)}
});

book.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].clientX},{passive:true});
book.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-touchX;
  if(Math.abs(dx)>45)dx<0?forward():backward();
},{passive:true});

fullscreen.addEventListener("click",async()=>{
  try{
    if(!document.fullscreenElement){await document.documentElement.requestFullscreen();fullscreen.textContent="Exit fullscreen"}
    else{await document.exitFullscreen();fullscreen.textContent="Fullscreen"}
  }catch{}
});
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement)fullscreen.textContent="Fullscreen"});

window.addEventListener("resize",()=>{if(pdf&&!busy)renderSpread()});

pdfjsLib.getDocument(PDF_URL).promise.then(doc=>{
  pdf=doc;
  renderSpread();
}).catch(err=>{
  loading.hidden=false;
  loading.textContent="Unable to load the portfolio PDF.";
  console.error(err);
});
