document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("pexels-image-container");
  if (!container) {
    console.warn("pexels-image-container not found in DOM.");
    return;
  }

  const API_KEY = 'fNLskuMXR3cF3XEzGIn6SUD62nmbAWRh14lqEeXwzOybg3XyyRp8CobU';
  const query = 'mario kart';

  fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      Authorization: API_KEY
    }
  })
    .then(response => response.json())
    .then(data => {
      if (!data.photos || data.photos.length === 0) return;

      const photo = data.photos[0];

      const figure = document.createElement("figure");
      figure.className = "pexels-figure";

      const img = document.createElement("img");
      img.src = photo.src.medium;
      img.alt = photo.alt || "Racing game inspired image";
      img.loading = "lazy";

      const caption = document.createElement("figcaption");
      caption.innerHTML = `Photo by <a href="${photo.url}" target="_blank" rel="noopener">${photo.photographer}</a> on <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>`;

      figure.appendChild(img);
      figure.appendChild(caption);
      container.appendChild(figure);
    })
    .catch(err => {
      console.warn("Failed to load Pexels image:", err);
    });
});
