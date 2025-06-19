const $ = q => document.querySelector(q)



function toast(msg, ms = 3000) {
  const t = $("#toast")
  t.textContent = msg
  t.classList.add("show")
  setTimeout(() => t.classList.remove("show"), ms)
}



const btnR = $("#tabRandom")
const btnA = $("#tabAlbum")
const secR = $("#sectionRandom")
const secA = $("#sectionAlbum")

let albumClicks = 0
let albumBuilt  = false
const THRESHOLD = 10



btnR.onclick = () => showRandom(true)

btnA.onclick = () => {
  albumClicks++
  if (albumClicks % THRESHOLD === 0) confetti()
  showRandom(false)
}



function showRandom(show) {
  btnR.classList.toggle("active", show)
  btnA.classList.toggle("active", !show)
  secR.classList.toggle("hidden", !show)
  secA.classList.toggle("hidden",  show)

  $("#frame").style.display          = show ? "block" : "none"
  $("#randomControls").style.display = show ? "flex"  : "none"

  if (!show && !albumBuilt) buildAlbum()
}



const facts = [
  "Cats sleep 70% of their lives.",
  "A group of cats is called a clowder.",
  "Cats can jump six times their length.",
  "Oldest cat lived to 38 years.",
  "A cat’s purr may heal bones!",
  "Some cats love water (Turkish Vans)."
]

function newFact() {
  $("#catFact").textContent =
    `random cat fact: ${facts[Math.random() * facts.length | 0]}`
}



const STATIC = "https://cataas.com/cat"
const GIF    = "https://cataas.com/cat/gif"

const img    = $("#cat")
const loader = $("#loaderRandom")
const btnMore = $("#btnMore")
const gifT    = $("#gifToggle")



function fetchCat() {
  loader.style.display = "flex"
  img.style.display    = "none"
  btnMore.disabled     = true

  const base = gifT.checked ? GIF : STATIC
  const q    = gifT.checked
    ? `?_=${Date.now()}`
    : `?width=${500 + (Math.random() * 200 | 0)}&height=${350 + (Math.random() * 150 | 0)}&_=${Date.now()}`

  img.src = base + q
  newFact()
}



img.onload = () => {
  loader.style.display = "none"
  img.style.display    = "block"
  btnMore.disabled     = false
  localStorage.lastCat = img.src
}

img.onerror = () => {
  toast("Cat escaped — retry")
  fetchCat()
}

btnMore.onclick = fetchCat



if (localStorage.lastCat) {
  img.src = localStorage.lastCat
  img.style.display = "block"
} else fetchCat()



let confettiActive = false
let activePieces   = 0



function makePiece() {
  const d = document.createElement("div")
  d.className = "confetti"

  d.style.left            = Math.random() * 100 + "vw"
  d.style.backgroundColor = `hsl(${Math.random() * 360},80%,60%)`
  d.style.animationDelay  = Math.random() + "s"
  d.style.animationDuration = 2.5 + Math.random() * 2 + "s"

  activePieces++
  d.onanimationend = () => {
    d.remove()
    if (--activePieces === 0) confettiActive = false
  }
  return d
}



function confetti() {
  if (confettiActive) return
  confettiActive = true

  const TOTAL = 400
  const BATCH = 25
  let spawned = 0

  function spawn() {
    for (let i = 0; i < BATCH && spawned < TOTAL; i++, spawned++) {
      document.body.appendChild(makePiece())
    }
    if (spawned < TOTAL) requestAnimationFrame(spawn)
  }

  spawn()
}



const album = $("#album")
const IMGS  = ["mycat/1.jpg", "mycat/2.jpg", "mycat/3.jpg"]

function buildAlbum() {
  IMGS.forEach(src => {
    const i = new Image()
    i.src = src
    album.appendChild(i)
  })
  albumBuilt = true
}



showRandom(true)
