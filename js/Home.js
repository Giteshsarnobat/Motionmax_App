
        // 1. TYPEWRITER EFFECT
        const textElement = document.getElementById("typewriter");
        const words = ["Learn Industry-Ready Skills in Graphic Design."," Animation, Web Design & Computer Courses..."];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];
            if (isDeleting) {
                textElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                textElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 500);
            } else {
                setTimeout(type, isDeleting ? 50 : 150);
            }
        }
        type();

        // 2. COUNTER ANIMATION
        const counters = document.querySelectorAll('.counter');
        const speed = 200;

        const startCounters = () => {
            counters.forEach(counter => {
                const updateCount = () => {
                    const target = +counter.getAttribute('data-target');
                    const count = +counter.innerText;
                    const inc = target / speed;
                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 1);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCount();
            });
        };

        // 3. SCROLL REVEAL
        function reveal() {
            var reveals = document.querySelectorAll(".reveal");
            for (var i = 0; i < reveals.length; i++) {
                var windowHeight = window.innerHeight;
                var elementTop = reveals[i].getBoundingClientRect().top;
                if (elementTop < windowHeight - 100) {
                    reveals[i].classList.add("active");
                    // Start counters only when stats section is revealed
                    if(reveals[i].classList.contains('stats-section')) startCounters();
                }
            }
        }

        
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

        window.addEventListener("scroll", reveal);
        // Special trigger for stats since they aren't in a 'reveal' class by default
       window.onload = () => { startCounters(); reveal(); }
       
   