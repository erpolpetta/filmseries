/* ==============================
   SCRIPT.JS - Consigli Film & Serie Avanzato
   ============================== */

const apiKey = "2d3cf36a009fccd04e0537124889559f";

/* ==============================
   UTILITY
   ============================== */
function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Calcola quante corrispondenze di tag/genre ci sono tra due film
function calcolaTagsComuni(tags1, tags2) {
  return tags1.filter(t => tags2.includes(t)).length;
}

// Crea le stelle da 1 a 5 in base a un punteggio
function creaStelle(punteggio) {
  let stars = "";
  for (let i = 0; i < 5; i++) {
    stars += i < punteggio ? "⭐" : "☆";
  }
  return stars;
}

function creaCard(film, listaId, tagsSelezionati) {
  const container = document.getElementById(listaId);
  const comuni = calcolaTagsComuni(tagsSelezionati, film.genre_ids || []);
  const punteggioStelle = Math.min(comuni, 5);

  const tagComuni = (film.genre_ids || []).filter(t => tagsSelezionati.includes(t));

  const card = document.createElement("div");
  card.innerHTML = `
    <h3>${film.title}</h3>
    <img src="https://image.tmdb.org/t/p/w200${film.poster_path}" alt="${film.title}" style="width:150px; float:left; margin-right:10px;">
    <p>${film.overview ? (film.overview.length > 200 ? film.overview.substring(0, 200) + "..." : film.overview) : "Trama non disponibile"}</p>
    <p>Tag in comune: ${tagComuni.join(", ")}</p>
    <p>${creaStelle(punteggioStelle)}</p>
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

/* ==============================
   ARCHIVI LOCALSTORAGE
   ============================== */
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
   AUTOCOMPLETE
   ============================== */
const inputTitolo = document.getElementById("titoloInput");
const autocompleteContainer = document.createElement("div");
autocompleteContainer.style.position = "absolute";
autocompleteContainer.style.background = "#1e1e1e";
autocompleteContainer.style.zIndex = "999";
autocompleteContainer.style.width = inputTitolo.offsetWidth + "px";
inputTitolo.parentNode.appendChild(autocompleteContainer);

inputTitolo.addEventListener("input", async () => {
  const query = inputTitolo.value.trim();
  autocompleteContainer.innerHTML = "";
  if (!query) return;

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=it-IT&query=${encodeURIComponent(query)}`;
  const resp = await fetch(url);
  const data = await resp.json();
  const results = data.results || [];

  results.slice(0, 5).forEach(film => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.cursor = "pointer";
    item.style.padding = "5px";
    item.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w92${film.poster_path}" style="width:50px; margin-right:10px;">
      <span>${film.title}</span>
    `;
    item.addEventListener("click", () => {
      inputTitolo.value = film.title;
      inputTitolo.dataset.selectedId = film.id;
      autocompleteContainer.innerHTML = "";
    });
    autocompleteContainer.appendChild(item);
  });
});

/* ==============================
   GENERA CONSIGLI
   ============================== */
async function generaConsigli() {
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

  const titoloInserito = inputTitolo.value.trim();
  if (!titoloInserito) {
    alert("Inserisci un titolo per ricevere consigli!");
    return;
  }

  let filmSelezionato;
  if (inputTitolo.dataset.selectedId) {
    // Se l'utente ha cliccato un autocomplete
    const url = `https://api.themoviedb.org/3/movie/${inputTitolo.dataset.selectedId}?api_key=${apiKey}&language=it-IT`;
    const resp = await fetch(url);
    filmSelezionato = await resp.json();
  } else {
    // Altrimenti cerca normalmente
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=it-IT&query=${encodeURIComponent(titoloInserito)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    filmSelezionato = data.results[0];
  }

  if (!filmSelezionato) {
    alert("Titolo non trovato.");
    return;
  }

  const tagsSelezionati = filmSelezionato.genre_ids || [];

  // Prendi consigli casuali dello stesso genere
  const consigli = await Promise.all(tagsSelezionati.map(async g => {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${g}&language=it-IT`;
    const resp = await fetch(url);
    const data = await resp.json();
    return data.results || [];
  }));

  // Flatten e rimuovi duplicati
  let tuttiConsigli = [].concat(...consigli);
  tuttiConsigli = tuttiConsigli.filter(f => f.id !== filmSelezionato.id);
  const uniqueConsigli = Array.from(new Map(tuttiConsigli.map(f => [f.id, f])).values());

  // Ordina in base ai tag comuni
  uniqueConsigli.sort((a, b) => calcolaTagsComuni(b.genre_ids || [], tagsSelezionati) - calcolaTagsComuni(a.genre_ids || [], tagsSelezionati));

  const famosi = uniqueConsigli.filter(f => f.popularity >= 70).slice(0, 5);
  const nicchia = uniqueConsigli.filter(f => f.popularity < 70).slice(0, 5);

  famosi.forEach(f => creaCard(f, "listaFamosi", tagsSelezionati));
  nicchia.forEach(f => creaCard(f, "listaNicchia", tagsSelezionati));

  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
}

/* ==============================
   CONSIGLI CASUALI
   ============================== */
async function consigliCasuali() {
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

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
    if (i < 5) creaCard(f, "listaFamosi", [tagRandom]);
    else creaCard(f, "listaNicchia", [tagRandom]);
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
