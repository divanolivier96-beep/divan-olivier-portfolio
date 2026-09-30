const portrait=document.querySelector(".portrait");
const typeLines=document.querySelectorAll(".type-line");

let mouseX=0,mouseY=0;
let currentX=0,currentY=0;
let parallaxX=0,parallaxY=0;

function setPointerPosition(clientX,clientY){
  const x=clientX/window.innerWidth-.5;
  const y=clientY/window.innerHeight-.5;

  mouseX=x*28;
  mouseY=y*22;
  parallaxX=x;
  parallaxY=y;
}

document.addEventListener("mousemove",(event)=>{
  setPointerPosition(event.clientX,event.clientY);
});

document.addEventListener("touchmove",(event)=>{
  if(event.touches.length>0){
    const touch=event.touches[0];
    setPointerPosition(touch.clientX,touch.clientY);
  }
},{passive:true});

document.addEventListener("touchend",()=>{
  mouseX=0;
  mouseY=0;
  parallaxX=0;
  parallaxY=0;
},{passive:true});

function animate(){
  currentX+=(mouseX-currentX)*.075;
  currentY+=(mouseY-currentY)*.075;

  if(portrait){
    const rotateY=currentX*.22;
    const rotateX=-currentY*.18;

    portrait.style.transform=
      `translate3d(${currentX}px,${currentY}px,0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  typeLines.forEach((line,index)=>{
    const strength=(index+1)*2;
    line.style.marginLeft=`${parallaxX*strength}px`;
    line.style.marginTop=`${parallaxY*strength}px`;
  });

  requestAnimationFrame(animate);
}

animate();