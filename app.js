/* =========================================================================
   thiscatdoesnotexist
   ========================================================================= */
const $  = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];

/* ---------------------------  Constants  ------------------------------ */
const CAT_ENDPOINT     = 'https://cataas.com/cat';
const FACT_ENDPOINT    = 'https://catfact.ninja/fact';
const BOOK_KEY         = 'bookCats';
const THEME_KEY        = 'themePref';
const MAX_ALBUM_CLICKS = 10;
const CONFETTI_BATCH   = 25;
const CONFETTI_TOTAL   = 400;

/* ---------------------------  Elements  ------------------------------- */
const body      = document.body;
const img       = $('#cat');
const namingControls = $('.naming-controls'); // Select the container
const catName   = $('#catName');
const loader    = $('#frame .loader');
const btnMore   = $('#btnMore');
const btnSave   = $('#btnSave');
const gifToggle = $('#gifToggle');
const factNode  = $('#catFact');
const grid      = $('#bookmarkGrid');
const btnClear  = $('#btnClear');
const albumGrid = $('#albumGrid');
const footer    = $('#siteFooter');
const meowSfx   = $('#meowSfx');
const themeToggle = $('#themeToggle');
const themeLabel = $('#themeLabel');

/* Overlay Elements */
const overlay      = $('#overlay');
const overlayImg   = $('#overlayImg');
const overlayClose = $('#overlayClose');

/* ------------------------  State Variables  --------------------------- */
const panels = {random:$('#random'),bookmarks:$('#bookmarks'),album:$('#album'),notFound:$('#notFound')};
const tabBtns = $$('nav button');
let albumClicks=0, albumBuilt=false, bookBuilt=false;
let currentImageURI = '';

/* ------------------------  Tab system  ------------------------------- */
tabBtns.forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
function switchTab(t){
  if(t==='album' && ++albumClicks%MAX_ALBUM_CLICKS===0){t='notFound';confetti();}
  tabBtns.forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  Object.entries(panels).forEach(([k,el])=>el.hidden=k!==t);
  footer.hidden=t!=='random';
  if(t==='album'&&!albumBuilt) buildAlbum();
  if(t==='bookmarks'&&!bookBuilt) loadBookmarks();
}

/* ------------------  Random cat logic  ------------------------------- */
function fetchCat(){
  loader.hidden=false;
  img.classList.remove('loaded');
  btnMore.disabled=true;
  currentImageURI = '';
  catName.value = '';
  updateNamingControls();

  const src=gifToggle.checked
    ?`${CAT_ENDPOINT}/gif?_=${Date.now()}`
    :`${CAT_ENDPOINT}?width=${500+rand(200)}&height=${350+rand(150)}&_=${Date.now()}`;

  img.crossOrigin='anonymous';
  img.src=src;
  img.alt=gifToggle.checked?'A wild cat GIF!':'A wild gato appears!';
  updateSaveBtn();
  fetchFact();
}

img.addEventListener('load',()=>{
  loader.hidden=true;
  img.classList.add('loaded');
  btnMore.disabled=false;
  currentImageURI = canvasFromImage(img);
  updateSaveBtn();
});

img.addEventListener('error',()=>{toast('Cat escaped — retrying');setTimeout(fetchCat,1600);});
gifToggle.addEventListener('change',fetchCat);
btnMore.addEventListener('click',()=>{playSound(meowSfx); fetchCat();});

// Updated function to hide/show the entire naming container
function updateNamingControls() {
    namingControls.hidden = gifToggle.checked;
}

/* ------------------------  Sound Effects  ---------------------------- */
function playSound(audioEl) {
    audioEl.currentTime = 0;
    audioEl.play().catch(e => console.log("Sound play failed:", e));
}

/* ------------------------  Cat facts  -------------------------------- */
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

/* ------------------------  Bookmarks  -------------------------------- */
btnSave.addEventListener('click',()=>{
  if(btnSave.disabled)return;
  playSound(meowSfx);
  const name = catName.value.trim() || 'Unnamed Cat';
  const newBookmark = { src: currentImageURI, name };
  const list = getBooks();
  
  if(!list.some(b => b.src === currentImageURI)){
      list.push(newBookmark);
      setBooks(list);
      if (bookBuilt) {
          addThumb(grid, newBookmark);
      }
      toast('bookmarked!');
  } else {
      toast('You already bookmarked this cat!');
  }
  
  updateSaveBtn();
  updateClear();
});

btnClear.addEventListener('click',()=>{
    setBooks([]);
    grid.innerHTML='';
    updateClear();
    toast('bookmarks cleared');
    updateSaveBtn();
});

function loadBookmarks(){
    grid.innerHTML = '';
    getBooks().forEach(bookmark=>addThumb(grid,bookmark));
    bookBuilt=true;
    updateClear();
}

function updateSaveBtn(){
    const isAlreadyBookmarked = getBooks().some(b => b.src === currentImageURI);
    btnSave.disabled = gifToggle.checked || !img.complete || !currentImageURI || isAlreadyBookmarked;
}

function updateClear(){btnClear.disabled=getBooks().length===0;}
function getBooks(){try{return JSON.parse(localStorage.getItem(BOOK_KEY)||'[]');}catch{return[];}}
function setBooks(a){localStorage.setItem(BOOK_KEY,JSON.stringify(a));}

/* -----------------  Album build  ------------------------------------ */
const ALBUM_IMGS=[{src:'mycat/1.jpg'},{src:'mycat/2.jpg'},{src:'mycat/3.jpg'}];
function buildAlbum(){ALBUM_IMGS.forEach(img=>addThumb(albumGrid,img,true));albumBuilt=true;}

/* -----------------  Confetti  --------------------------------------- */
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

/* --------------  Overlay helpers (thumbnails only)  ----------------- */
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

/* -----------------------  Toast  ------------------------------------ */
const toastNode=$('#toast');
function toast(msg,ms=3000){
  toastNode.textContent=msg;toastNode.hidden=false;toastNode.classList.add('show');
  setTimeout(()=>toastNode.classList.remove('show'),ms);
}

/* ----------------  Utilities  --------------------------------------- */
function rand(m){return Math.floor(Math.random()*m);}

function addThumb(parent, bookmark, isAlbum=false){
  const container = document.createElement('div');
  container.className = 'bookmark-item';

  const pic = new Image();
  pic.loading = 'lazy';
  pic.src = bookmark.src;
  pic.alt = bookmark.name || 'cat';
  pic.onload = () => pic.classList.add('loaded');
  pic.addEventListener('click',()=>openOverlay(bookmark.src));
  
  container.appendChild(pic);

  if (!isAlbum) {
      const caption = document.createElement('div');
      caption.className = 'bookmark-caption';
      caption.textContent = bookmark.name;
      container.appendChild(caption);

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      downloadBtn.setAttribute('aria-label', `Download ${bookmark.name}`);
      downloadBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
      downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const a = document.createElement('a');
          a.href = bookmark.src;
          a.download = `${bookmark.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast(`Downloading ${bookmark.name}...`);
      });
      container.appendChild(downloadBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.setAttribute('aria-label', `Delete ${bookmark.name}`);
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/></svg>`;
      deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const allBookmarks = getBooks();
          const filteredBookmarks = allBookmarks.filter(b => b.src !== bookmark.src);
          setBooks(filteredBookmarks);
          container.remove();
          updateClear();
          updateSaveBtn();
          toast('Bookmark removed!');
      });
      container.appendChild(deleteBtn);
  }
  
  parent.appendChild(container);
}

function canvasFromImage(im){
  const c=document.createElement('canvas');
  c.width=im.naturalWidth;c.height=im.naturalHeight;
  c.getContext('2d').drawImage(im,0,0);
  return c.toDataURL('image/png');
}

/* ----------------  Theme Toggle Logic  ----------------------------- */
function applyTheme(theme) {
    if (theme === 'light') {
        body.classList.add('light-theme');
        themeToggle.checked = false;
        themeLabel.textContent = 'light mode';
    } else {
        body.classList.remove('light-theme');
        themeToggle.checked = true;
        themeLabel.textContent = 'dark mode';
    }
}
function toggleTheme() {
    const newTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
}
themeToggle.addEventListener('change', toggleTheme);

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);
}

/* ----------------  Kick-off  ---------------------------------------- */
initTheme();
fetchCat();
switchTab('random');