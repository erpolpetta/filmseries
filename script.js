/* ==============================
   SCRIPT.JS - Consigli Film & Serie
   ============================== */

const apiKey = "2d3cf36a009fccd04e0537124889559f";

/* ==============================
   UTILITY
   ============================== */
function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function calcolaTagsComuni(tags1, tags2) {
  return tags1.filter(t => tags2.includes(t)).length;
}

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
    <h3>${film.title || film.name}</h3>
    ${film.poster_path ? `<img src="https://image.tmdb.org/t/p/w200${film.poster_path}" alt="${film.title || film.name}">` : ""}
    <p>${film.overview ? (film.overview.length > 200 ? film.overview.substring(0, 200) + "..." : film.overview) : "Trama non disponibile"}</p>
    <p>Tag in comune: ${tagComuni.join(", ") || "Nessuno"}</p>
    <p class="stelle">${creaStelle(punteggioStelle)}</p>
    <button class="vistoBtn">Segna come Visto</button>
    <button class="daVedereBtn">Segna come Da Vedere</button>
    <div class="clearfix"></div>
  `;
  container.appendChild(card);

  card.style.opacity = 0;
  setTimeout(() => card.style.opacity = 1, 100);

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
    li.textContent = film.title || film.name;
    container.appendChild(li);
  });
}

/* ==============================
   AUTOCOMPLETE
   ============================== */
const inputTitolo = document.getElementById("titoloInput");
const autocompleteContainer = document.createElement("div");
autocompleteContainer.style.position = "absolute";
autocompleteContainer.style.zIndex = "9999";
autocompleteContainer.style.width = inputTitolo.offsetWidth + "px";
inputTitolo.parentNode.appendChild(autocompleteContainer);

inputTitolo.addEventListener("input", async () => {
  const query = inputTitolo.value.trim();
  autocompleteContainer.innerHTML = "";
  if (!query) return;

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=it-IT&query=${encodeURIComponent(query)}`;
  const resp = await fetch(url);
  const data = await resp.json();
  let results = data.results || [];

  // Filtro solo film e serie
  results = results.filter(f => f.media_type === "movie" || f.media_type === "tv");

  results.slice(0, 5).forEach(film => {
    const titolo = film.title || film.name || "Titolo non disponibile";
    const poster = film.poster_path ? `https://image.tmdb.org/t/p/w92${film.poster_path}` : "";

    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between"; // locandina a destra
    item.style.cursor = "pointer";
    item.style.padding = "5px 8px";
    item.style.gap = "10px";
    item.innerHTML = `
      <span>${titolo}</span>
      ${poster ? `<img src="${poster}" alt="${titolo}">` : ""}
    `;

    item.addEventListener("click", () => {
      inputTitolo.value = titolo;
      inputTitolo.dataset.selectedId = film.id;
      inputTitolo.dataset.mediaType = film.media_type; // salva il tipo
      autocompleteContainer.innerHTML = "";
      generaConsigli(); // genera consigli subito
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

  try {
    let url;
    if (inputTitolo.dataset.selectedId) {
      if (inputTitolo.dataset.mediaType === "tv") {
        url = `https://api.themoviedb.org/3/tv/${inputTitolo.dataset.selectedId}?api_key=${apiKey}&language=it-IT`;
      } else {
        url = `https://api.themoviedb.org/3/movie/${inputTitolo.dataset.selectedId}?api_key=${apiKey}&language=it-IT`;
      }
      const resp = await fetch(url);
      filmSelezionato = await resp.json();
    } else {
      // Cerca tramite multi-search se non ha cliccato autocomplete
      const urlSearch = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=it-IT&query=${encodeURIComponent(titoloInserito)}`;
      const resp = await fetch(urlSearch);
      const data = await resp.json();
      const risultati = (data.results || []).filter(f => f.media_type === "movie" || f.media_type === "tv");
      if (risultati.length === 0) {
        alert("Titolo non trovato su TMDb.");
        return;
      }
      filmSelezionato = risultati[0];
    }

    if (!filmSelezionato.genre_ids) filmSelezionato.genre_ids = [];

  } catch (err) {
    console.error(err);
    alert("Errore nella ricerca del titolo.");
    return;
  }

  const tagsSelezionati = filmSelezionato.genre_ids;
  if (!tagsSelezionati || tagsSelezionati.length === 0) {
    alert("Impossibile generare consigli: nessun tag disponibile per questo titolo.");
    return;
  }

  // Recupera consigli da TMDb basati sui tag
  const consigliPromises = tagsSelezionati.map(async g => {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${g}&language=it-IT`;
    const resp = await fetch(url);
    const data = await resp.json();
    return data.results || [];
  });

  let tuttiConsigli = [].concat(...(await Promise.all(consigliPromises)));
  tuttiConsigli = tuttiConsigli.filter(f => f.id !== filmSelezionato.id);

  // Elimina duplicati
  const uniqueConsigli = Array.from(new Map(tuttiConsigli.map(f => [f.id, f])).values());

  // Ordina per tag in comune
  uniqueConsigli.sort((a, b) => {
    const comuniA = calcolaTagsComuni(a.genre_ids || [], tagsSelezionati);
    const comuniB = calcolaTagsComuni(b.genre_ids || [], tagsSelezionati);
    return comuniB - comuniA;
  });

  // Separa famosi / nicchia
  const famosi = uniqueConsigli.filter(f => f.popularity >= 70).slice(0, 5);
  const nicchia = uniqueConsigli.filter(f => f.popularity < 70).slice(0, 5);

  famosi.forEach(f => creaCard(f, "listaFamosi", tagsSelezionati));
  nicchia.forEach(f => creaCard(f, "listaNicchia", tagsSelezionati));

  // Aggiorna archivi
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

window.addEventListener("load", () => {
  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
});
