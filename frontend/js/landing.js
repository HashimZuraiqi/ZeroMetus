/**
 * ZeroMetus Landing Page Handler
 */

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .step-card, .pricing-card').forEach(el => {
        observer.observe(el);
    });
    
    // Demo scan functionality
    const demoScanBtn = document.getElementById('demo-scan-btn');
    const demoCode = document.getElementById('demo-code');
    const demoResults = document.getElementById('demo-results');
    
    if (demoScanBtn && demoCode && demoResults) {
        demoScanBtn.addEventListener('click', () => {
            demoScanBtn.disabled = true;
            demoScanBtn.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4"/>
                </svg>
                Scanning...
            `;
            
            // Simulate scan
            setTimeout(() => {
                demoResults.classList.remove('hidden');
                demoScanBtn.disabled = false;
                demoScanBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Scan Again
                `;
            }, 2000);
        });
    }
});
