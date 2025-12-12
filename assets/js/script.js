/**
 * DianEro - General UI Scripts
 * Handles Theme Toggle and Mobile Menu
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
});

function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');

        // Update icon
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }

        // Save preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.querySelector('.mobile-menu');
    const closeBtn = document.getElementById('closeMenu');
    const links = menu.querySelectorAll('a');

    function openMenu() {
        menu.classList.remove('translate-x-full');
    }

    function closeMenu() {
        menu.classList.add('translate-x-full');
    }

    btn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);

    // Close on link click
    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}
