document.addEventListener("DOMContentLoaded", () => {
  const wireframeButton = document.querySelector(".wireframe-page-button");
  if (wireframeButton) {
    wireframeButton.addEventListener("click", () => {
      window.location.href = "rrg-home-wireframes.html";
    });
  }
});
