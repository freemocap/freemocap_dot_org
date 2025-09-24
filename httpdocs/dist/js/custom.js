fetch("header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
  });

fetch("footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
    // Set the year after footer is loaded
    const year = new Date().getFullYear();
    console.log(`Year: ${year}`);  // Fixed syntax
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = year;
    }
  });