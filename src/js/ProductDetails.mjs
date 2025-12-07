import { setLocalStorage, getLocalStorage, qs, alertMessage } from "./utils.mjs";

export default class ProductDetails {
  constructor(productId, dataSource) {
    this.productId = productId;
    this.product = {};
    this.dataSource = dataSource;
  }

  async init() {
    try {
      // Get the product details
      this.product = await this.dataSource.findProductById(this.productId);
      
      if (!this.product) {
        throw new Error(`Product with ID ${this.productId} not found`);
      }
      
      // Render the product details
      this.renderProductDetails();
      
      // Set up event listener for add to cart button
      this.addToCartListener();
    } catch (error) {
      console.error("Error initializing product details:", error);
      this.renderError("Product not found or failed to load.");
    }
  }

  addProductToCart(product) {
    let cartItems = getLocalStorage("so-cart") || [];
    cartItems.push(product);
    setLocalStorage("so-cart", cartItems);
    
    // Show user feedback
    this.showAddToCartFeedback();
  }

  addToCartListener() {
    const addToCartButton = qs("#addToCart");
    if (addToCartButton) {
      // Set the correct data-id attribute
      addToCartButton.dataset.id = this.productId;
      
      addToCartButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.addProductToCart(this.product);
      });
    }
  }

  showAddToCartFeedback() {
    const button = qs("#addToCart");
    if (button) {
      const originalText = button.textContent;
      button.textContent = "Added to Cart!";
      button.disabled = true;
      
      // Remove any existing alerts
      const existingAlerts = document.querySelectorAll('.alert');
      existingAlerts.forEach(alert => alert.remove());
      
      // Show success alert
      alertMessage(`${this.product.Name} has been added to your cart!`, false);
      
      // Trigger backpack animation
      const cartIcon = document.querySelector('.cart svg');
      if (cartIcon) {
        cartIcon.classList.add('animate-backpack');
        // Remove the class after animation completes so it can be triggered again
        setTimeout(() => {
          cartIcon.classList.remove('animate-backpack');
        }, 1000);
      }
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1500);
    }
  }

  renderError(message) {
    const productSection = qs(".product-detail");
    if (productSection) {
      productSection.innerHTML = `
        <div class="error-message">
          <h2>Error</h2>
          <p>${message}</p>
          <a href="../index.html">Return to Home</a>
        </div>
      `;
    }
  }

  renderProductDetails() {
    if (this.product) {
      // Update page title
      const brandName = this.product.Brand?.Name || "Unknown Brand";
      document.title = `Sleep Outside | ${brandName} ${this.product.Name}`;
      
      // Render product brand
      const brandElement = qs(".product-detail h3") || qs(".product-detail h2");
      if (brandElement) {
        brandElement.textContent = brandName;
      }
      
      // Render product name
      const nameElement = qs(".product-detail h2.divider") || qs(".product-detail h3.divider");
      if (nameElement) {
        nameElement.textContent = this.product.NameWithoutBrand || this.product.Name;
      }
      
      // Render product image
      const imageElement = qs("#productImage") || qs(".product-detail img");
      if (imageElement) {
        imageElement.src = this.product.Images.PrimaryLarge;
        imageElement.alt = this.product.Name;
      }
      
      // Render product price
      const priceElement = qs("#productPrice") || qs(".product-card__price");
      if (priceElement) {
        priceElement.textContent = `$${this.product.FinalPrice}`;
      }
      
      // Render product color
      const colorElement = qs("#productColor") || qs(".product__color");
      if (colorElement && this.product.Colors && this.product.Colors.length > 0) {
        colorElement.textContent = this.product.Colors[0].ColorName;
      }
      
      // Render product description
      const descElement = qs("#productDesc") || qs(".product__description");
      if (descElement) {
        descElement.innerHTML = this.product.DescriptionHtmlSimple;
      }
      
      console.log("Product details loaded:", this.product);
    } else {
      this.renderError("Product information is not available.");
    }
  }
}