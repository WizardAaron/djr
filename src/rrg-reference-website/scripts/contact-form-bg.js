document.addEventListener('DOMContentLoaded', () => {
  fetch('data/games.json')
    .then(response => response.json())
    .then(games => {
      const imagePaths = games.map(game => game.image);
      const randomImage = imagePaths[Math.floor(Math.random() * imagePaths.length)];

      const style = document.createElement('style');
      style.textContent = `
        #contact-form::before {
          background-image: url('${randomImage}');
        }
      `;
      document.head.appendChild(style);
    })
    .catch(error => {
      console.error('Error loading game images:', error);
    });
});
