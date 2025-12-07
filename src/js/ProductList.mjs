import { renderListWithTemplate } from "./utils.mjs";

function productCardTemplate(product) {
  return `<li class="product-card">
    <a href="/product_pages/?product=${product.Id}">
      <img src="${product.Images.PrimaryMedium}" alt="Image of ${product.Name}">
      <h3 class="card__brand">${product.Brand?.Name || "Unknown Brand"}</h3>
      <h2 class="card__name">${product.NameWithoutBrand || product.Name}</h2>
      <p class="product-card__price">$${product.FinalPrice}</p>
    </a>
  </li>`;
}

export default class ProductList {

  constructor(category, dataSource, listElement, isSearch = false) {
    // You passed in this information to make the class as reusable as possible.
    // Being able to define these things when you use the class will make it very flexible
    this.category = category;
    this.dataSource = dataSource;
    this.listElement = listElement;
    this.isSearch = isSearch;
  }

  async init() {
    // the dataSource will return a Promise...so you can use await to resolve it.
    let list;
    if (this.isSearch) {
      // Try category search first
      const categories = ['tents', 'backpacks', 'sleeping-bags', 'hammocks'];
      if (categories.includes(this.category.toLowerCase())) {
        list = await this.dataSource.searchProducts(this.category);
      } else {
        // If not a category, do a full product name search
        const allProducts = await this.dataSource.getAllProducts();
        list = this.dataSource.filterProductsBySearch(allProducts, this.category);
      }
    } else {
      list = await this.dataSource.getData(this.category);
    }
    // render the list
    this.renderList(list);
  }

  renderList(list) {
    renderListWithTemplate(productCardTemplate, this.listElement, list);
  }
}

