fetch("header.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
  });

fetch("compact-hero.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("compact-hero").innerHTML = data;
    const getFreeMoCapBtn = document.getElementById("getFreeMoCapBtn");
    if (getFreeMoCapBtn) {
      getFreeMoCapBtn.addEventListener("click", function() {
        window.open("https://github.com/freemocap/freemocap", "_blank");
      });
    }
  })
  .catch(error => console.error('Error loading compact hero:', error));

fetch("footer.html")
  .then(response => response.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  });