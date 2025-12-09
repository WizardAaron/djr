document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("cards");
  const platformSelect = document.getElementById("platform-select");
  let allGames = [];

  // Fetch game data
  fetch("data/games.json")
    .then((response) => response.json())
    .then((games) => {
      allGames = games;
      renderCards(games);
    })
    .catch((err) => {
      console.error("Failed to load games:", err);
    });

  // Filter by platform
  platformSelect.addEventListener("change", () => {
    const selected = platformSelect.value;
    const filteredGames = selected === "all"
      ? allGames
      : allGames.filter(game => game.platforms.includes(selected));
    renderCards(filteredGames);
  });

  // Render game cards
  function renderCards(games) {
    cardsContainer.innerHTML = ""; // Clear existing cards

    games.forEach((game) => {
      const card = document.createElement("section");
      card.className = "game-card";
      card.style.backgroundImage = `url(${game.image})`;

      // Fallback overlay if image fails
      const fallback = document.createElement("div");
      fallback.className = "fallback-overlay";
      fallback.textContent = `${game.name} cover art unavailable`;

      const testImg = new Image();
      testImg.src = game.image;
      testImg.onload = () => {
        fallback.style.display = "none";
      };
      testImg.onerror = () => {
        fallback.style.display = "flex";
      };

      // Title bar
      const titleBar = document.createElement("div");
      titleBar.className = "card-title-bar";
      titleBar.textContent = game.name;

      // Assemble card
      card.appendChild(fallback);
      card.appendChild(titleBar);
      cardsContainer.appendChild(card);

      // Modal setup
      card.addEventListener("click", () => {
        const modal = document.createElement("dialog");
        modal.className = "game-modal";
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>${game.name}</h3>
            <ul>
              <li><strong>Platforms:</strong> ${game.platforms}</li>
              <li><strong>Cost:</strong> ${game.cost}</li>
              <li><strong>Description:</strong> ${game.description}</li>
            </ul>
          </div>
        `;
        document.body.appendChild(modal);
        modal.showModal();

        modal.querySelector(".close-modal").addEventListener("click", () => {
          modal.close();
          modal.remove();
        });
      });
    });
  }
});
