/* =========================================================================
   thiscatdoesnotexist
   ========================================================================= */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

/* ---------------------------  Constants  ------------------------------ */
const CAT_ENDPOINT     = 'https://cataas.com/cat';
const FACT_ENDPOINT    = 'https://catfact.ninja/fact';
const BOOK_KEY         = 'bookCats';
const MAX_ALBUM_CLICKS = 10;
const CONFETTI_BATCH   = 25;
const CONFETTI_TOTAL   = 400;

/* ---------------------------  Elements  ------------------------------- */
const img       = $('#cat');
const loader    = $('#frame .loader');
const btnMore   = $('#btnMore');
const btnSave   = $('#btnSave');
const gifToggle = $('#gifToggle');
const factNode  = $('#catFact');
const grid      = $('#bookmarkGrid');
const btnClear  = $('#btnClear');
const albumGrid = $('#albumGrid');
const footer    = $('#siteFooter');

/* Overlay (for thumbnails only) */
const overlay      = $('#overlay');
const overlayImg   = $('#overlayImg');
const overlayClose = $('#overlayClose');

/* ------------------------  Tab system  ------------------------------- */
const panels = {random:$('#random'),bookmarks:$('#bookmarks'),album:$('#album'),notFound:$('#notFound')};
const tabBtns = $$('nav button');
let albumClicks=0, albumBuilt=false, bookBuilt=false;

tabBtns.forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
function switchTab(t){
  if(t==='album' && ++albumClicks%MAX_ALBUM_CLICKS===0){t='notFound';confetti();}
  tabBtns.forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  Object.entries(panels).forEach(([k,el])=>el.hidden=k!==t);
  footer.hidden=t!=='random';
  if(t==='album'&&!albumBuilt) buildAlbum();
  if(t==='bookmarks'&&!bookBuilt) loadBookmarks();
}

/* ------------------  Random cat logic  ------------------------------- */
let savedCurrent=false;
function fetchCat(){
  loader.hidden=false;
  img.classList.remove('loaded');
  btnMore.disabled=true;
  savedCurrent=false;

  const src=gifToggle.checked
    ?`${CAT_ENDPOINT}/gif?_=${Date.now()}`
    :`${CAT_ENDPOINT}?width=${500+rand(200)}&height=${350+rand(150)}&_=${Date.now()}`;

  img.crossOrigin='anonymous';
  img.src=src;
  img.alt=gifToggle.checked?'A wild cat GIF!':'A wild gato appears!';
  updateSaveBtn();
  fetchFact();
}
img.addEventListener('load',()=>{loader.hidden=true;img.classList.add('loaded');btnMore.disabled=false;updateSaveBtn();});
img.addEventListener('error',()=>{toast('Cat escaped — retrying');setTimeout(fetchCat,1600);});
gifToggle.addEventListener('change',fetchCat);
btnMore.addEventListener('click',fetchCat);
/*  ►► REMOVED img-click handler so no overlay on main image ◄◄ */

/* ------------------------  Cat facts  -------------------------------- */
async function fetchFact(){
  try{
    const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4500);
    const res=await fetch(FACT_ENDPOINT,{signal:ctl.signal});clearTimeout(t);
    const {fact}=await res.json();
    factNode.textContent=`random cat fact: ${fact}`;
  }catch{
    factNode.textContent='random cat fact: the internet cats are sleeping 😺';
  }
}

/* ------------------------  Bookmarks  -------------------------------- */
btnSave.addEventListener('click',()=>{
  if(btnSave.disabled)return;
  const uri=canvasFromImage(img), list=getBooks();
  if(!list.includes(uri)){list.push(uri);setBooks(list);addThumb(grid,uri);toast('bookmarked!');}
  savedCurrent=true;updateSaveBtn();updateClear();
});
btnClear.addEventListener('click',()=>{setBooks([]);grid.innerHTML='';updateClear();toast('bookmarks cleared');});
function loadBookmarks(){getBooks().forEach(src=>addThumb(grid,src));bookBuilt=true;updateClear();}
function updateSaveBtn(){btnSave.disabled=gifToggle.checked||savedCurrent||!img.complete;}
function updateClear(){btnClear.disabled=getBooks().length===0;}
function getBooks(){try{return JSON.parse(localStorage.getItem(BOOK_KEY)||'[]');}catch{return[];}}
function setBooks(a){localStorage.setItem(BOOK_KEY,JSON.stringify(a));}

/* -----------------  Album build  ------------------------------------ */
const ALBUM_IMGS=['mycat/1.jpg','mycat/2.jpg','mycat/3.jpg'];
function buildAlbum(){ALBUM_IMGS.forEach(src=>addThumb(albumGrid,src));albumBuilt=true;}

/* -----------------  Confetti  --------------------------------------- */
let confettiOn=false;
function confetti(){
  if(confettiOn)return;confettiOn=true;
  let spawned=0;
  (function loop(){
    for(let i=0;i<CONFETTI_BATCH&&spawned<CONFETTI_TOTAL;i++,spawned++)
      document.body.appendChild(piece());
    if(spawned<CONFETTI_TOTAL)requestAnimationFrame(loop);
    else setTimeout(()=>confettiOn=false,3600);
  })();
}
function piece(){
  const d=document.createElement('div');d.className='confetti';
  d.style.left=`${Math.random()*100}vw`;
  d.style.background=`hsl(${Math.random()*360},80%,60%)`;
  d.style.animationDelay=`${Math.random()}s`;
  d.style.animationDuration=`${2.5+Math.random()*2}s`;
  d.onanimationend=()=>d.remove();
  return d;
}

/* --------------  Overlay helpers (thumbnails only)  ----------------- */
function openOverlay(src){
  if(!overlay||!overlayImg)return;
  overlayImg.src=src;overlay.hidden=false;document.body.style.overflow='hidden';
}
function closeOverlay(){
  if(!overlay)return;
  overlay.hidden=true;overlayImg.src='';document.body.style.overflow='';
}
if(overlayClose){
  overlayClose.addEventListener('click',closeOverlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeOverlay();});
}

/* -----------------------  Toast  ------------------------------------ */
const toastNode=$('#toast');
function toast(msg,ms=3000){
  toastNode.textContent=msg;toastNode.hidden=false;toastNode.classList.add('show');
  setTimeout(()=>toastNode.classList.remove('show'),ms);
}

/* ----------------  Utilities  --------------------------------------- */
function rand(m){return Math.floor(Math.random()*m);}
function addThumb(parent,src){
  const pic=new Image();pic.loading='lazy';pic.src=src;pic.alt='cat';
  pic.onload=()=>pic.classList.add('loaded');
  pic.addEventListener('click',()=>openOverlay(src));
  parent.appendChild(pic);
}
function canvasFromImage(im){
  const c=document.createElement('canvas');
  c.width=im.naturalWidth;c.height=im.naturalHeight;
  c.getContext('2d').drawImage(im,0,0);
  return c.toDataURL('image/png');
}

/* ----------------  Kick-off  ---------------------------------------- */
fetchCat();
switchTab('random');
