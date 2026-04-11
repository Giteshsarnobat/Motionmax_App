function toggleMenu() {
  document.getElementById("navLinks").classList.toggle("active");
}

document.querySelectorAll(".dropdown > a").forEach((link) => {
  link.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      const parent = this.parentElement;

      // if dropdown not opened yet -> open menu
      if (!parent.classList.contains("active-mobile")) {
        e.preventDefault();

        document.querySelectorAll(".dropdown").forEach((item) => {
          item.classList.remove("active-mobile");
        });

        parent.classList.add("active-mobile");
      }
      // second click will go to Courses.html automatically
    }
  });
});

// Mobile dropdown handlers
function toggleDropdown(el) {
  if (window.innerWidth <= 768) {
    el.parentElement.classList.toggle("active");
  }
}

function toggleSubmenu(el) {
  if (window.innerWidth <= 768) {
    el.parentElement.classList.toggle("active");
  }
}
