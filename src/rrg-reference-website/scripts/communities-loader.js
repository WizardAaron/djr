// load-communities.js
export async function loadCommunityCards(containerId = "community-cards", jsonPath = "data/communities.json") {
  try {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container #${containerId} not found`);

    const response = await fetch(jsonPath);
    const communities = await response.json();

    communities.forEach((community) => {
      const card = document.createElement("section");
      card.className = "community-card";

      const bgOverlay = document.createElement("div");
      bgOverlay.className = "card-bg-overlay";
      bgOverlay.style.backgroundImage = `url(${community.background})`;
      card.appendChild(bgOverlay);

      const content = document.createElement("div");
      content.className = "card-content";

      const title = document.createElement("h3");
      title.textContent = community.name;

      const description = document.createElement("p");
      description.textContent = community.description;

      const platforms = document.createElement("p");
      platforms.className = "platform-tags";
      platforms.textContent = `Platform: ${community.platforms.join(", ")}`;

      const link = document.createElement("a");
      link.href = community.link;
      link.target = "_blank";
      link.className = "join-button";
      link.textContent = "Join Community";

      content.appendChild(title);
      content.appendChild(description);
      content.appendChild(platforms);
      content.appendChild(link);
      card.appendChild(content);
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load communities:", err);
  }
}
