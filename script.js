const portrait=document.querySelector(".portrait");
const typeLines=document.querySelectorAll(".type-line");
let mouseX=0,mouseY=0,currentX=0,currentY=0,parallaxX=0,parallaxY=0;

document.addEventListener("mousemove",(event)=>{
  const x=event.clientX/window.innerWidth-.5;
  const y=event.clientY/window.innerHeight-.5;
  mouseX=x*18;
  mouseY=y*18;
  parallaxX=x;
  parallaxY=y;
});

function animate(){
  currentX+=(mouseX-currentX)*.06;
  currentY+=(mouseY-currentY)*.06;

  if(portrait){
    portrait.style.transform=`translate(${currentX}px,${currentY}px)`;
  }

  typeLines.forEach((line,index)=>{
    const strength=(index+1)*2;
    line.style.marginLeft=`${parallaxX*strength}px`;
    line.style.marginTop=`${parallaxY*strength}px`;
  });

  requestAnimationFrame(animate);
}

animate();