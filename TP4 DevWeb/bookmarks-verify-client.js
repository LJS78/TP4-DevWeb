const $output = document.getElementById("output");
const $fileSelector = document.getElementById("file-selector");
const $goButton = document.getElementById("go-button");
const $progressBar = document.getElementById("progress-bar");
const $progressNb = document.getElementById("progress-number");

const token = "mon_token :)"; //mettre un token qui donne le droit repo:status

let current = 0;
let total = 0;

//convertir un url github en url api github
function convertToApiUrl(url) {
  const match = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return `https://api.github.com/repos/${match[1]}/${match[2]}`;
  }
  return null;
}

//mettre à jour l'output
function updateOutput(newText) {
  $output.textContent += newText + "\n";
}

//mise à jour de la barre de progression
function updateProgress(current, total, text) {
  $progressBar.value = current;
  $progressBar.max = total;
  $progressNb.textContent = `${current} / ${total}`;
  if (text) {
    updateOutput(text);
  }
}

//vérifier l'état d'un lien GitHub
async function checkLinkAlive(link) {
  const apiUrl = convertToApiUrl(link.url);
  if (!apiUrl) {
    updateProgress(current++, total, `${link.url}: URL invalide`);
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status} (${response.statusText})`);
    }

    const data = await response.json();
    const starsChange = data.stargazers_count
      ? data.stargazers_count - link.stars
      : 0;
    const starsText =
      starsChange >= 0 ? `+${starsChange}⭐` : `${starsChange}⭐`;

    updateProgress(current++, total, `OK (${starsText}): ${link.description}`);
  } catch (error) {
    updateProgress(current++, total, `KO (${error.message}): ${link.description}`);
  }
}

//transformer le tableau de promesses
async function progressLinks(promises) {
  total = promises.length;
  current = 0;
  updateProgress(0, total, "Début de la vérification...");

  await Promise.all(promises.map((promise) => promise.then()));

  updateProgress(total, total, "Vérification terminée !");
}

//téléchargement du fichier JSON
async function downloadAndCheck() {
  $output.textContent = "";
  try {
    const url = new URL(`data/${$fileSelector.value}`, window.location);
    const response = await fetch(url);
    const links = await response.json();

    if (links.length === 0) {
      updateProgress(0, 0, "Aucun lien à vérifier.");
      return;
    }

    console.log(`Fichier chargé avec ${links.length} projets à vérifier.`);

    //vérifier les lien
    const promises = links.map((link) => checkLinkAlive(link));
    await progressLinks(promises);
  } catch (error) {
    $output.textContent = error;
    console.error(error);
  }
}

$goButton.addEventListener("click", downloadAndCheck);

/*Question: quels sont les deux projets de la liste romulusFR-starred.json qui n'existent plus ?

Dans mon output il y a 3 projets de la liste romulusFR-starred.json qui n'existent plus.

-https://github.com/dav74/nsi_terminale
-https://github.com/substack/stream-handbook
-https://github.com/Marak/faker.js
*/