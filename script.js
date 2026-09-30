const portrait=document.querySelector(".portrait");
const typeLines=document.querySelectorAll(".type-line");

let mouseX=0,mouseY=0;
let currentX=0,currentY=0;
let parallaxX=0,parallaxY=0;

document.addEventListener("mousemove",(event)=>{
  const x=event.clientX/window.innerWidth-.5;
  const y=event.clientY/window.innerHeight-.5;

  mouseX=x*28;
  mouseY=y*22;
  parallaxX=x;
  parallaxY=y;
});

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
