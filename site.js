document.documentElement.classList.add('js');
const menuButton=document.querySelector('.menu-button');
const menu=document.querySelector('#main-nav');
if(menuButton&&menu){
 const close=()=>{menu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');};
 menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));});
 menu.addEventListener('click',e=>{if(e.target.closest('a'))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}
const year=document.querySelector('#year');if(year)year.textContent=String(new Date().getFullYear());
const localContent=async(name)=>{
 const res=await fetch(new URL('./content/'+name,document.baseURI),{cache:'no-cache'});
 if(!res.ok)throw new Error('Indhold kan ikke hentes: '+name);
 return res.json();
};
function setText(id,value){const target=document.getElementById(id);if(target&&typeof value==='string')target.textContent=value;}
function safeImage(value){
 if(typeof value!=='string')return '';
 const path=value.replace(/^\.\//,'').replace(/^\//,'');
 if(!/^img\/uploads\/[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..'))return '';
 return new URL(path,document.baseURI).href;
}
function node(tag,cls,text){
 const out=document.createElement(tag);if(cls)out.className=cls;if(text!==undefined)out.textContent=String(text);return out;
}
function applyPageImage(id,value){
 const img=document.getElementById(id);
 if(!img)return;
 const src=safeImage(value);
 if(!src)return;
 img.src=src;
 img.hidden=false;
 const hint=img.parentElement?.querySelector('.photo-story-fallback');
 if(hint)hint.hidden=true;
}
function renderSettings(data){
 if(!data||Array.isArray(data))return;
 const fields=['hero_line1','hero_line2','hero_description','intro_lead','intro_body','impact_description','activities_description','member_description'];
 for(const key of fields)setText(key.replaceAll('_','-'),data[key]);
 applyPageImage('community-photo',data.community_image);
 applyPageImage('garden-photo',data.garden_image);
 applyPageImage('museum-photo',data.museum_image);
 if(data.hero_image){
  const src=safeImage(data.hero_image);
  if(src){
   const img=document.getElementById('hero-image');
   const placeholder=document.getElementById('hero-placeholder');
   if(img){img.src=src;img.hidden=false;}
   if(placeholder)placeholder.hidden=true;
   const credit=document.getElementById('photo-credit');
   if(credit&&data.hero_image_credit)credit.textContent=data.hero_image_credit;
  }
 }
}
function renderNews(items){
 if(!Array.isArray(items))return;
 const target=document.getElementById('news-container');if(!target)return;
 const visible=items.filter(x=>x&&x.title&&x.published!==false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 if(!visible.length)return;
 target.replaceChildren();
 for(const entry of visible){
  const card=node('article','news-entry');
  card.append(node('span','date',entry.date?new Intl.DateTimeFormat('da-DK',{day:'numeric',month:'long',year:'numeric'}).format(new Date(entry.date+'T12:00:00')):'NYT FRA FORENINGEN'));
  const body=node('div','news-entry-body');
  body.append(node('h3','',entry.title));
  if(entry.summary)body.append(node('p','',entry.summary));
  const src=safeImage(entry.image);
  if(src){const img=node('img');img.src=src;img.alt=entry.image_alt||entry.title;img.loading='lazy';body.append(img);}
  if(entry.body){
   const details=node('details'),summary=node('summary','','Læs mere'),full=node('p','',entry.body);
   details.append(summary,full);body.append(details);
  }
  card.append(body,node('span','arrow','↗'));target.append(card);
 }
}
function renderEvents(items){
 if(!Array.isArray(items))return;
 const target=document.getElementById('events-container');if(!target)return;
 const visible=items.filter(x=>x&&x.title&&x.date&&x.published!==false&&new Date(x.date).getTime()>=Date.now()-86400000).sort((a,b)=>new Date(a.date)-new Date(b.date));
 if(!visible.length)return;
 const list=node('div','events-list');
 for(const entry of visible){
  const card=node('article','event-item');
  const date=new Date(entry.date);
  card.append(node('span','date',Number.isFinite(date.getTime())?new Intl.DateTimeFormat('da-DK',{dateStyle:'long',timeStyle:entry.date.includes('T')?'short':undefined}).format(date):entry.date));
  card.append(node('h3','',entry.title));
  if(entry.location)card.append(node('p','location',entry.location));
  if(entry.description)card.append(node('p','',entry.description));
  list.append(card);
 }
 target.replaceWith(list);
}
Promise.allSettled([
 localContent('forside.json').then(renderSettings),
 localContent('nyheder.json').then(renderNews),
 localContent('arrangementer.json').then(renderEvents)
]).then(results=>results.filter(r=>r.status==='rejected').forEach(r=>console.warn(r.reason)));
