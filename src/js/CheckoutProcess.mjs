import { getLocalStorage, setLocalStorage, alertMessage } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

const services = new ExternalServices();

function formDataToJSON(formElement) {
    // convert the form data to a JSON object
    const formData = new FormData(formElement);
    const convertedJSON = {};
    formData.forEach((value, key) => {
        convertedJSON[key] = value;
    });
    return convertedJSON;
}

function packageItems(items) {
    const simplifiedItems = items.map((item) => {
        console.log(item);
        return {
            id: item.Id,
            price: item.FinalPrice,
            name: item.Name,
            quantity: 1,
        };
    });
    return simplifiedItems;
}

export default class CheckoutProcess {
    constructor(key, outputSelector) {
        this.key = key;
        this.outputSelector = outputSelector;
        this.list = [];
        this.itemTotal = 0;
        this.shipping = 0;
        this.tax = 0;
        this.orderTotal = 0;
    }

    init() {
        this.list = getLocalStorage(this.key) || [];
        if (this.list.length > 0) {
            this.calculateItemSummary();
            this.calculateOrderTotal();
        }
    }

    calculateItemSummary() {
        // calculate and display the total dollar amount of the items in the cart, and the number of items.
        const itemCount = document.querySelector("#num-items");
        if (itemCount) {
            itemCount.innerText = this.list.length;
        }

        const amounts = this.list.map((item) => item.FinalPrice);
        this.itemTotal = amounts.reduce((sum, item) => sum + item, 0);
        
        const cartTotal = document.querySelector("#cartTotal");
        if (cartTotal) {
            cartTotal.innerText = `$${this.itemTotal.toFixed(2)}`;
        }
    }

    calculateOrderTotal() {
        // calculate the tax and shipping amounts. Add those to the cart total to figure out the order total
        this.tax = (this.itemTotal * 0.06)
        this.shipping = 10 + (this.list.length -1) * 2;
        this.orderTotal = (
            parseFloat(this.itemTotal) +
            parseFloat(this.tax) +
            parseFloat(this.shipping)
        )

            // display the totals.
            this.displayOrderTotals();
    }

    displayOrderTotals() {
        // once the totals are all calculated display them in the order summary page
        const tax = document.querySelector("#tax");
        if (tax) {
            tax.innerText = `$${this.tax.toFixed(2)}`;
        }

        const shipping = document.querySelector("#shipping");
        if (shipping) {
            shipping.innerText = `$${this.shipping.toFixed(2)}`;
        }

        const orderTotal = document.querySelector("#orderTotal");
        if (orderTotal) {
            orderTotal.innerText = `$${this.orderTotal.toFixed(2)}`;
        }
    }

    async checkout() {
        const formElement = document.getElementById("checkout-form");
        const order = formDataToJSON(formElement);

        // Convert expiration date from YYYY-MM to MM/YYYY format
        if (order.expiration && order.expiration.includes('-')) {
            const [year, month] = order.expiration.split('-');
            order.expiration = `${month}/${year}`;
        }

        order.orderDate = new Date().toISOString();
        order.orderTotal = this.orderTotal;
        order.tax = this.tax;
        order.shipping = this.shipping;
        order.items = packageItems(this.list);
        console.log("Order being sent:", order);

        try {
            const response = await services.checkout(order);
            console.log("Order successful:", response);
            // Clear the cart
            setLocalStorage("so-cart", []);
            // Redirect to success page
            window.location = "success.html";
        } catch (err) {
            console.log("Order failed:", err);
            // Display detailed error message from API
            let errorMessage = "There was an error processing your order.";
            
            if (err.name === "servicesError" && err.message) {
                // Extract error details from API response
                if (typeof err.message === "string") {
                    errorMessage = err.message;
                } else if (err.message.message) {
                    errorMessage = err.message.message;
                } else if (typeof err.message === "object") {
                    // Handle multiple validation errors
                    const errors = [];
                    for (const [field, msg] of Object.entries(err.message)) {
                        errors.push(`${field}: ${msg}`);
                    }
                    errorMessage = errors.join('<br>');
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            // Remove any existing alerts
            const existingAlerts = document.querySelectorAll('.alert');
            existingAlerts.forEach(alert => alert.remove());
            
            // Display error using custom alert
            alertMessage(errorMessage, true, 'error');
        }
    }

}