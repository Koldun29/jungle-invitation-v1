'use strict';
(() => {
 const c = window.INVITATION;
 const n=Number(c.age), mod=n%100;
 const ordinal=`${n}${mod>=11&&mod<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th')}`;
 const replace = text => text.replaceAll('{{name}}', c.name).replaceAll('{{NAME}}', c.name.toLocaleUpperCase()).replaceAll('{{age}}', c.age).replaceAll('{{ordinal}}', ordinal.toUpperCase());
 const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
 while(walker.nextNode()) {
  const node=walker.currentNode;
  if(!['SCRIPT','STYLE'].includes(node.parentElement.tagName)) node.textContent=replace(node.textContent);
 }
 document.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => {
  if(a.value.includes('{{')) el.setAttribute(a.name, replace(a.value));
 }));
 document.querySelector('.party-details h3').textContent = `${c.name} is turning ${c.age}!`;
 const parts=c.date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
 const date=parts?`${Number(parts[1])} ${['January','February','March','April','May','June','July','August','September','October','November','December'][Number(parts[2])-1]} ${parts[3]}`:c.date;
 document.getElementById('party-when').textContent = [date,c.time,c.timezone].filter(Boolean).join(' · ');
 document.getElementById('party-where').textContent = [c.venue,c.address].filter(Boolean).join(', ');
 const rsvp=document.getElementById('party-rsvp');
 rsvp.textContent=c.rsvp.label;
 if(/^(https?:|mailto:|tel:)/i.test(c.rsvp.url)) {
  const a=document.createElement('a');a.href=c.rsvp.url;a.textContent=c.rsvp.label;a.style.color='inherit';rsvp.replaceChildren(a);
 }
 const slots={'#opening .hero':'opening','#ride img':'ride','.discovery-hero':'discovery','.party-andrew':'partyChild','.party-cat':'partyPet'};
 Object.entries(slots).forEach(([selector,key])=>document.querySelector(selector).src=c.characters[key]);
 // Fit personalized copy inside existing boxes; never move scene anchors or timelines.
 function fitPersonalizedText() {
  const name=document.querySelector('#title > .name');
  name.style.fontSize='';
  name.style.whiteSpace='nowrap';
  let size=parseFloat(getComputedStyle(name).fontSize);
  while(name.scrollWidth>name.clientWidth && size>8) {size-=.5;name.style.fontSize=size+'px';}
  document.querySelectorAll('.party-details h3,.party-details dd').forEach(el=>{
   el.style.overflowWrap='anywhere';el.style.minWidth='0';
   el.parentElement.style.minWidth='0';
  });
 }
 document.fonts.ready.then(fitPersonalizedText);
 window.addEventListener('resize',()=>requestAnimationFrame(fitPersonalizedText));
})();
