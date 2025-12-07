// Product listing page functionality
// This file handles displaying the product list

import ExternalServices from "./ExternalServices.mjs";
import ProductList from "./ProductList.mjs";
import { loadHeaderFooter, getParam } from "./utils.mjs";

loadHeaderFooter();

const category = getParam("category");
const searchTerm = getParam("search");

// Update the page title based on category or search
function updateTitle(category, searchTerm) {
  const titleElement = document.querySelector(".products h2");
  if (!titleElement) return;

  if (searchTerm) {
    titleElement.textContent = `Search Results: "${searchTerm}"`;
  } else if (category) {
    // Convert category to title case (e.g., "sleeping-bags" -> "Sleeping Bags")
    const categoryTitle = category
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    titleElement.textContent = `Top Products: ${categoryTitle}`;
  }
}

// Update the title
updateTitle(category, searchTerm);

// first create an instance of the ExternalServices class.
const dataSource = new ExternalServices();
// then get the element you want the product list to render in
const listElement = document.querySelector(".product-list");

// Handle search or category
if (searchTerm) {
  // Search mode
  const myList = new ProductList(searchTerm, dataSource, listElement, true);
  myList.init();
} else if (category) {
  // Category mode
  const myList = new ProductList(category, dataSource, listElement);
  myList.init();
}