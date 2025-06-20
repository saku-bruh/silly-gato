/* =========================================================================
   thiscatdoesnotexist
   ========================================================================= */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------------------  Constants  ------------------------------ */
const CAT_ENDPOINT       = 'https://cataas.com/cat';
const FACT_ENDPOINT      = 'https://catfact.ninja/fact';
const BOOK_KEY           = 'bookCats';
const MAX_ALBUM_CLICKS   = 10;
const CONFETTI_BATCH     = 25;
const CONFETTI_TOTAL     = 400;

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

/* ------------------------  Tab system  -------------------------------- */
const panels = {
  random    : $('#random'),
  bookmarks : $('#bookmarks'),
  album     : $('#album'),
  notFound  : $('#notFound'),
};
const tabButtons = $$('nav button');
let albumClicks  = 0;
let albumBuilt   = false;
let bookBuilt    = false;

tabButtons.forEach(btn =>
  btn.addEventListener('click', () => activate(btn.dataset.tab)),
);

function activate(target) {
  // Easter-egg redirect
  if (target === 'album' && ++albumClicks % MAX_ALBUM_CLICKS === 0) {
    target = 'notFound';
    confetti();
  }

  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === target));
  for (const [k, el] of Object.entries(panels)) el.hidden = k !== target;
  footer.hidden = target !== 'random';

  if (target === 'album'     && !albumBuilt) buildAlbum();
  if (target === 'bookmarks' && !bookBuilt)  loadBookmarks();
}

/* ------------------  Random cat + fact logic  ------------------------- */
let savedCurrent = false;

function fetchCat() {
  loader.hidden = false;
  img.classList.remove('loaded');
  btnMore.disabled = true;
  savedCurrent = false;

  const src = gifToggle.checked
    ? `${CAT_ENDPOINT}/gif?_=${Date.now()}`
    : `${CAT_ENDPOINT}?width=${500 + rand(200)}&height=${350 + rand(150)}&_=${Date.now()}`;

  img.src = src;                          // resets img.complete ⇒ now false
  img.alt = gifToggle.checked ? 'A wild cat GIF!' : 'A wild gato appears!';
  updateSaveBtn();                        // *after* src set = button greyed-out
  fetchFact();
}

img.addEventListener('load', () => {
  loader.hidden = true;
  img.classList.add('loaded');
  btnMore.disabled = false;
  updateSaveBtn();                        // re-enable when appropriate
});

img.addEventListener('error', () => {
  toast('Cat escaped — retrying');
  setTimeout(fetchCat, 1600);
});

gifToggle.addEventListener('change', fetchCat);
btnMore.addEventListener('click', fetchCat);

/* -------------------------  Cat facts  -------------------------------- */
async function fetchFact() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4500);

    const res = await fetch(FACT_ENDPOINT, { signal: ctl.signal });
    clearTimeout(t);
    const { fact } = await res.json();
    factNode.textContent = `random cat fact: ${fact}`;
  } catch {
    factNode.textContent =
      'random cat fact: the internet cats are sleeping 😺';
  }
}

/* -----------------------  Bookmarks  ---------------------------------- */
btnSave.addEventListener('click', () => {
  if (btnSave.disabled) return;

  const dataUri = canvasFromImage(img);
  const list    = getBooks();

  if (!list.includes(dataUri)) {
    list.push(dataUri);
    setBooks(list);
    addImage(grid, dataUri);
    toast('bookmarked!');
  }
  savedCurrent = true;
  updateSaveBtn();
  updateClearBtn();
});

btnClear.addEventListener('click', () => {
  setBooks([]);
  grid.innerHTML = '';
  updateClearBtn();
  toast('bookmarks cleared');
});

function loadBookmarks() {
  getBooks().forEach(src => addImage(grid, src));
  bookBuilt = true;
  updateClearBtn();
}

/*  !!!  central place where we decide if bookmark button is active  !!! */
function updateSaveBtn() {
  btnSave.disabled =
    gifToggle.checked ||                // disable for GIFs
    savedCurrent    ||                  // already saved
    !img.complete;                      // image still loading
}

function updateClearBtn() {
  btnClear.disabled = getBooks().length === 0;
}

function getBooks() {
  try   { return JSON.parse(localStorage.getItem(BOOK_KEY) || '[]'); }
  catch { return []; }
}
function setBooks(arr) {
  localStorage.setItem(BOOK_KEY, JSON.stringify(arr));
}

/* ----------------------  Acoustic-car album  ------------------------- */
const ALBUM_IMGS = ['mycat/1.jpg', 'mycat/2.jpg', 'mycat/3.jpg'];

function buildAlbum() {
  ALBUM_IMGS.forEach(src => addImage(albumGrid, src));
  albumBuilt = true;
}

/* -------------------------  Confetti  --------------------------------- */
let confettiOn = false;
function confetti() {
  if (confettiOn) return;
  confettiOn = true;

  let spawned = 0;
  const loop = () => {
    for (let i = 0; i < CONFETTI_BATCH && spawned < CONFETTI_TOTAL; i++, spawned++) {
      document.body.appendChild(makePiece());
    }
    if (spawned < CONFETTI_TOTAL) requestAnimationFrame(loop);
    else setTimeout(() => (confettiOn = false), 3600);
  };
  loop();
}

function makePiece() {
  const d = document.createElement('div');
  d.className = 'confetti';
  d.style.left            = `${Math.random() * 100}vw`;
  d.style.background      = `hsl(${Math.random() * 360},80%,60%)`;
  d.style.animationDelay  = `${Math.random()}s`;
  d.style.animationDuration = `${2.5 + Math.random() * 2}s`;
  d.addEventListener('animationend', () => d.remove());
  return d;
}

/* -----------------------  Toast helper  ------------------------------- */
const toastNode = $('#toast');
function toast(msg, ms = 3000) {
  toastNode.textContent = msg;
  toastNode.hidden      = false;
  toastNode.classList.add('show');
  setTimeout(() => toastNode.classList.remove('show'), ms);
}

/* ----------------------  Utilities  ----------------------------------- */
function rand(max) {
  return Math.floor(Math.random() * max);
}

function addImage(parent, src) {
  const pic = new Image();
  pic.loading = 'lazy';
  pic.src     = src;
  pic.alt     = 'cat';
  pic.addEventListener('load', () => pic.classList.add('loaded'));
  parent.appendChild(pic);
}

function canvasFromImage(image) {
  const c = document.createElement('canvas');
  c.width  = image.naturalWidth;
  c.height = image.naturalHeight;
  c.getContext('2d').drawImage(image, 0, 0);
  return c.toDataURL('image/png');
}

/* --------------------------------------------------------------------- */
fetchCat();
activate('random');
