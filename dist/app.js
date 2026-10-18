'use strict';
const stage=document.getElementById('stage');
function fit(){const book=document.querySelector('.book'),style=getComputedStyle(book);const w=book.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);const h=book.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);const width=Math.min(w,h*9/16);stage.style.setProperty('--stage-width',width+'px');stage.style.setProperty('--stage-height',width*16/9+'px');}
window.addEventListener('resize',fit);fit();
const scenes=['opening','next','discovery','party-preview'].map(id=>document.getElementById(id));
const titles=['title','next-title','discovery-title','party-title'];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const curtain=document.getElementById('leaf-transition');
let active=0,busy=false,sceneMotion,transition,cluePulse;
let clueRevealed=false,digTaps=0;
// Keep the accessible sentence intact while revealing its visual words.
if(window.gsap){document.querySelectorAll('.eyebrow,.story').forEach(element=>{
 element.setAttribute('aria-label',element.innerText.replace(/\s+/g,' ').trim());
 const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim()){fragment.append(document.createTextNode(word));return;}const span=document.createElement('span');span.className='text-word';span.textContent=word;span.setAttribute('aria-hidden','true');fragment.append(span);});node.replaceWith(fragment);});
});}
function stopMotion(){if(sceneMotion){sceneMotion.revert();sceneMotion=null;}}
function animateScene(){
 stopMotion();if(!window.gsap||reduced.matches ){scenes[active].classList.remove("scene-pending");return;}
 sceneMotion=gsap.context(()=>{
  const root=scenes[active],q=selector=>root.querySelectorAll(selector);
  if(active===3){
   gsap.timeline()
    .from(q('.eyebrow'),{opacity:0,y:6,duration:.6,ease:'sine.out'},.1)
    .from(q('.title > span'),{opacity:0,scale:.88,y:10,duration:.85,stagger:.16,ease:'back.out(1.6)'},.3)
    .from(q('.party-details'),{opacity:0,y:12,duration:.8,ease:'power2.out'},1.05)
    .from(q('.party-andrew'),{opacity:0,x:-24,rotation:-4,duration:.9,ease:'back.out(1.4)'},.65)
    .from(q('.party-cat'),{opacity:0,x:24,rotation:4,duration:.9,ease:'back.out(1.4)'},.85)
    .from(q('.replay-story'),{opacity:0,duration:.4},1.6);
   gsap.to(q('.party-cat'),{rotation:-2,duration:1.2,repeat:-1,yoyo:true,repeatDelay:2.5,ease:'sine.inOut',delay:2.1});
   gsap.to(q('.party-andrew'),{rotation:1,duration:1.6,repeat:-1,yoyo:true,repeatDelay:3.2,ease:'sine.inOut',delay:2.4});
   return;
  }

  if(active===2){
   gsap.timeline()
    .from(q('.eyebrow'),{opacity:0,duration:.8,ease:'sine.out'},.15)
    .from(q('.title > span'),{opacity:0,y:8,duration:.8,stagger:.2,ease:'power2.out'},.4)
    .from(q(clueRevealed?'.clue-copy':'.story'),{opacity:0,y:5,duration:.7,ease:'sine.out'},1)
    .from(q('.discovery-hero'),{opacity:0,x:18,y:4,duration:1.1,ease:'power2.out'},.55)
    .from(q('.fossil'),{opacity:0,scale:.88,duration:.7,ease:'back.out(1.4)'},1.3);
   gsap.to(q('.discovery-hero'),{rotation:-1.3,transformOrigin:'50% 90%',duration:1.5,repeat:-1,yoyo:true,repeatDelay:1.8,ease:'sine.inOut',delay:2.2});

   return;
  }

  if(active===1){
   gsap.timeline()
    .from(q('.eyebrow'),{opacity:0,x:-16,duration:.65,ease:'power2.out'},.15)
    .from(q('.title > span'),{opacity:0,x:22,duration:.75,stagger:.18,ease:'power3.out'},.4)
    .from(q('.story .text-word'),{opacity:0,y:6,duration:.45,stagger:.12,ease:'sine.out'},1.05);
  }else{
  gsap.timeline({defaults:{ease:'power2.out'}})
   .from(q('.eyebrow .text-word'),{opacity:0,y:-15,scale:.8,duration:.65,stagger:.1,ease:'back.out(1.8)'},.1)
   .from(q('.title > .name'),{opacity:0,y:-20,scale:.65,transformOrigin:'50% 60%',duration:1,ease:'elastic.out(1,.55)'},.5)
   .from(q('.title > .adventure'),{opacity:0,y:12,scale:.82,transformOrigin:'50% 50%',duration:.75,ease:'back.out(2)'},.8)
   .from(q('.story .text-word'),{opacity:0,y:13,scale:.75,duration:.6,stagger:.08,ease:'back.out(1.8)'},1.25)
   .to(q('.story em'),{scale:1.1,duration:.2,repeat:1,yoyo:true,ease:'sine.inOut'},2.05);
  }
  const hero=q('.hero');
  const entrance=gsap.timeline().from(hero,active===1?{opacity:0,x:-45,y:4,rotation:-1.5,duration:1.25,ease:'power2.out'}:{opacity:0,y:28,scale:.84,rotation:-5,duration:1.05,ease:'back.out(1.7)'},.45);
  if(active===1){
   const ride=gsap.timeline({repeat:-1,repeatDelay:1.5})
    .to(hero,{x:4,y:-3,rotation:-1,duration:.4,ease:'sine.inOut'})
    .to(hero,{x:7,y:0,rotation:.8,duration:.4,ease:'sine.inOut'})
    .to(hero,{x:4,y:-3,rotation:-.8,duration:.4,ease:'sine.inOut'})
    .to(hero,{x:0,y:0,rotation:0,duration:.5,ease:'sine.inOut'});
   entrance.add(ride,2.5);
  }else{
   const hop=gsap.timeline({repeat:-1,repeatDelay:4.5})
    .to(hero,{scaleX:1.025,scaleY:.975,rotation:-2,duration:.22,ease:'power2.inOut'})
    .to(hero,{y:-9,scaleX:.99,scaleY:1.02,rotation:2,duration:.3,ease:'power2.out'})
    .to(hero,{y:0,scaleX:1.025,scaleY:.98,rotation:-1.5,duration:.28,ease:'power2.in'})
    .to(hero,{scaleX:1,scaleY:1,rotation:1.5,duration:.22,ease:'sine.inOut'})
    .to(hero,{rotation:-.8,duration:.22,ease:'sine.inOut'})
    .to(hero,{rotation:0,duration:.3,ease:'sine.out'});
   entrance.add(hop,3.2);
  }
 },scenes[active]);
 scenes[active].classList.remove("scene-pending");
}
function waitForImage(img){return new Promise((resolve,reject)=>{if(img.complete){img.naturalWidth?resolve():reject(new Error('Image failed'));return;}img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});});}
async function goTo(index){
 if(busy||index===active)return;
 busy=true;stage.inert=true;
 const status=document.getElementById('load-status');
 const timer=setTimeout(()=>{status.textContent='Getting the next page ready…';},500);
 try{await Promise.all([...scenes[index].querySelectorAll('img'),...curtain.querySelectorAll('img')].map(waitForImage));}
 catch(error){clearTimeout(timer);status.textContent='The artwork could not load. Please try again.';stage.inert=false;busy=false;return;}
 clearTimeout(timer);status.textContent='';
 const swap=()=>{scenes[index].classList.add("scene-pending");stopMotion();scenes.forEach((scene,i)=>{scene.hidden=i!==index;});active=index;document.getElementById('page').textContent=`0${index+1} / 04`;};
 const finish=()=>{animateScene();curtain.hidden=true;stage.inert=false;busy=false;transition=null;document.getElementById(titles[index]).focus({preventScroll:true});};
 if(!window.gsap){swap();finish();return;}
 transition=createLeafTransition(swap,finish);

}

// Animate plain numeric state: no CSS/GSAP transform decomposition or double offset.
function createLeafTransition(swap,finish){
 const left=curtain.querySelector('.leaf-left'),right=curtain.querySelector('.leaf-right');
 const state={left:-105,right:105,opacity:1};
 const render=()=>{left.style.transform=`translateX(${state.left}%)`;right.style.transform=`translateX(${state.right}%)`;curtain.style.opacity=state.opacity;};
 curtain.hidden=false;
 const tl=gsap.timeline({onComplete:()=>{curtain.style.opacity='';finish();}});
 if(reduced.matches){
  state.left=state.right=0;state.opacity=0;render();
  tl.to(state,{opacity:1,duration:.18,onUpdate:render}).call(swap).to(state,{opacity:0,duration:.2,onUpdate:render},'+=.15');
 }else{
  render();
  tl.to(state,{left:0,right:0,duration:.8,ease:'power2.inOut',onUpdate:render})
    .call(swap)
    .to(state,{left:-105,right:105,duration:.85,ease:'power2.inOut',onUpdate:render},'+=.25');
 }
 return tl;
}
document.getElementById('explore').addEventListener('click',()=>goTo(1));
document.getElementById('back').addEventListener('click',()=>goTo(0));
document.getElementById('ride').addEventListener('click',()=>goTo(2));
document.getElementById('back-to-ride').addEventListener('click',()=>goTo(1));
document.getElementById('back-to-discovery').addEventListener('click',()=>goTo(2));
document.getElementById('replay').addEventListener('click',()=>{if(busy)return;clueRevealed=false;digTaps=0;document.getElementById("fossil").setAttribute("data-dig","0");document.getElementById('clue-copy').hidden=true;document.getElementById('discovery-story').hidden=false;document.getElementById('fossil').setAttribute('aria-expanded','false');document.getElementById('fossil').setAttribute('aria-label','Tap the ground bump three times to uncover the fossil');document.getElementById('fossil-hint').textContent='Tap the little mound 3 times to uncover it.';goTo(0);});
function revealClue(){
 if(busy||active!==2||clueRevealed)return;
 clueRevealed=true;
 if(cluePulse){cluePulse.kill();cluePulse=null;}
 document.getElementById('discovery-story').hidden=true;
 document.getElementById('clue-copy').hidden=false;
 document.getElementById('fossil').setAttribute('aria-expanded','true');
 document.getElementById('fossil-hint').textContent='Tap the fossil to find the party.';
 document.getElementById('fossil').setAttribute('aria-label','Continue to the party');
 if(window.gsap&&!reduced.matches&&sceneMotion){sceneMotion.add(()=>{
  gsap.from('#clue-copy',{opacity:0,y:8,scale:.94,duration:.75,ease:'back.out(1.6)'});
 });}
}
function digForClue(){
 if(busy||active!==2)return;
 if(clueRevealed){goTo(3);return;}
 digTaps=Math.min(3,digTaps+1);
 const fossil=document.getElementById('fossil');
 fossil.setAttribute('data-dig',String(digTaps));
 if(digTaps===3){revealClue();return;}
 const remaining=3-digTaps;
 document.getElementById('fossil-hint').textContent=remaining===2?'A little deeper…':'Something blue is peeking through!';
 fossil.setAttribute('aria-label',`Dig for the fossil: ${remaining} more ${remaining===1?'tap':'taps'}`);
 if(window.gsap&&!reduced.matches&&sceneMotion){sceneMotion.add(()=>{gsap.fromTo(fossil,{rotation:-2},{rotation:0,duration:.3,ease:'elastic.out(1,.3)',overwrite:true});});}
}
document.getElementById('fossil').addEventListener('click',digForClue);

reduced.addEventListener('change',()=>{if(transition){transition.progress(1);}else{animateScene();}});
// Avoid first-paint flashes and font swaps before the initial entrance.
Promise.allSettled([document.fonts.ready,...document.querySelectorAll('#opening img,.stage > .jungle')].map(item=>item instanceof HTMLImageElement?waitForImage(item):item)).then(()=>{
 try{if(!window.bootExpired)animateScene();}finally{clearTimeout(window.bootSafety);document.documentElement.classList.remove('animation-boot');}
});
