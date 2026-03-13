const typed = new Typed(".text", {
    strings: ["Beginner Software Engineer.", "Beginner Web Developer.", "University Student."],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true
});

const img = document.getElementById('source-img');
const canvas = document.getElementById('ascii-canvas');
const ctx = canvas.getContext('2d');

const COLS = 60;
const CHARS = ['─', '━', '╌', '┄', '╍'];
const TEAL = '#0ef';

// Fix for disappearing on refresh — image might already be cached
function initCanvas() {
    const aspect = img.naturalHeight / img.naturalWidth;
    canvas.width = 600;
    canvas.height = Math.round(600 * aspect);

    const ROWS = Math.round(COLS * aspect * 1.8);
    const cw = canvas.width / COLS;
    const ch = canvas.height / ROWS;

    const tmp = document.createElement('canvas');
    tmp.width = COLS;
    tmp.height = ROWS;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, 0, 0, COLS, ROWS);
    const pixels = tctx.getImageData(0, 0, COLS, ROWS).data;

    let mouseX = -999, mouseY = -999;
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mouseleave', () => {
        mouseX = -999;
        mouseY = -999;
    });

    // Give each particle a random starting position for the gather animation
    const offsets = [];
    for (let row = 0; row < ROWS; row++) {
        offsets.push([]);
        for (let col = 0; col < COLS; col++) {
            offsets[row].push({
                ox: (Math.random() - 0.5) * canvas.width * 0.5,  // random start x offset
                oy: (Math.random() - 0.5) * canvas.height * 0.5, // random start y offset
            });
        }
    }

    let tick = 0;
    const GATHER_DURATION = 120; // frames to gather (lower = faster)

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear BEFORE save
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);       // define the clip shape
        ctx.clip();
        ctx.font = `bold ${Math.round(cw * 1.1)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Gather progress goes from 0 to 1
        const progress = Math.min(tick / GATHER_DURATION, 1);
        // Ease out so it slows down as it arrives
        const eased = 1 - Math.pow(1 - progress, 3);

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const i = (row * COLS + col) * 4;
                const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
                const brightness = (r + g + b) / 3;
                if (brightness < 30) continue;

                // Target (final) position
                let tx = col * cw + cw / 2;
                let ty = row * ch + ch / 2;

                // Interpolate from random start to target
                let x = tx + offsets[row][col].ox * (1 - eased);
                let y = ty + offsets[row][col].oy * (1 - eased);

                // Only apply wobble/repel after particles have gathered
                if (progress >= 1) {
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const wobbleRadius = 60;
                    const repelRadius = 25;

                    if (dist < repelRadius && dist > 0) {
                        const force = (repelRadius - dist) / repelRadius;
                        x += (dx / dist) * force * 18;
                        y += (dy / dist) * force * 18;
                        x += Math.sin(tick * 0.03 + col * 0.8) * force * 8;
                        y += Math.cos(tick * 0.03 + row * 0.8) * force * 8;
                    }
                    if (dist < wobbleRadius && dist > 0) {
                        const strength = (wobbleRadius - dist) / wobbleRadius;
                        x += Math.sin(tick * 0.03 + col * 0.8) * strength * 8;
                        y += Math.cos(tick * 0.03 + row * 0.8) * strength * 8;
                    }
                }

                const alpha = (0.3 + (brightness / 255) * 0.7) * eased; // fade in as they gather
                const wave = Math.sin(col * 0.5 + row * 0.3 + tick * 0.04) * 0.1;
                ctx.globalAlpha = Math.min(1, alpha + wave);

                const charIdx = Math.floor(Math.abs(Math.sin(col * 7.3 + row * 3.1)) * CHARS.length);
                ctx.fillStyle = TEAL;
                ctx.fillText(CHARS[charIdx], x, y);
            }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        tick++;
        requestAnimationFrame(draw);
    }

    draw();
}

// Handles both cached and uncached images
if (img.complete && img.naturalWidth > 0) {
    initCanvas();
} else {
    img.onload = initCanvas;
}

// Scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15 });

setTimeout(() => {
    document.querySelectorAll('.about-content h2, .about-text p, .about-image').forEach(el => {
        observer.observe(el);
    });

    document.querySelectorAll('.tech-list li').forEach(li => {
        observer.observe(li);
    });
}, 100);

// Experience tabs
const tabs = document.querySelectorAll('.exp-tab');
const panels = document.querySelectorAll('.exp-panel');
const indicator = document.querySelector('.exp-indicator');

function showTab(tabName, index) {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`tab-${tabName}`);

    activeTab.classList.add('active');
    activePanel.classList.add('active');

    indicator.style.top = `${index * 44}px`;
    indicator.style.height = `44px`;

    // reset then animate
    const els = activePanel.querySelectorAll('h3, .exp-date, .exp-list li');
    els.forEach(el => el.classList.remove('visible'));
    setTimeout(() => {
        els.forEach(el => el.classList.add('visible'));
    }, 50);
}

tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        showTab(tab.dataset.tab, index);
    });
});

// trigger on scroll into view
const expObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            setTimeout(() => showTab('must', 0), 300);
            expObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.experience-content h2').forEach(el => {
    expObserver.observe(el);
});

// Skills scroll animation
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // animate progress bars
            entry.target.querySelectorAll('.skill-fill').forEach(fill => {
                fill.classList.add('animated');
            });

            // animate circles
            entry.target.querySelectorAll('.circle-prog').forEach(prog => {
                prog.classList.add('animated');
            });

            skillsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

setTimeout(() => {
    document.querySelectorAll('.skills-content h2').forEach(el => skillsObserver.observe(el));
    document.querySelectorAll('.skills-left h3, .skills-right h3').forEach(el => skillsObserver.observe(el));

    // stagger skill bars
    document.querySelectorAll('.skill-bar').forEach((el, i) => {
        el.style.setProperty('--i', i);
        skillsObserver.observe(el);
    });

    // stagger circles
    document.querySelectorAll('.circle-wrap').forEach((el, i) => {
        el.style.setProperty('--i', i);
        skillsObserver.observe(el);
    });

    // observe whole skills section for bar/circle animations
    const skillsSection = document.querySelector('.skills');
    if (skillsSection) skillsObserver.observe(skillsSection);
}, 100);

// Certificates carousel
const certSlides = document.querySelectorAll('.cert-slide');
const certDotsContainer = document.getElementById('certDots');
let certCurrent = 0;

// build dots
certSlides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('cert-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToCert(i));
    certDotsContainer.appendChild(dot);
});

function goToCert(index) {
    certSlides[certCurrent].classList.remove('active');
    certDotsContainer.children[certCurrent].classList.remove('active');
    certCurrent = (index + certSlides.length) % certSlides.length;
    certSlides[certCurrent].classList.add('active');
    certDotsContainer.children[certCurrent].classList.add('active');
}

// auto-swipe every 5 seconds
let certTimer = setInterval(() => goToCert(certCurrent + 1), 5000);

// reset timer when manually clicking arrows or dots
function resetCertTimer() {
    clearInterval(certTimer);
    certTimer = setInterval(() => goToCert(certCurrent + 1), 5000);
}

document.getElementById('certPrev').addEventListener('click', () => { resetCertTimer(); goToCert(certCurrent - 1); });
document.getElementById('certNext').addEventListener('click', () => { resetCertTimer(); goToCert(certCurrent + 1); });
certDotsContainer.addEventListener('click', resetCertTimer);

// scroll animation
const certObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            document.querySelector('.cert-carousel-wrap').classList.add('visible');
            document.querySelector('.cert-dots').classList.add('visible');
            certObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.cert-content h2').forEach(el => certObserver.observe(el));

// Projects scroll animation
const projectsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target;
            const i = parseInt(card.style.getPropertyValue('--i')) || 0;
            setTimeout(() => {
                card.classList.add('visible');
            }, i * 200);
            projectsObserver.unobserve(card);
        }
    });
}, { threshold: 0.15 });

setTimeout(() => {
    document.querySelectorAll('.projects-content h2').forEach(el => projectsObserver.observe(el));
    document.querySelectorAll('.project-card').forEach(el => projectsObserver.observe(el));
}, 100);

// Contact scroll animation
const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            contactObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

setTimeout(() => {
    document.querySelectorAll('.contact-content h2, .contact-left, .contact-right').forEach(el => {
        contactObserver.observe(el);
    });
}, 100);

// Send message with mailto
emailjs.init('K274zq0Idfz2jQncq'); // replace with your key

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

document.getElementById('contactSubmit').addEventListener('click', () => {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
        showToast('Please fill in your name, email, and message.', 'error');
        return;
    }

    const btn = document.getElementById('contactSubmit');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    emailjs.send('servicewebsite', 'template_bka3kik', {
        name: name,
        email: email,
        subject: subject,
        message: message
    }).then(() => {
        showToast('Message sent successfully!', 'success');
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactSubject').value = '';
        document.getElementById('contactMessage').value = '';
        btn.textContent = 'Send Message';
        btn.disabled = false;
    }).catch(() => {
        showToast('Something went wrong. Please try again.', 'error');
        btn.textContent = 'Send Message';
        btn.disabled = false;
    });
});

// back to top
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Active navbar highlight on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.navbar a');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});