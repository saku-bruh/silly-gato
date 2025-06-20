const $ = q => document.querySelector(q)
function toast(m, s = 3000) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), s) }

const btnR = $("#tabRandom"), btnB = $("#tabBookmarks"), btnA = $("#tabAlbum")
const secR = $("#sectionRandom"), secB = $("#sectionBookmarks"), secA = $("#sectionAlbum")
const btnMore = $("#btnMore"), btnSave = $("#btnSave"), btnClear = $("#btnClear"), gifT = $("#gifToggle")
let clicksAlbum = 0, albumBuilt = false, bookBuilt = false, savedCurrent = false
let confettiOn = { v: false }, activePieces = 0

btnR.onclick = () => switchTab("random")
btnB.onclick = () => { if (!bookBuilt) loadBookmarks(); switchTab("book") }
btnA.onclick = () => { clicksAlbum++; if (clicksAlbum % 10 === 0) confetti(); switchTab("album") }
btnClear.onclick = () => { localStorage.bookCats = "[]"; grid.innerHTML = ""; updateClear(); toast("bookmarks cleared") }

function switchTab(t) {
  btnR.classList.toggle("active", t === "random")
  btnB.classList.toggle("active", t === "book")
  btnA.classList.toggle("active", t === "album")
  secR.classList.toggle("hidden", t !== "random")
  secB.classList.toggle("hidden", t !== "book")
  secA.classList.toggle("hidden", t !== "album")
  $("#frame").style.display = t === "random" ? "block" : "none"
  $("#randomControls").style.display = t === "random" ? "flex" : "none"
  if (t === "album" && !albumBuilt) buildAlbum()
}

function updateSave() { btnSave.disabled = savedCurrent || !img.complete || !img.naturalWidth }
gifT.onchange = updateSave

async function newFact() {
  try {
    const j = await fetch("https://catfact.ninja/fact").then(r => r.json())
    $("#catFact").textContent = "random cat fact: " + j.fact
  } catch {
    $("#catFact").textContent = "random cat fact: the internet cats are sleeping 😺"
  }
}

const BASE = "https://cataas.com/cat"
const img = $("#cat"), loader = $("#loaderRandom")
function fetchCat() {
  loader.style.display = "flex"; img.style.display = "none"; btnMore.disabled = true; savedCurrent = false; updateSave()
  const src = gifT.checked
    ? `${BASE}/gif?_=${Date.now()}`
    : `${BASE}?width=${500 + (Math.random() * 200 | 0)}&height=${350 + (Math.random() * 150 | 0)}&_=${Date.now()}`
  img.crossOrigin = "anonymous"; img.src = src; newFact()
}
img.onload = () => { loader.style.display = "none"; img.style.display = "block"; btnMore.disabled = false; updateSave() }
img.onerror = () => { toast("Cat escaped — retry"); fetchCat() }
btnMore.onclick = fetchCat

function getMarks() { return JSON.parse(localStorage.bookCats || "[]") }
function setMarks(a) { localStorage.bookCats = JSON.stringify(a) }
function updateClear() { btnClear.disabled = getMarks().length === 0 }

btnSave.onclick = () => {
  if (btnSave.disabled) return
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight
  c.getContext("2d").drawImage(img, 0, 0)
  const data = c.toDataURL("image/png")
  const a = getMarks(); if (!a.includes(data)) { a.push(data); setMarks(a); addBookmark(data); updateClear(); toast("bookmarked!") }
  savedCurrent = true; updateSave()
}

function piece() {
  const d = document.createElement("div"); d.className = "confetti"
  d.style.left = Math.random() * 100 + "vw"; d.style.background = `hsl(${Math.random() * 360},80%,60%)`
  d.style.animationDelay = Math.random() + "s"; d.style.animationDuration = 2.5 + Math.random() * 2 + "s"
  activePieces++; d.onanimationend = () => { d.remove(); if (--activePieces === 0) confettiOn.v = false }; return d
}
function confetti() {
  if (confettiOn.v) return; confettiOn.v = true; let s = 0
  const spawn = () => { for (let i = 0; i < 25 && s < 400; i++, s++) document.body.appendChild(piece()); if (s < 400) requestAnimationFrame(spawn) }
  spawn()
}

const album = $("#album"), IMGS = ["mycat/1.jpg", "mycat/2.jpg", "mycat/3.jpg"]
function addImg(p, src) { const i = new Image(); i.src = src; i.onload = () => i.style.opacity = 1; p.appendChild(i) }
function buildAlbum() { IMGS.forEach(s => addImg(album, s)); albumBuilt = true }

const grid = $("#bookmarkGrid")
function addBookmark(src) { addImg(grid, src) }
function loadBookmarks() { grid.innerHTML = ""; getMarks().forEach(src => addImg(grid, src)); updateClear(); bookBuilt = true }

fetchCat(); switchTab("random")
