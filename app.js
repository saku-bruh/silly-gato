const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
function toast(msg, ms = 3000) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), ms);
}

const tabButtons = {
  random: $("#tabRandom"),
  album:  $("#tabAlbum")
};
const sections = {
  random: $("#sectionRandom"),
  album:  $("#sectionAlbum")
};

function switchTab(which) {
  const isRandom = which === "random";
  const isAlbum  = which === "album";

  Object.entries(tabButtons).forEach(([k, btn]) => {
    btn.classList.toggle("active", k === which);
    sections[k].classList.toggle("hidden", k !== which);
  });

  $("#frame").style.display = isRandom ? "block" : "none";
  $("#randomControls").style.display = isRandom ? "flex" : "none";

  if (isAlbum) {
    loadAlbum();
  } else {
    $("#album").innerHTML = "";
    delete $("#album").dataset.loaded;
  }
}
tabButtons.random.onclick = () => switchTab("random");
tabButtons.album.onclick  = () => switchTab("album");

const CAT_URL      = "https://cataas.com/cat";
const imgRandom    = $("#cat");
const loaderRandom = $("#loaderRandom");
const btnMore      = $("#btnMore");

function fetchRandomCat() {
  loaderRandom.style.display = "flex";
  imgRandom.style.display    = "none";
  btnMore.disabled = true;

  const w = 500 + Math.floor(Math.random() * 200);
  const h = 350 + Math.floor(Math.random() * 150);
  imgRandom.src = `${CAT_URL}?width=${w}&height=${h}&_=${Date.now()}`;
}

imgRandom.addEventListener("load", () => {
  loaderRandom.style.display = "none";
  imgRandom.style.display    = "block";
  btnMore.disabled = false;
});

imgRandom.addEventListener("error", () => {
  toast("Cat ran away – retrying");
  fetchRandomCat();
});

btnMore.addEventListener("click", fetchRandomCat);
fetchRandomCat();

const album = $("#album");

const MY_CAT_IMAGES = [
  "mycat/1.jpg",
  "mycat/2.jpg",
  "mycat/3.jpg"
];

function loadAlbum() {
  if (album.dataset.loaded) return;
  MY_CAT_IMAGES.forEach(addAlbumImg);
  album.dataset.loaded = "true";
}

function addAlbumImg(src) {
  const img = document.createElement("img");
  img.src = src;
  album.prepend(img);
}
