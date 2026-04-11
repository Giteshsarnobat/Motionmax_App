 

         function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}
        

document.querySelectorAll('.dropdown > a').forEach(link => {

    link.addEventListener('click', function(e) {

        if (window.innerWidth <= 768) {

            const parent = this.parentElement;

            // if dropdown not opened yet -> open menu
            if (!parent.classList.contains('active-mobile')) {

                e.preventDefault();

                document.querySelectorAll('.dropdown').forEach(item => {
                    item.classList.remove('active-mobile');
                });

                parent.classList.add('active-mobile');

            }
            // second click will go to Courses.html automatically
        }

    });

});

        function updateGallery(element) {
            const mainImg = document.getElementById('main-img');
            const caption = document.getElementById('caption');
            const thumbs = document.querySelectorAll('.thumb-item');
            
            // Get data from clicked thumbnail
            const imgChild = element.querySelector('img');
            const newSrc = imgChild.getAttribute('data-full');
            const newAlt = imgChild.alt;

            // Fade effect
            mainImg.style.opacity = '0';
            
            setTimeout(() => {
                mainImg.src = newSrc;
                caption.innerText = newAlt;
                mainImg.style.opacity = '1';
            }, 300);

            // Update Active class
            thumbs.forEach(t => t.classList.remove('active'));
            element.classList.add('active');
        }
   