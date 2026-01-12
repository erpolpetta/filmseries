/* ==============================
   SCRIPT.JS - Consigli Film & Serie
   ============================== */

/* ==============================
   DATABASE SIMULATO
   ============================== */
const filmSerieDB = [
  {
    titolo: "Inception",
    genere: ["Azione", "Thriller", "Fantascienza"],
    popolarita: 95,
    trama: "Un ladro specializzato nel rubare segreti dai sogni viene incaricato di un'ultima missione: impiantare un'idea nella mente di un uomo.",
    locandina: "https://image.tmdb.org/t/p/w200/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg"
  },
  {
    titolo: "La La Land",
    genere: ["Musicale", "Romantico", "Drammatico"],
    popolarita: 85,
    trama: "Una storia d'amore tra una musicista jazz e un'aspirante attrice a Los Angeles.",
    locandina: "https://image.tmdb.org/t/p/w200/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg"
  },
  {
    titolo: "Parasite",
    genere: ["Thriller", "Drammatico", "Commedia"],
    popolarita: 80,
    trama: "La famiglia Kim si infiltra nella vita di una famiglia ricca, ma le cose prendono una piega oscura.",
    locandina: "https://image.tmdb.org/t/p/w200/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg"
  },
  {
    titolo: "Spirited Away",
    genere: ["Animazione", "Fantasy", "Avventura"],
    popolarita: 90,
    trama: "Una bambina entra in un mondo magico pieno di spiriti e creature misteriose e deve salvare i suoi genitori.",
    locandina: "https://image.tmdb.org/t/p/w200/dL11DBPcRhWWnJcFXl9A07MrqTI.jpg"
  },
  {
    titolo: "Moonlight",
    genere: ["Drammatico", "Romantico"],
    popolarita: 60,
    trama: "Il racconto della crescita di un giovane uomo afroamericano in tre fasi della sua vita.",
    locandina: "https://image.tmdb.org/t/p/w200/1TjvGVDMYsj6JBxOAkUHpPEwLf7.jpg"
  },
  {
    titolo: "Eternal Sunshine of the Spotless Mind",
    genere: ["Romantico", "Drammatico", "Fantascienza"],
    popolarita: 65,
    trama: "Dopo una dolorosa rottura, una coppia decide di cancellarsi dalla memoria l'un l'altro, con conseguenze inaspettate.",
    locandina: "https://image.tmdb.org/t/p/w200/5xguP7pGwnv7tlH3K3CzKZR3j5r.jpg"
  },
  {
    titolo: "Donnie Darko",
    genere: ["Thriller", "Fantascienza", "Drammatico"],
    popolarita: 50,
    trama: "Un adolescente con problemi psicologici comincia a ricevere strani messaggi da una misteriosa figura con costume di coniglio.",
    locandina: "https://image.tmdb.org/t/p/w200/9u1HxkM7OPnL8i87Ay1h0RY2X0B.jpg"
  },
  {
    titolo: "The Lighthouse",
    genere: ["Thriller", "Horror", "Drammatico"],
    popolarita: 40,
    trama: "Due guardiani di un faro sono intrappolati sull'isola, la loro sanità mentale inizia a vacillare.",
    locandina: "https://image.tmdb.org/t/p/w200/2x7jKjLZ55EXLrlkA9RWkA5H0hg.jpg"
  },
  {
    titolo: "Roma",
    genere: ["Drammatico"],
    popolarita: 70,
    trama: "La vita quotidiana di una domestica e della famiglia per cui lavora a Città del Messico negli anni '70.",
    locandina: "https://image.tmdb.org/t/p/w200/7Zi82kpQkxVJRvrr4iDgclN6AkG.jpg"
  },
  {
    titolo: "Your Name",
    genere: ["Animazione", "Romantico", "Fantascienza"],
    popolarita: 75,
    trama: "Due adolescenti scoprono di scambiarsi misteriosamente i corpi, creando un legame unico e magico.",
    locandina: "https://image.tmdb.org/t/p/w200/q719jXXEzOoYaps6babgKnONONX.jpg"
  }
];

/* ==============================
   UTILITIES
   ============================== */
function getRandomElements(array, count) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function creaCard(film, listaId) {
  const container = document.getElementById(listaId);
  const card = document.createElement("div");

  card.innerHTML = `
    <h3>${film.titolo}</h3>
    <img src="${film.locandina}" alt="${film.titolo}" style="width:150px; float:left; margin-right:10px;">
    <p>${film.trama.length > 200 ? film.trama.substring(0, 200) + "..." : film.trama}</p>
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
  if (!lista.some(f => f.titolo === film.titolo)) {
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
    li.textContent = film.titolo;
    container.appendChild(li);
  });
}

/* ==============================
   GENERA CONSIGLI
   ============================== */
function generaConsigli() {
  // Pulisci sezioni consigli
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

  const titoloInserito = document.getElementById("titoloInput").value.trim();
  if (!titoloInserito) {
    alert("Inserisci un titolo per ricevere consigli!");
    return;
  }

  // Trova il film/serie inserito
  const filmSelezionato = filmSerieDB.find(f => f.titolo.toLowerCase() === titoloInserito.toLowerCase());
  if (!filmSelezionato) {
    alert("Titolo non trovato nel database.");
    return;
  }

  // Filtra per tag/genre
  const tag = filmSelezionato.genere;
  const consigliTag = filmSerieDB.filter(f => f.titolo !== filmSelezionato.titolo && f.genere.some(g => tag.includes(g)));

  // Consigli famosi = popolarità > 70
  const famosi = getRandomElements(consigliTag.filter(f => f.popolarita >= 70), 5);
  famosi.forEach(f => creaCard(f, "listaFamosi"));

  // Consigli di nicchia = popolarità <= 70
  const nicchia = getRandomElements(consigliTag.filter(f => f.popolarita < 70), 5);
  nicchia.forEach(f => creaCard(f, "listaNicchia"));

  // Aggiorna archivi
  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
}

/* ==============================
   CONSIGLI CASUALI
   ============================== */
function consigliCasuali() {
  document.getElementById("listaFamosi").innerHTML = "";
  document.getElementById("listaNicchia").innerHTML = "";

  // Scegli un tag casuale
  const tuttiTag = [...new Set(filmSerieDB.flatMap(f => f.genere))];
  const tagRandom = tuttiTag[Math.floor(Math.random() * tuttiTag.length)];

  // Filtra film con quel tag
  const consigli = getRandomElements(filmSerieDB.filter(f => f.genere.includes(tagRandom)), 10);
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
   CARICA ARCHIVI DAL LOCALSTORAGE AL CARICAMENTO
   ============================== */
window.addEventListener("load", () => {
  renderArchivio("listaVisti");
  renderArchivio("listaConsigliati");
});
