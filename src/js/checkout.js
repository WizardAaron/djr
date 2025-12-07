import { loadHeaderFooter, alertMessage } from "./utils.mjs";
import CheckoutProcess from "./CheckoutProcess.mjs";

loadHeaderFooter();

const order = new CheckoutProcess("so-cart", ".checkout-summary");
order.init();

// Add event listeners to fire calculateOrderTotal when the user changes the zip code
document
    .querySelector("#zip")
    .addEventListener("blur", order.calculateOrderTotal.bind(order));

// Validation function
function validatePaymentInfo() {
    const cardNumber = document.querySelector("#cardNumber").value;
    const securityCode = document.querySelector("#code").value;
    const expirationDate = document.querySelector("#expiration").value;
    
    const errors = [];
    
    // Validate card number
    if (cardNumber !== "1234123412341234") {
        errors.push("Card number must be 1234123412341234");
    }
    
    // Validate security code
    if (securityCode !== "123") {
        errors.push("Security code must be 123");
    }
    
    // Validate expiration date (must be in the future)
    if (expirationDate) {
        const today = new Date();
        // Extract year and month from the input format (YYYY-MM)
        const [year, month] = expirationDate.split('-').map(Number);
        const expiry = new Date(year, month - 1); // month is 0-indexed
        
        // Set both dates to the first of the month for comparison
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        
        if (expiry < today) {
            errors.push("Expiration date must be in the future");
        }
    }
    
    if (errors.length > 0) {
        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        alertMessage("Payment validation failed:<br><br>" + errors.join("<br>"), true, 'error');
        return false;
    }
    
    return true;
}

// listening for click on the button
document.querySelector("#checkoutSubmit").addEventListener("click", (e) => {
    e.preventDefault();

    const form = document.querySelector("#checkout-form");
    
    // Check HTML validation first
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Validate payment info before proceeding
    if (validatePaymentInfo()) {
        order.checkout();
    }
});