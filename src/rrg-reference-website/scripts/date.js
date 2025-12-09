// Update footer with current year and last modified date
const year = document.querySelector("#year");
const short = document.querySelector("#short");

if (year) {
    year.textContent = new Date().getFullYear();
}

if (short) {
    short.textContent = document.lastModified;
}
