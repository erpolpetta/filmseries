/* ==============================
   SCRIPT.JS - Consigli Film & Serie con TMDb
   ============================== */

const apiKey = "2d3cf36a009fccd04e0537124889559f";

/* ==============================
   UTILITY
   ============================== */
function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function creaCard(film, listaId) {
  const container = document.getElementById(listaId);
  const card = document.createElement("div");

  card.innerHTML = `
    <h3>${film.title}</h3>
    <img src="https://image.tmdb.org/t/p/w200${film.poster_path}" alt="${film.title}" style="width:150px; float:left; margin-right:10px;">
    <p>${film.overview ? (film.overview.length > 200 ? film.overview.substring(0, 200) + "..." : film.overview) : "Trama non disponibile"}</p>
    <button class="vistoBtn">Segna come Visto</button>
    <button class="daVedereBtn">Segna come Da Vedere</button>
    <div style="clear:both;"></div>
  `;
  container.appendChild(card);

  // Animazione fade-in
  card.style.opacity = 0;
  setTimeout(() => card.style.opacity = 1, 100);

  // Eventi pulsanti
  card.querySelector(".vistoBtn").addEventListener("click", () => {
    aggiungiArchivio("listaVisti", film);
  });
  card.querySelector(".daVedereBtn").addEventListener("click", () => {
    aggiungiArchivio("listaConsigliati", film);
  });
}

function aggiungiArchivio(listaId, film) {
  let lista = JSON.parse(localStorage.getItem(listaId)) || [];
  if (!lista.some(f => f.id === film.id)) {
    lista.push(film);
    localStorage.setItem(listaId, JSON.stringify(lista));
    renderArchivio(listaId);
  }
}

function renderArchivio(listaId) {
  const container = document.getElementById(listaId);
  container.innerHTML = "";
  const lista = JSON.parse(localStorage.getItem(listaId)) || [];
  lista.forEach(film => {
    const li = document.createElement("li");
    li.textContent = film.title;
    container.appendChild(li);
  });
}

/* ==============================
   CHIAMATE API
   ============================== */
async function cercaTitolo(titolo) {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=it-IT&query=${encodeURIComponent(titolo)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}

async function generaConsigli() {
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

  const titoloInserito = document.getElementById("titoloInput").value.trim();
  if (!titoloInserito) {
    alert("Inserisci un titolo per ricevere consigli!");
    return;
  }

  const risultati = await cercaTitolo(titoloInserito);
  if (!risultati || risultati.length === 0) {
    alert("Titolo non trovato.");
    return;
  }

  const filmSelezionato = risultati[0];

  // Filtra per genere/tag
  const tag = filmSelezionato.genre_ids || [];

  // Prendi un insieme di film/serie correlati per genere
  const consigli = await Promise.all(tag.map(async g => {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${g}&language=it-IT`;
    const resp = await fetch(url);
    const data = await resp.json();
    return data.results || [];
  }));

  // Appiattisci array e rimuovi duplicati
  let tuttiConsigli = [].concat(...consigli);
  tuttiConsigli = tuttiConsigli.filter(f => f.id !== filmSelezionato.id);
  const uniqueConsigli = Array.from(new Map(tuttiConsigli.map(f => [f.id, f])).values());

  // Consigli famosi = popolarità >= 70
  const famosi = getRandomElements(uniqueConsigli.filter(f => f.popularity >= 70), 5);
  famosi.forEach(f => creaCard(f, "listaFamosi"));

  // Consigli di nicchia = popolarità < 70
  const nicchia = getRandomElements(uniqueConsigli.filter(f => f.popularity < 70), 5);
  nicchia.forEach(f => creaCard(f, "listaNicchia"));

  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
}

/* ==============================
   CONSIGLI CASUALI
   ============================== */
async function consigliCasuali() {
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

  // Prendi tutti i generi disponibili
  const urlGen = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=it-IT`;
  const respGen = await fetch(urlGen);
  const dataGen = await respGen.json();
  const generi = dataGen.genres.map(g => g.id);

  const tagRandom = generi[Math.floor(Math.random() * generi.length)];

  const urlCons = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${tagRandom}&language=it-IT`;
  const respCons = await fetch(urlCons);
  const dataCons = await respCons.json();
  const consigli = getRandomElements(dataCons.results, 10);

  consigli.forEach((f, i) => {
    if (i < 5) creaCard(f, "listaFamosi");
    else creaCard(f, "listaNicchia");
  });
}

/* ==============================
   EVENT LISTENERS
   ============================== */
document.getElementById("consigliaBtn").addEventListener("click", generaConsigli);

/* ==============================
   CARICA ARCHIVI DAL LOCALSTORAGE
   ============================== */
window.addEventListener("load", () => {
  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
});
