
        function toggleMenu() {
            document.getElementById('navLinks').classList.toggle('active');
        }

        // Mobile Accordion Logic
        document.querySelectorAll('.dropdown > a, .has-submenu > a').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    parent.classList.toggle('active-mobile');
                }
            });
        });

        function filterGallery(category, btn) {
            const items = document.querySelectorAll('.gallery-item');
            const btns = document.querySelectorAll('.filter-btn');
            
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            items.forEach(item => {
                if (category === 'all' || item.classList.contains(category)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');

        function openLightbox(src) {
            lightbox.style.display = 'flex';
            lightboxImg.src = src;
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        window.onclick = function(e) {
            if (e.target == lightbox) closeLightbox();
        }
    