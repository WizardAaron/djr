import { getLocalStorage, setLocalStorage } from "./utils.mjs";
import { loadHeaderFooter } from "./utils.mjs";

function renderCartContents() {
  const cartItems = getLocalStorage("so-cart") || [];
  const productList = document.querySelector(".product-list");
  const cartFooter = document.querySelector(".cart-footer");
  const cartTotalText = document.querySelector(".cart-total");

  // If NO items → show empty message and hide footer
  if (cartItems.length === 0) {
    productList.innerHTML = "<p>Your cart is empty.</p>";
    cartFooter.classList.add("hide");
    return;
  }

  // Render items
  const htmlItems = cartItems.map((item) => cartItemTemplate(item));
  productList.innerHTML = htmlItems.join("");

  // Show footer
  cartFooter.classList.remove("hide");

  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + Number(item.FinalPrice), 0);

  // Insert total HTML
  cartTotalText.innerHTML = `Total: $${total.toFixed(2)}`;

  // Attach remove listeners to all remove buttons
  attachRemoveListeners();
}

function cartItemTemplate(item) {
  return `
    <li class="cart-card divider">
      <a href="#" class="cart-card__image">
        <img src="${item.Image}" alt="${item.Name}" />
      </a>
      <a href="#">
        <h2 class="card__name">${item.Name}</h2>
      </a>
      <p class="cart-card__color">${item.Colors[0].ColorName}</p>
      <p class="cart-card__quantity">qty: 1</p>
      <p class="cart-card__price">$${item.FinalPrice}</p>
      <span class="cart-card__remove" data-id="${item.Id}">✖</span>
    </li>
  `;
}

function attachRemoveListeners() {
  const removeButtons = document.querySelectorAll(".cart-card__remove");
  removeButtons.forEach((button) => {
    button.addEventListener("click", removeFromCart);
  });
}

function removeFromCart(event) {
  // Get the product ID from the data-id attribute
  const productId = event.target.getAttribute("data-id");
  
  // Get current cart items from localStorage
  let cartItems = getLocalStorage("so-cart") || [];
  
  // Filter out the item with the matching ID
  cartItems = cartItems.filter((item) => item.Id !== productId);
  
  // Save updated cart back to localStorage
  setLocalStorage("so-cart", cartItems);
  
  // Re-render the cart
  renderCartContents();
}

renderCartContents();
loadHeaderFooter();