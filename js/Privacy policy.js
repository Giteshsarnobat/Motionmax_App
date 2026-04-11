  
    
    function toggleMenu() {
            document.getElementById('navLinks').classList.toggle('active');
        }

        // Accordion logic for Mobile
        document.querySelectorAll('.dropdown > a').forEach(link => {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    const parent = this.parentElement;
                    // Only prevent default if it's the first click to open the sub-menu
                    if (!parent.classList.contains('active-mobile')) {
                        e.preventDefault();
                        parent.classList.add('active-mobile');
                    }
                }
            });
        });
  // Mobile dropdown handlers
        function toggleDropdown(el) {
            if(window.innerWidth <= 768) {
                el.parentElement.classList.toggle('active');
            }
        }

        function toggleSubmenu(el) {
            if(window.innerWidth <= 768) {
                el.parentElement.classList.toggle('active');
            }
        }

        // Simple log to confirm page load
        document.addEventListener('DOMContentLoaded', () => {
            console.log("Terms and Conditions page loaded successfully.");
        });
   