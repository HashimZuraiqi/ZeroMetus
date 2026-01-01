// Burger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const burgerBtn = document.getElementById('burger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const burgerIcon = document.getElementById('burger-icon');
    const closeIcon = document.getElementById('close-icon');

    burgerBtn.addEventListener('click', function() {
        // Toggle mobile menu visibility
        mobileMenu.classList.toggle('hidden');
        
        // Toggle icons
        burgerIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
            burgerIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        });
    });
});
