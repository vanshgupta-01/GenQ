/* ============================================================
   GenQ - Civic Issue Reporting Platform
   Main Application JavaScript
   ============================================================ */

// ─── Theme & Language ───────────────────────────────────────

const translations = {
  en: {
    nav_features: "Features",
    nav_how_it_works: "How It Works",
    nav_my_reports: "My Reports",
    nav_login: "Log In",
    nav_get_started: "Get Started",
    hero_badge: "AI-Powered Civic Reporting",
    hero_title_1: "Report Issues.",
    hero_title_2: "Get Them Resolved.",
    hero_tagline: "Where Every Voice Creates Change",
    hero_subtitle: "Snap a photo of any civic issue — potholes, broken streetlights, water leaks — and our AI ensures it reaches the right authorities within seconds. 48-hour resolution guaranteed.",
    hero_btn_primary: "Start Reporting",
    hero_btn_secondary: "Learn More",
    stat_reported: "Issues Reported",
    stat_resolved: "Issues Resolved",
    stat_accuracy: "AI Accuracy %",
    stat_cities: "Cities Covered"
  },
  hi: {
    nav_features: "विशेषताएं",
    nav_how_it_works: "यह कैसे काम करता है",
    nav_my_reports: "मेरी रिपोर्ट",
    nav_login: "लॉग इन करें",
    nav_get_started: "शुरू करें",
    hero_badge: "एआई-संचालित नागरिक रिपोर्टिंग",
    hero_title_1: "समस्याओं की रिपोर्ट करें।",
    hero_title_2: "उन्हें हल करवाएं।",
    hero_tagline: "जहां हर आवाज़ बदलाव लाती है",
    hero_subtitle: "किसी भी नागरिक समस्या की तस्वीर लें - गड्ढे, टूटी स्ट्रीटलाइट, पानी का रिसाव - और हमारा AI यह सुनिश्चित करता है कि यह सेकंडों में सही अधिकारियों तक पहुंचे। 48 घंटे के समाधान की गारंटी।",
    hero_btn_primary: "रिपोर्टिंग शुरू करें",
    hero_btn_secondary: "और जानें",
    stat_reported: "रिपोर्ट की गई समस्याएं",
    stat_resolved: "हल की गई समस्याएं",
    stat_accuracy: "एआई सटीकता %",
    stat_cities: "शामिल शहर"
  }
};

let currentLang = localStorage.getItem('genq_lang') || 'en';
let currentTheme = localStorage.getItem('genq_theme') || 'light';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('genq_theme', theme);
  
  const iconSun = document.querySelector('.icon-sun');
  const iconMoon = document.querySelector('.icon-moon');
  if (iconSun && iconMoon) {
    if (theme === 'light') {
      iconSun.style.display = 'none';
      iconMoon.style.display = 'block';
    } else {
      iconSun.style.display = 'block';
      iconMoon.style.display = 'none';
    }
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('genq_lang', lang);
  
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  const langText = document.querySelector('.lang-text');
  if (langText) {
    // Show the option for the *other* language in the button
    langText.textContent = lang === 'en' ? 'हि' : 'EN';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Init theme & language
  applyTheme(currentTheme);
  applyLanguage(currentLang);

  // Toggle Listeners
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      applyLanguage(currentLang === 'en' ? 'hi' : 'en');
    });
  }

  // Mouse Spotlight Effect on Feature Cards
  const featureCards = document.querySelectorAll('.feature-card');
  const featuresSection = document.getElementById('features');
  if (featuresSection && featureCards.length > 0) {
    featuresSection.addEventListener('mousemove', (e) => {
      featureCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof auth !== 'undefined') {
        try {
          await auth.signOut();
        } catch (error) {
          console.error("Sign out error", error);
        }
      } else {
        // Fallback mock logout
        sessionStorage.removeItem('genq_user');
        showPage('auth');
      }
    });
  }

  // Set up Firebase Auth Listener
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User is signed in:", user.uid);
        sessionStorage.setItem('genq_user', JSON.stringify({
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email
        }));
        
        // Start listening to user's reports in real-time
        startReportsListener(user.uid);
        
        // If on auth page, redirect to dashboard
        if (AppState.currentPage === 'auth') {
          showPage('dashboard');
          initDashboardUI();
        }
      } else {
        console.log("User is signed out");
        sessionStorage.removeItem('genq_user');
        
        // Unsubscribe from reports if logging out
        if (AppState.reportsUnsubscribe) {
          AppState.reportsUnsubscribe();
          AppState.reportsUnsubscribe = null;
        }
        
        // If on dashboard, redirect to auth
        if (AppState.currentPage === 'dashboard') {
          showPage('auth');
        }
      }
    });
  }
});

// ─── Utility Functions ───────────────────────────────────────

/** Format a Date object to a human-readable string */
function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

/** Format milliseconds into DD:HH:MM:SS countdown string */
function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Generate a random alphanumeric ID */
function generateId() {
  return 'GQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

/** Debounce utility — delays fn execution until after `delay` ms of inactivity */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/** Animate a numeric value from `start` to `end` over `duration` ms inside `element` */
function animateValue(element, start, end, duration = 2000) {
  if (!element) return;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * eased);
    element.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}


// ─── Application State ──────────────────────────────────────

const AppState = {
  currentPage: 'landing',
  currentDashboardSection: 'new-report',
  reportFormStep: 1,
  totalReportSteps: 4,
  reportDraft: {
    category: '',
    description: '',
    images: [],         // { file, preview (dataURL) }
    severity: '',
    location: { lat: null, lng: null, address: '' },
  },
  reports: [],          // populated with mock data on init
  countdownIntervals: [],
  particlesAnimId: null,
};


// ─── Realtime Database Listener ───────────────────────────────

function startReportsListener(uid) {
  if (typeof db === 'undefined') {
    console.warn("Firebase not initialized. Falling back to mock data.");
    return;
  }

  AppState.reportsUnsubscribe = db.collection('reports')
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const reports = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });
      });
      
      AppState.reports = reports;
      
      // If we are currently on the 'my-reports' section, re-render it
      if (AppState.currentDashboardSection === 'my-reports') {
        renderMyReports();
      }
      
      // Re-render dashboard stats if we are on dashboard home
      if (AppState.currentDashboardSection === 'dashboard-home') {
        const statsEl = document.getElementById('dashboard-stats-content');
        if (statsEl) {
          statsEl.innerHTML = renderDashboardStats();
        }
      }
    }, (error) => {
      console.error("Error fetching reports: ", error);
    });
}

// ─── Automated Email System ──────────────────────────────────

/**
 * Determines the officer's email based on the report category or location.
 * In a real app, this would query a database of regional officers.
 */
function determineOfficerEmail(report) {
  // TODO: Replace with the actual officer emails, or your own testing email
  return "YOUR_TESTING_EMAIL@gmail.com"; 
}

/**
 * Sends an automated email to the concerned officer using EmailJS.
 */
function sendOfficerEmail(report) {
  if (typeof emailjs === 'undefined') {
    console.warn("EmailJS is not loaded.");
    return;
  }

  const officerEmail = determineOfficerEmail(report);
  const imageUrl = (report.images && report.images.length > 0) ? report.images[0] : "No image provided";

  const templateParams = {
    to_email: officerEmail,
    officer_name: "Concerned Officer",
    category: report.category,
    severity: report.severity,
    address: report.location.address || "Unknown Location",
    description: report.description,
    image_link: imageUrl,
    report_date: new Date().toLocaleString()
  };

  // TODO: Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID with actual values from EmailJS dashboard
  const serviceID = "YOUR_SERVICE_ID"; 
  const templateID = "YOUR_TEMPLATE_ID";

  if (serviceID === "YOUR_SERVICE_ID" || templateID === "YOUR_TEMPLATE_ID") {
    console.warn("EmailJS Service ID or Template ID not configured. Skipping automated email.");
    return;
  }

  emailjs.send(serviceID, templateID, templateParams)
    .then(function(response) {
       console.log('Automated email sent to officer successfully!', response.status, response.text);
       showToast('Concerned officer has been notified via email.', 'success');
    }, function(error) {
       console.error('Failed to send automated email...', error);
    });
}


// ─── Mock Data ──────────────────────────────────────────────

function initMockReports() {
  if (typeof auth !== 'undefined' && auth.currentUser) {
    // If Firebase Auth is active, we don't need mock data (handled by startReportsListener)
    return;
  }

  AppState.reports = [
    {
      id: 'GQ-MOCK01',
      category: 'Pothole',
      description: 'Large pothole on MG Road near Central Mall junction causing traffic hazards and vehicle damage.',
      images: [],
      severity: 'High',
      location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Central Bangalore, Karnataka 560001' },
      status: 'Resolved',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      user: 'Demo User',
    },
    {
      id: 'GQ-MOCK02',
      category: 'Garbage Dump',
      description: 'Illegal garbage dumping near Lakeview Park entrance. Health hazard for nearby residents.',
      images: [],
      severity: 'Medium',
      location: { lat: 12.9352, lng: 77.6245, address: 'Lakeview Park Road, Koramangala, Bangalore 560034' },
      status: 'In Progress',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      user: 'Demo User',
    },
    {
      id: 'GQ-MOCK03',
      category: 'Broken Streetlight',
      description: 'Multiple streetlights not working on the stretch between 5th Cross and 8th Cross in Jayanagar.',
      images: [],
      severity: 'Medium',
      location: { lat: 12.9250, lng: 77.5938, address: '5th Cross, Jayanagar 4th Block, Bangalore 560041' },
      status: 'Sent to Authority',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      user: 'Demo User',
    },
    {
      id: 'GQ-MOCK04',
      category: 'Water Leakage',
      description: 'Major water pipeline leak flooding the road and causing water wastage.',
      images: [],
      severity: 'Critical',
      location: { lat: 13.0358, lng: 77.5970, address: 'Hebbal Main Road, Bangalore 560024' },
      status: 'Pending',
      createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
      user: 'Demo User',
    },
  ];
}


// ─── Toast Notification System ──────────────────────────────

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close">&times;</button>
    <div class="toast-progress"><div class="toast-progress-bar"></div></div>
  `;

  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('show'));

  const closeBtn = toast.querySelector('.toast-close');
  let autoClose;

  const dismiss = () => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    clearTimeout(autoClose);
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 600);
  };

  closeBtn.addEventListener('click', dismiss);
  autoClose = setTimeout(dismiss, 4000);
}


// ─── Page Navigation System ─────────────────────────────────

/**
 * Show a specific page section and hide others.
 * Uses fade animation via CSS classes.
 */
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => {
    if (page.id === pageId) {
      page.classList.remove('hidden');
      page.classList.add('active');
      page.style.display = '';
    } else {
      page.classList.remove('active');
      page.classList.add('hidden');
      // Allow fade-out transition before hiding
      setTimeout(() => {
        if (page.classList.contains('hidden')) {
          page.style.display = 'none';
        }
      }, 400);
    }
  });

  AppState.currentPage = pageId;

  // Push to browser history
  if (history.state?.pageId !== pageId) {
    history.pushState({ pageId }, '', `#${pageId}`);
  }

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Toggle navbar visibility for dashboard
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.display = pageId === 'dashboard' ? 'none' : '';
  }
}

/** Handle browser back/forward navigation */
function handlePopState(event) {
  const pageId = event.state?.pageId || 'landing';
  showPage(pageId);
}


// ─── Navbar ─────────────────────────────────────────────────

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links a');

  if (!navbar) return;

  // Scroll effect — add 'scrolled' class after 50px
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Mobile hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
  }

  // Nav link click handlers
  navItems.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Close mobile menu
      if (navLinks) navLinks.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');

      // If linking to an anchor on landing
      if (href && href.startsWith('#') && !href.startsWith('#auth') && !href.startsWith('#dashboard')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 'Get Started' / 'Login' buttons → auth page
  document.querySelectorAll('[data-navigate="auth"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('auth-page');
    });
  });

  // CTA / Hero buttons
  document.querySelectorAll('[data-navigate="auth-signup"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('auth-page');
      // Switch to signup tab after a tick
      setTimeout(() => switchAuthTab('signup'), 100);
    });
  });
}


// ─── Landing Page Animations ────────────────────────────────

function initLandingAnimations() {
  // --- Stat counter animation ---
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        statNumbers.forEach((el) => {
          const target = parseInt(el.getAttribute('data-target') || el.textContent.replace(/,/g, ''), 10);
          if (!isNaN(target)) {
            animateValue(el, 0, target, 2200);
          }
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-section') || document.querySelector('.stats') || document.querySelector('.hero-stats');
  if (statsSection) statsObserver.observe(statsSection);

  // --- Intersection Observer for .animate-on-scroll ---
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach((el) => scrollObserver.observe(el));

  // --- Parallax on hero background via mouse move ---
  const hero = document.querySelector('.hero-section') || document.querySelector('.hero');
  if (hero) {
    // Disabled parallax effect to prevent the home page from moving with the cursor
    /*
    hero.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const moveX = ((clientX - centerX) / centerX) * 15; // max 15px
      const moveY = ((clientY - centerY) / centerY) * 10;

      const bg = hero.querySelector('.hero-bg') || hero;
      bg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
    });
    */
  }
}


// ─── Particle Background ────────────────────────────────────

function initParticleBackground() {
  const landing = document.querySelector('.hero-section') || document.getElementById('landing');
  if (!landing) return;

  // Try to use existing canvas first
  let canvas = document.getElementById('particleCanvas') || document.getElementById('particle-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    landing.insertBefore(canvas, landing.firstChild);
  }
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  landing.style.position = 'relative';

  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const PARTICLE_COUNT = 60;
  const CONNECTION_DIST = 130;

  const colors = [
    'rgba(99, 102, 241, 0.7)',   // indigo
    'rgba(34, 211, 238, 0.6)',   // cyan
    'rgba(139, 92, 246, 0.5)',   // purple
    'rgba(6, 182, 212, 0.5)',    // teal-cyan
  ];

  function resize() {
    width = canvas.width = landing.offsetWidth;
    height = canvas.height = landing.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const opacity = (1 - dist / CONNECTION_DIST) * 0.3;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function update() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      // Wrap edges
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    });
  }

  function loop() {
    update();
    draw();
    AppState.particlesAnimId = requestAnimationFrame(loop);
  }

  resize();
  initParticles();
  loop();

  window.addEventListener('resize', debounce(() => {
    resize();
    initParticles();
  }, 200));
}


// ─── Auth System ────────────────────────────────────────────

function initAuth() {
  const authTabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabIndicator = document.querySelector('.tab-indicator');

  // Tab switching
  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchAuthTab(tab.getAttribute('data-tab'));
    });
  });

  // Form submissions
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Floating labels
  document.querySelectorAll('.form-group input, .form-group textarea').forEach((input) => {
    // Set initial state
    if (input.value) input.classList.add('has-value');

    input.addEventListener('focus', () => input.classList.add('has-value'));
    input.addEventListener('blur', () => {
      if (!input.value) input.classList.remove('has-value');
    });
    input.addEventListener('input', () => {
      if (input.value) {
        input.classList.add('has-value');
      } else {
        input.classList.remove('has-value');
      }
    });
  });

  // Password visibility toggle
  document.querySelectorAll('.toggle-password, .password-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.form-group')?.querySelector('input');
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  // Real-time validation
  initAuthValidation();

  // Google Sign-In mock
  document.querySelectorAll('.google-btn, .btn-google').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Google Sign-In coming soon!', 'info');
    });
  });
}

/** Switch between login and signup tabs */
function switchAuthTab(tabName) {
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const indicator = document.querySelector('.tab-indicator');

  tabs.forEach((t) => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
  });

  if (tabName === 'login') {
    if (loginForm) { loginForm.classList.add('active'); loginForm.style.display = ''; }
    if (signupForm) { signupForm.classList.remove('active'); signupForm.style.display = 'none'; }
    if (indicator) indicator.style.transform = 'translateX(0)';
  } else {
    if (loginForm) { loginForm.classList.remove('active'); loginForm.style.display = 'none'; }
    if (signupForm) { signupForm.classList.add('active'); signupForm.style.display = ''; }
    if (indicator) indicator.style.transform = 'translateX(100%)';
  }
}

/** Set up real-time validation listeners on auth form inputs */
function initAuthValidation() {
  // Email validation
  document.querySelectorAll('input[type="email"]').forEach((input) => {
    input.addEventListener('input', debounce(() => {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      setValidationState(input, input.value ? valid : null);
    }, 250));
  });

  // Password strength
  const passwordInputs = document.querySelectorAll('input[name="password"], #signupPassword');
  passwordInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const val = input.value;
      if (!val) { setValidationState(input, null); hideStrengthIndicator(input); return; }
      const valid = val.length >= 8;
      setValidationState(input, valid);
      showPasswordStrength(input, val);
    });
  });

  // Confirm password
  const confirmInputs = document.querySelectorAll('input[name="confirm-password"], #signupConfirmPassword');
  confirmInputs.forEach((input) => {
    input.addEventListener('input', () => {
      const password = input.closest('form')?.querySelector('input[name="password"], #signupPassword');
      if (!password) return;
      const match = input.value && input.value === password.value;
      setValidationState(input, input.value ? match : null);
    });
  });

  // Name field
  document.querySelectorAll('input[name="name"], #signupName').forEach((input) => {
    input.addEventListener('input', debounce(() => {
      const valid = input.value.trim().length >= 2;
      setValidationState(input, input.value ? valid : null);
    }, 250));
  });
}

/** Set green/red border on an input based on validity (null = neutral) */
function setValidationState(input, isValid) {
  input.classList.remove('valid', 'invalid');
  if (isValid === true) input.classList.add('valid');
  else if (isValid === false) input.classList.add('invalid');
}

/** Show password strength indicator below the input */
function showPasswordStrength(input, value) {
  let indicator = input.closest('.input-group')?.querySelector('.password-strength');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'password-strength';
    indicator.innerHTML = '<div class="strength-bar"><div class="strength-fill"></div></div><span class="strength-label"></span>';
    input.closest('.input-group')?.appendChild(indicator);
  }

  let strength = 0;
  if (value.length >= 8) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;

  const levels = ['weak', 'weak', 'medium', 'strong', 'strong'];
  const labels = ['Too short', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'];
  const widths = ['10%', '25%', '50%', '75%', '100%'];

  const level = value.length < 8 ? 0 : strength;
  const fill = indicator.querySelector('.strength-fill');
  const label = indicator.querySelector('.strength-label');

  if (fill) { fill.style.width = widths[level]; fill.style.background = colors[level]; }
  if (label) { label.textContent = labels[level]; label.style.color = colors[level]; }
  indicator.style.display = 'flex';
}

function hideStrengthIndicator(input) {
  const indicator = input.closest('.input-group')?.querySelector('.password-strength');
  if (indicator) indicator.style.display = 'none';
}

/** Handle login form submission */
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]')?.value.trim();
  const password = form.querySelector('input[type="password"]')?.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!email || !password) return;
  setButtonLoading(submitBtn, true);

  try {
    if (typeof auth === 'undefined' || typeof firebase === 'undefined') throw new Error("Firebase Auth is not initialized. Please add your keys to firebase-config.js");
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Login successful! Welcome back.', 'success');
    showPage('dashboard');
    initDashboardUI();
  } catch (error) {
    console.warn("Firebase Login failed or uninitialized, falling back to mock login:", error);
    
    // Mock success
    const user = { name: email.split('@')[0], email, phone: '', avatar: '' };
    sessionStorage.setItem('genq_user', JSON.stringify(user));
    
    showToast('Mock login successful (Firebase not configured).', 'success');
    setTimeout(() => {
      showPage('dashboard');
      initDashboardUI();
    }, 400);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/** Handle signup form submission */
async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[name="name"], #signupName')?.value.trim();
  const email = form.querySelector('input[type="email"]')?.value.trim();
  const password = form.querySelector('input[name="password"], #signupPassword')?.value;
  const confirm = form.querySelector('input[name="confirm-password"], #signupConfirmPassword')?.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (!name || name.length < 2) { showToast('Name must be at least 2 characters.', 'error'); return; }
  if (!email || !password) return;
  if (password !== confirm) { showToast('Passwords do not match.', 'error'); return; }

  setButtonLoading(submitBtn, true);

  try {
    if (typeof auth === 'undefined' || typeof firebase === 'undefined') throw new Error("Firebase Auth is not initialized. Please add your keys to firebase-config.js");
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    // Update profile with name
    await userCredential.user.updateProfile({ displayName: name });
    
    // Create user document in Firestore
    if (typeof db !== 'undefined') {
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    showToast('Account created successfully!', 'success');
    showPage('dashboard');
    initDashboardUI();
  } catch (error) {
    console.warn("Firebase Signup failed or uninitialized, falling back to mock signup:", error);
    
    const user = { name, email, phone: '', avatar: '' };
    sessionStorage.setItem('genq_user', JSON.stringify(user));
    
    showToast('Mock account created (Firebase not configured).', 'success');
    setTimeout(() => {
      showPage('dashboard');
      initDashboardUI();
    }, 400);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/** Toggle button loading state */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span> Please wait...`;
    btn.disabled = true;
    btn.classList.add('loading');
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }


// ─── Dashboard ──────────────────────────────────────────────

function initDashboard() {
  // Sidebar nav items
  document.querySelectorAll('.sidebar-nav a, [data-section]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.getAttribute('data-section') || item.getAttribute('data-dashboard-nav');
      if (section) switchDashboardSection(section);
    });
  });

  // Mobile sidebar toggle
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Logout button
  document.querySelectorAll('.logout-btn, [data-action="logout"], #logoutBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });

  // Notification bell
  const bell = document.querySelector('.notification-bell');
  if (bell) {
    bell.addEventListener('click', () => showToast('No new notifications.', 'info'));
  }
}

function initDashboardUI() {
  const user = JSON.parse(sessionStorage.getItem('genq_user') || '{}');

  // Welcome message
  const welcomeEl = document.querySelector('.welcome-name, .user-name') || document.getElementById('welcomeName');
  if (welcomeEl) welcomeEl.textContent = user.name || 'User';

  // Avatar initial
  document.querySelectorAll('.avatar-initial, .user-avatar').forEach((el) => {
    el.textContent = (user.name || 'U')[0].toUpperCase();
  });

  // Notification badge
  const badge = document.querySelector('.notification-badge');
  if (badge) badge.textContent = AppState.reports.filter((r) => r.status === 'Pending').length;

  // Render default section
  switchDashboardSection('new-report');
}

/** Switch visible dashboard content section */
function switchDashboardSection(sectionId) {
  AppState.currentDashboardSection = sectionId;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav a').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });

  // Toggle content sections
  document.querySelectorAll('.dashboard-content').forEach((section) => {
    const isTarget = section.id === ('content-' + sectionId) || section.getAttribute('data-section') === sectionId;
    section.classList.toggle('active', isTarget);
    section.style.display = isTarget ? '' : 'none';
  });

  // Close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');

  // Section-specific init
  if (sectionId === 'my-reports') renderMyReports();
  if (sectionId === 'track-status') renderMyReports();
  if (sectionId === 'profile') initProfile();
  if (sectionId === 'new-report') initReportForm();
}


// ─── Report Form (Multi-Step) ───────────────────────────────

function initReportForm() {
  AppState.reportFormStep = 1;
  AppState.reportDraft = {
    category: '',
    description: '',
    images: [],
    severity: '',
    location: { lat: null, lng: null, address: '' },
  };
  bindReportEvents();
  renderReportStep();
  updateProgressBar();
}

function renderReportStep() {
  const step = AppState.reportFormStep;
  
  // Hide all steps
  document.querySelectorAll('.form-step').forEach((el) => {
    el.classList.remove('active');
  });
  
  // Show active step
  const activeStep = document.getElementById(`step${step}`);
  if (activeStep) {
    activeStep.classList.add('active');
  }

  switch (step) {
    case 1: break;
    case 2: break;
    case 3: break;
    case 4: break;
  }
}

// ─── Bind Events Once ───────────────────────────────
function simulateLocationDetection() {
  const btn = document.getElementById('detectLocation');
  const status = document.getElementById('locationStatus');
  const info = document.getElementById('locationInfo');
  
  if (btn) btn.disabled = true;
  if (status) status.textContent = 'Detecting...';
  
  setTimeout(() => {
    if (btn) btn.disabled = false;
    if (status) status.textContent = 'Detected successfully';
    if (info) info.style.display = 'block';
    
    AppState.reportDraft.location = {
      lat: 12.9716,
      lng: 77.5946,
      address: 'MG Road, Central Bangalore, Karnataka 560001'
    };
    
    const latEl = document.getElementById('latValue');
    const lngEl = document.getElementById('lngValue');
    const addrEl = document.getElementById('addressText');
    const mapMsg = document.getElementById('mapMessage');
    
    if (latEl) latEl.textContent = AppState.reportDraft.location.lat;
    if (lngEl) lngEl.textContent = AppState.reportDraft.location.lng;
    if (addrEl) addrEl.textContent = AppState.reportDraft.location.address;
    if (mapMsg) mapMsg.textContent = 'Map view updated with detected location';
  }, 1500);
}

let reportEventsBound = false;
function bindReportEvents() {
  if (reportEventsBound) return;
  reportEventsBound = true;

  // Step 1
  document.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.reportDraft.category = card.getAttribute('data-category');
      const nextBtn = document.getElementById('step1Next');
      if (nextBtn) nextBtn.disabled = false;
    });
  });
  document.getElementById('step1Next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.category) { showToast('Please select a category.', 'warning'); return; }
    goToStep(2);
  });

  // Step 2
  const descInput = document.getElementById('issueDescription');
  if (descInput) {
    descInput.addEventListener('input', () => { AppState.reportDraft.description = descInput.value; });
  }

  document.querySelectorAll('.severity-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.severity-btn').forEach((b) => {
        b.classList.remove('active');
        b.className = b.className.replace(/\b(low|medium|high|critical)\b/g, '').trim();
      });
      btn.classList.add('active');
      const sev = btn.getAttribute('data-severity').toLowerCase();
      btn.classList.add(sev);
      AppState.reportDraft.severity = btn.getAttribute('data-severity');
    });
  });

  const fileInput = document.getElementById('imageInput');
  const dropzone = document.getElementById('imageDropzone');
  const browseLink = dropzone?.querySelector('.dropzone-link');

  if (browseLink && fileInput) browseLink.addEventListener('click', () => fileInput.click());
  if (dropzone && fileInput) dropzone.addEventListener('click', (e) => { if (e.target === dropzone || e.target.closest('.dropzone-icon')) fileInput.click(); });

  if (fileInput) {
    fileInput.addEventListener('change', () => handleImageFiles(fileInput.files));
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleImageFiles(e.dataTransfer.files);
    });
  }

  document.getElementById('step2Back')?.addEventListener('click', () => goToStep(1));
  document.getElementById('step2Next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.description.trim()) { showToast('Please provide a description.', 'warning'); return; }
    if (!AppState.reportDraft.severity) { showToast('Please select a severity level.', 'warning'); return; }
    goToStep(3);
  });

  // Step 3
  const manualAddress = document.getElementById('manualAddress');
  if (manualAddress) {
    manualAddress.addEventListener('input', () => { AppState.reportDraft.location.address = manualAddress.value; });
  }
  document.getElementById('detectLocation')?.addEventListener('click', simulateLocationDetection);
  document.getElementById('step3Back')?.addEventListener('click', () => goToStep(2));
  document.getElementById('step3Next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.location.address) { showToast('Please provide a location.', 'warning'); return; }
    updateReviewData();
    goToStep(4);
  });

  // Step 4
  document.querySelectorAll('.review-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-goto'), 10);
      goToStep(step);
    });
  });
  document.getElementById('step4Back')?.addEventListener('click', () => goToStep(3));
  document.getElementById('submitReport')?.addEventListener('click', () => {
    showAIVerification();
  });
}

function updateReviewData() {
  const d = AppState.reportDraft;
  const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  setHtml('reviewCategory', d.category);
  setHtml('reviewDescription', d.description);
  setHtml('reviewSeverity', d.severity);
  setHtml('reviewLocation', d.location.address || 'Not set');
  
  if (d.images.length > 0) {
    setHtml('reviewImages', `<div class="review-images">${d.images.map((img) => `<img src="${img.preview}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; margin-right:8px;" alt="Uploaded">`).join('')}</div>`);
  } else {
    setHtml('reviewImages', 'No images uploaded');
  }
}

// --- Step 1: Category Selection ---
function renderStep1() {
  const categories = [
    { id: 'pothole', label: 'Pothole', icon: '🕳️' },
    { id: 'traffic-light', label: 'Traffic Light Malfunction', icon: '🚦' },
    { id: 'water-leakage', label: 'Water Leakage', icon: '💧' },
    { id: 'garbage-dump', label: 'Garbage Dump', icon: '🗑️' },
    { id: 'broken-streetlight', label: 'Broken Streetlight', icon: '💡' },
    { id: 'drainage-issue', label: 'Drainage Issue', icon: '🌊' },
    { id: 'road-damage', label: 'Road Damage', icon: '🚧' },
    { id: 'other', label: 'Other', icon: '📋' },
  ];

  return `
    <div class="step-content step-1">
      <h3 class="step-title">Select Issue Category</h3>
      <p class="step-subtitle">Choose the type of civic issue you want to report</p>
      <div class="category-grid">
        ${categories.map((cat) => `
          <div class="category-card ${AppState.reportDraft.category === cat.label ? 'selected' : ''}" data-category="${cat.label}">
            <span class="category-icon">${cat.icon}</span>
            <span class="category-label">${cat.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="step-actions">
        <button class="btn btn-primary btn-next" ${!AppState.reportDraft.category ? 'disabled' : ''}>Next <span>→</span></button>
      </div>
    </div>
  `;
}

function initStep1() {
  document.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.reportDraft.category = card.getAttribute('data-category');
      const nextBtn = document.querySelector('.btn-next');
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  document.querySelector('.btn-next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.category) { showToast('Please select a category.', 'warning'); return; }
    goToStep(2);
  });
}

// --- Step 2: Details ---
function renderStep2() {
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  return `
    <div class="step-content step-2">
      <h3 class="step-title">Provide Details</h3>
      <p class="step-subtitle">Describe the issue and upload images</p>

      <div class="form-group">
        <label for="report-description">Description *</label>
        <textarea id="report-description" rows="4" placeholder="Describe the issue in detail...">${AppState.reportDraft.description}</textarea>
      </div>

      <div class="form-group">
        <label>Upload Images (max 5, &lt;10MB each)</label>
        <div class="dropzone" id="image-dropzone">
          <div class="dropzone-content">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p>Drag & drop images here or <span class="browse-link">browse</span></p>
          </div>
          <input type="file" id="image-input" accept="image/*" multiple hidden>
        </div>
        <div class="image-previews" id="image-previews">
          ${AppState.reportDraft.images.map((img, i) => `
            <div class="image-thumb" data-index="${i}">
              <img src="${img.preview}" alt="Preview ${i + 1}">
              <button class="remove-image" data-index="${i}">&times;</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label>Severity Level *</label>
        <div class="severity-pills">
          ${severities.map((s) => `
            <button class="severity-pill ${AppState.reportDraft.severity === s ? 'selected' : ''} severity-${s.toLowerCase()}" data-severity="${s}">${s}</button>
          `).join('')}
        </div>
      </div>

      <div class="step-actions">
        <button class="btn btn-secondary btn-back">← Back</button>
        <button class="btn btn-primary btn-next">Next →</button>
      </div>
    </div>
  `;
}

function initStep2() {
  const descInput = document.getElementById('report-description');
  if (descInput) {
    descInput.addEventListener('input', () => { AppState.reportDraft.description = descInput.value; });
  }

  // Severity pills
  document.querySelectorAll('.severity-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.severity-pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
      AppState.reportDraft.severity = pill.getAttribute('data-severity');
    });
  });

  // Image upload
  const fileInput = document.getElementById('image-input');
  const dropzone = document.getElementById('image-dropzone');
  const browseLink = dropzone?.querySelector('.browse-link');

  if (browseLink && fileInput) browseLink.addEventListener('click', () => fileInput.click());
  if (dropzone && fileInput) dropzone.addEventListener('click', (e) => { if (e.target === dropzone || e.target.closest('.dropzone-content')) fileInput.click(); });

  if (fileInput) {
    fileInput.addEventListener('change', () => handleImageFiles(fileInput.files));
  }

  // Drag & drop
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      handleImageFiles(e.dataTransfer.files);
    });
  }

  // Remove image buttons
  document.querySelectorAll('.remove-image').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      AppState.reportDraft.images.splice(index, 1);
      renderImagePreviews();
    });
  });

  // Nav buttons
  document.querySelector('.btn-back')?.addEventListener('click', () => goToStep(1));
  document.querySelector('.btn-next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.description.trim()) { showToast('Please provide a description.', 'warning'); return; }
    if (!AppState.reportDraft.severity) { showToast('Please select a severity level.', 'warning'); return; }
    goToStep(3);
  });
}

function handleImageFiles(files) {
  try {
    const fileArray = Array.from(files);
    const remaining = 5 - AppState.reportDraft.images.length;

    if (remaining <= 0) { showToast('Maximum 5 images allowed.', 'warning'); return; }

    const toProcess = fileArray.slice(0, remaining);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) { showToast(`${file.name} is not an image.`, 'error'); return; }
      if (file.size > 10 * 1024 * 1024) { showToast(`${file.name} exceeds 10MB limit.`, 'error'); return; }

      const reader = new FileReader();
      reader.onload = (e) => {
        AppState.reportDraft.images.push({ file, preview: e.target.result });
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  } catch (err) {
    showToast('Failed to process images. Please try again.', 'error');
    console.error('Image upload error:', err);
  }
}

function renderImagePreviews() {
  const container = document.getElementById('image-previews');
  if (!container) return;
  container.innerHTML = AppState.reportDraft.images.map((img, i) => `
    <div class="image-thumb" data-index="${i}">
      <img src="${img.preview}" alt="Preview ${i + 1}">
      <button class="remove-image" data-index="${i}">&times;</button>
    </div>
  `).join('');

  container.querySelectorAll('.remove-image').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      AppState.reportDraft.images.splice(index, 1);
      renderImagePreviews();
    });
  });
}

// --- Step 3: Location ---
function renderStep3() {
  const loc = AppState.reportDraft.location;
  return `
    <div class="step-content step-3">
      <h3 class="step-title">Set Location</h3>
      <p class="step-subtitle">Help us locate the issue accurately</p>

      <div class="location-actions">
        <button class="btn btn-primary btn-detect-location" id="detect-location-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
          Auto-detect Location
        </button>
      </div>

      <div class="location-info" id="location-info" style="display: ${loc.lat ? '' : 'none'}">
        <div class="coord-row">
          <span class="coord-label">Latitude:</span>
          <span class="coord-value" id="lat-value">${loc.lat || ''}</span>
        </div>
        <div class="coord-row">
          <span class="coord-label">Longitude:</span>
          <span class="coord-value" id="lng-value">${loc.lng || ''}</span>
        </div>
        <div class="coord-row">
          <span class="coord-label">Address:</span>
          <span class="coord-value" id="address-value">${loc.address || ''}</span>
        </div>
      </div>

      <div class="form-group">
        <label for="manual-address">Or enter address manually</label>
        <input type="text" id="manual-address" placeholder="Enter the full address..." value="${loc.address || ''}">
      </div>

      <div class="map-placeholder">
        <div class="map-pin">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
        </div>
        <span class="map-label">Map preview</span>
      </div>

      <div class="step-actions">
        <button class="btn btn-secondary btn-back">← Back</button>
        <button class="btn btn-primary btn-next">Next →</button>
      </div>
    </div>
  `;
}

function initStep3() {
  // Auto-detect location
  document.getElementById('detect-location-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('detect-location-btn');
    setButtonLoading(btn, true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const address = mockReverseGeocode(latitude, longitude);

      AppState.reportDraft.location = { lat: latitude, lng: longitude, address };

      document.getElementById('lat-value').textContent = latitude.toFixed(6);
      document.getElementById('lng-value').textContent = longitude.toFixed(6);
      document.getElementById('address-value').textContent = address;
      document.getElementById('location-info').style.display = '';
      document.getElementById('manual-address').value = address;

      showToast('Location detected successfully!', 'success');
    } catch (err) {
      console.error('Geolocation error:', err);
      showToast('Could not detect location. Please enter it manually.', 'warning');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // Manual address input
  const manualInput = document.getElementById('manual-address');
  if (manualInput) {
    manualInput.addEventListener('input', debounce(() => {
      AppState.reportDraft.location.address = manualInput.value;
    }, 300));
  }

  // Nav
  document.querySelector('.btn-back')?.addEventListener('click', () => goToStep(2));
  document.querySelector('.btn-next')?.addEventListener('click', () => {
    if (!AppState.reportDraft.location.address.trim()) {
      showToast('Please provide a location.', 'warning'); return;
    }
    goToStep(4);
  });
}

/** Mock reverse geocoding — returns a formatted address from approximate coords */
function mockReverseGeocode(lat, lng) {
  const areas = [
    { minLat: 12.90, maxLat: 12.95, minLng: 77.55, maxLng: 77.65, name: 'Koramangala, Bangalore, Karnataka 560034' },
    { minLat: 12.95, maxLat: 13.00, minLng: 77.55, maxLng: 77.65, name: 'MG Road Area, Bangalore, Karnataka 560001' },
    { minLat: 13.00, maxLat: 13.10, minLng: 77.55, maxLng: 77.65, name: 'Hebbal, Bangalore, Karnataka 560024' },
    { minLat: 12.85, maxLat: 12.92, minLng: 77.55, maxLng: 77.65, name: 'Jayanagar, Bangalore, Karnataka 560041' },
  ];

  for (const area of areas) {
    if (lat >= area.minLat && lat <= area.maxLat && lng >= area.minLng && lng <= area.maxLng) {
      return area.name;
    }
  }

  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E — Near Local Municipal Area`;
}

// --- Step 4: Review ---
function renderStep4() {
  const d = AppState.reportDraft;
  return `
    <div class="step-content step-4">
      <h3 class="step-title">Review Your Report</h3>
      <p class="step-subtitle">Verify all details before submitting</p>

      <div class="review-card">
        <div class="review-row">
          <span class="review-label">Category</span>
          <span class="review-value">${d.category}</span>
          <button class="btn-edit" data-goto="1">Edit</button>
        </div>
        <div class="review-row">
          <span class="review-label">Description</span>
          <span class="review-value review-desc">${d.description}</span>
          <button class="btn-edit" data-goto="2">Edit</button>
        </div>
        <div class="review-row">
          <span class="review-label">Images</span>
          <span class="review-value">
            ${d.images.length > 0
              ? `<div class="review-images">${d.images.map((img) => `<img src="${img.preview}" class="review-thumb" alt="Uploaded">`).join('')}</div>`
              : 'No images uploaded'
            }
          </span>
          <button class="btn-edit" data-goto="2">Edit</button>
        </div>
        <div class="review-row">
          <span class="review-label">Severity</span>
          <span class="review-value severity-badge severity-${d.severity.toLowerCase()}">${d.severity}</span>
          <button class="btn-edit" data-goto="2">Edit</button>
        </div>
        <div class="review-row">
          <span class="review-label">Location</span>
          <span class="review-value">${d.location.address || 'Not set'}</span>
          <button class="btn-edit" data-goto="3">Edit</button>
        </div>
      </div>

      <div class="step-actions">
        <button class="btn btn-secondary btn-back">← Back</button>
        <button class="btn btn-primary btn-submit-report">Submit & Verify</button>
      </div>
    </div>
  `;
}

function initStep4() {
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.getAttribute('data-goto'), 10);
      goToStep(step);
    });
  });

  document.querySelector('.btn-back')?.addEventListener('click', () => goToStep(3));
  document.querySelector('.btn-submit-report')?.addEventListener('click', () => {
    showAIVerification();
  });
}

/** Navigate to a specific step */
function goToStep(step) {
  AppState.reportFormStep = Math.max(1, Math.min(step, AppState.totalReportSteps));
  renderReportStep();
  updateProgressBar();
}

/** Update the progress bar UI */
function updateProgressBar() {
  const step = AppState.reportFormStep;
  const total = AppState.totalReportSteps;
  const pct = ((step) / total) * 100;

  const bar = document.querySelector('.progress-line-fill, #progressLineFill');
  if (bar) bar.style.width = `${pct}%`;

  // Step indicators
  document.querySelectorAll('.progress-step').forEach((el) => {
    const s = parseInt(el.getAttribute('data-step'), 10);
    el.classList.toggle('active', s === step);
    el.classList.toggle('completed', s < step);
  });
}


// ─── AI Verification Modal ──────────────────────────────────

function showAIVerification() {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'ai-modal-overlay';
  modal.innerHTML = `
    <div class="ai-modal">
      <button class="ai-modal-close">&times;</button>
      <div class="ai-modal-content">
        <div class="ai-header">
          <div class="ai-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3 class="ai-title">AI Verification</h3>
        </div>

        <div class="ai-scan-area">
          ${AppState.reportDraft.images.length > 0
            ? `<div class="ai-image-container">
                 <img src="${AppState.reportDraft.images[0].preview}" alt="Scanning" class="ai-scan-image">
                 <div class="ai-scan-line"></div>
               </div>`
            : `<div class="ai-image-container ai-placeholder">
                 <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                 <div class="ai-scan-line"></div>
               </div>`
          }
        </div>

        <div class="ai-status">
          <p class="ai-typing" id="ai-status-text">Initializing AI scanner...</p>
        </div>

        <div class="ai-progress">
          <div class="ai-progress-bar">
            <div class="ai-progress-fill" id="ai-progress-fill"></div>
          </div>
          <span class="ai-progress-label" id="ai-progress-label">0%</span>
        </div>

        <div class="ai-result" id="ai-result" style="display: none;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));

  // Close button
  modal.querySelector('.ai-modal-close').addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 400);
  });

  // Run verification animation
  runAIVerification(modal);
}

async function runAIVerification(modal) {
  const statusText = modal.querySelector('#ai-status-text');
  const progressFill = modal.querySelector('#ai-progress-fill');
  const progressLabel = modal.querySelector('#ai-progress-label');
  const resultContainer = modal.querySelector('#ai-result');

  const messages = [
    { text: 'Analyzing image content...', at: 0 },
    { text: 'Running anomaly detection...', at: 25 },
    { text: 'Checking metadata integrity...', at: 50 },
    { text: 'Cross-referencing location data...', at: 75 },
    { text: 'Finalizing verification...', at: 90 },
  ];

  let progress = 0;
  const duration = 3000; // 3 seconds total
  const startTime = performance.now();

  await new Promise((resolve) => {
    function tick(now) {
      const elapsed = now - startTime;
      progress = Math.min((elapsed / duration) * 100, 100);

      progressFill.style.width = `${progress}%`;
      progressLabel.textContent = `${Math.floor(progress)}%`;

      // Update status text based on progress
      for (let i = messages.length - 1; i >= 0; i--) {
        if (progress >= messages[i].at) {
          statusText.textContent = messages[i].text;
          break;
        }
      }

      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });

  // Determine result (90% real, 10% fake)
  const isReal = Math.random() < 0.9;

  resultContainer.style.display = '';
  statusText.style.display = 'none';

  if (isReal) {
    resultContainer.innerHTML = `
      <div class="ai-result-success">
        <div class="result-icon success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 9"/></svg>
        </div>
        <h4>Image Verified!</h4>
        <p>Sending to authorities...</p>
      </div>
    `;

    // Add to reports in Firebase
    try {
      if (typeof db === 'undefined' || typeof auth === 'undefined' || !auth.currentUser) {
        throw new Error("Firebase not initialized or user not logged in.");
      }

      // Handle image uploads to Firebase Storage
      let imageUrls = [];
      for (const img of AppState.reportDraft.images) {
        if (typeof storage !== 'undefined' && img.file) {
          try {
            const fileRef = storage.ref().child(`reports/${auth.currentUser.uid}/${Date.now()}_${img.file.name}`);
            await fileRef.put(img.file);
            const url = await fileRef.getDownloadURL();
            imageUrls.push(url);
          } catch (e) {
            console.error("Storage upload failed, falling back to base64", e);
            imageUrls.push(img.preview); // Fallback to base64
          }
        } else {
          imageUrls.push(img.preview); // Fallback to base64
        }
      }

      const newReport = {
        category: AppState.reportDraft.category,
        description: AppState.reportDraft.description,
        images: imageUrls,
        severity: AppState.reportDraft.severity,
        location: { ...AppState.reportDraft.location },
        status: 'Pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User'
      };

      await db.collection('reports').add(newReport);
      
      // Fire automated email via EmailJS
      sendOfficerEmail(newReport);

    } catch (error) {
      console.error("Failed to save report to Firebase:", error);
      // Fallback to local state if Firebase fails
      const fallbackReport = {
        id: generateId(),
        category: AppState.reportDraft.category,
        description: AppState.reportDraft.description,
        images: AppState.reportDraft.images.map((img) => img.preview),
        severity: AppState.reportDraft.severity,
        location: { ...AppState.reportDraft.location },
        status: 'Pending',
        createdAt: new Date().toISOString(),
        user: 'User',
      };
      AppState.reports.unshift(fallbackReport);
      
      // Fire automated email via EmailJS for fallback as well
      sendOfficerEmail(fallbackReport);
    }


    showToast('Report submitted successfully!', 'success');

    // Navigate to My Reports after delay
    setTimeout(() => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 400);
      switchDashboardSection('my-reports');
    }, 2500);

  } else {
    resultContainer.innerHTML = `
      <div class="ai-result-error">
        <div class="result-icon error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h4>Verification Failed</h4>
        <p>Image appears to be manipulated or irrelevant</p>
      </div>
    `;
    showToast('Image verification failed. Please try with a genuine image.', 'error');
  }
}


// ─── My Reports ─────────────────────────────────────────────

function renderMyReports(filter = 'all') {
  const container = document.querySelector('#reportsGrid, .reports-grid');
  if (!container) return;

  const filtered = filter === 'all'
    ? AppState.reports
    : AppState.reports.filter((r) => r.status === filter);

  const statusClasses = {
    'Pending': 'pending',
    'Verified': 'verified',
    'Sent to Authority': 'sent',
    'In Progress': 'progress',
    'Resolved': 'resolved',
  };

  const categoryIcons = {
    'Pothole': '🕳️',
    'Traffic Light Malfunction': '🚦',
    'Water Leakage': '💧',
    'Garbage Dump': '🗑️',
    'Broken Streetlight': '💡',
    'Drainage Issue': '🌊',
    'Road Damage': '🚧',
    'Other': '📋',
  };

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>No reports found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((report) => {
    // Generate a default placeholder gradient if no images
    const hasImage = report.images && report.images.length > 0;
    const imageUrl = hasImage ? (typeof report.images[0] === 'string' ? report.images[0] : report.images[0].preview) : '';
    const imgStyle = hasImage ? '' : 'background: linear-gradient(135deg, #1e293b, #0f172a);';
    const imgSrc = hasImage ? `<img src="${imageUrl}" alt="${report.category}">` : '<div style="width: 100%; height: 100%; opacity: 0.5; display: flex; align-items: center; justify-content: center; font-size: 3rem;">📋</div>';

    return `
    <div class="report-card" data-report-id="${report.id}">
      <div class="report-card-image" style="${imgStyle}">
        ${imgSrc}
      </div>
      <div class="report-card-body">
        <div class="report-card-header">
          <h4 class="report-card-title">
            <span class="report-category-icon" style="margin-right: 8px;">${categoryIcons[report.category] || '📋'}</span>
            ${report.category}
          </h4>
          <span class="status-badge status-${statusClasses[report.status] || 'pending'}">${report.status}</span>
        </div>
        <p class="report-card-desc" style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px;">${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}</p>
        <div class="report-card-meta">
          <div style="display: flex; gap: 6px; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style="overflow: hidden; text-overflow: ellipsis;">${report.location?.address || 'Location unknown'}</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${formatDate(report.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  `}).join('');

  // Click handlers for detail view
  container.querySelectorAll('.report-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-report-id');
      showReportDetail(id);
    });
  });

  // Filter dropdown
  const filterSelect = document.querySelector('#report-filter, .report-filter');
  if (filterSelect && !filterSelect.dataset.initialized) {
    filterSelect.dataset.initialized = 'true';
    filterSelect.addEventListener('change', () => {
      renderMyReports(filterSelect.value);
    });
  }

  // View toggle
  const viewToggle = document.querySelector('.view-toggle');
  if (viewToggle && !viewToggle.dataset.initialized) {
    viewToggle.dataset.initialized = 'true';
    viewToggle.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        viewToggle.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        container.classList.toggle('list-view', view === 'list');
        container.classList.toggle('grid-view', view !== 'list');
      });
    });
  }
}


// ─── Report Detail View ─────────────────────────────────────

function showReportDetail(reportId) {
  const report = AppState.reports.find((r) => r.id === reportId);
  if (!report) { showToast('Report not found.', 'error'); return; }

  const container = document.querySelector('#content-track-status');
  if (!container) return;
  
  switchDashboardSection('track-status');

  const statusSteps = ['Pending', 'Verified', 'Sent to Authority', 'In Progress', 'Resolved'];
  const currentStatusIndex = statusSteps.indexOf(report.status);

  // Calculate 48-hour countdown from creation
  const createdAt = new Date(report.createdAt).getTime();
  const deadline = createdAt + 48 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();

  container.innerHTML = `
    <div class="report-detail">
      <button class="btn btn-secondary btn-back-to-list">← Back to Reports</button>

      <div class="report-detail-header">
        <h3>${report.category}</h3>
        <span class="report-id">${report.id}</span>
      </div>

      <div class="report-detail-grid">
        <div class="detail-main">
          <div class="detail-section">
            <h4>Description</h4>
            <p>${report.description}</p>
          </div>

          ${report.images && report.images.length > 0
            ? `<div class="detail-section">
                 <h4>Images</h4>
                 <div class="detail-images">
                   ${(Array.isArray(report.images) ? report.images : []).map((img) => `<img src="${typeof img === 'string' ? img : img.preview}" alt="Report image" class="detail-image">`).join('')}
                 </div>
               </div>`
            : ''
          }

          <div class="detail-section">
            <h4>Location</h4>
            <p>${report.location?.address || 'Not provided'}</p>
          </div>

          <div class="detail-section">
            <h4>Severity</h4>
            <span class="severity-badge severity-${(report.severity || '').toLowerCase()}">${report.severity || 'Not set'}</span>
          </div>

          <div class="detail-section">
            <h4>Reported by</h4>
            <p>${report.user || 'Unknown'}</p>
          </div>

          <div class="detail-section">
            <h4>Reported on</h4>
            <p>${formatDate(report.createdAt)}</p>
          </div>
        </div>

        <div class="detail-sidebar">
          <div class="countdown-card">
            <h4>Resolution Deadline</h4>
            <div class="countdown-timer" id="countdown-${report.id}">${formatCountdown(Math.max(remaining, 0))}</div>
            <p class="countdown-label">48-hour commitment</p>
          </div>

          <div class="status-timeline">
            <h4>Status Timeline</h4>
            ${statusSteps.map((step, i) => `
              <div class="timeline-step ${i <= currentStatusIndex ? 'completed' : ''} ${i === currentStatusIndex ? 'current' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-label">${step}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Back button
  container.querySelector('.btn-back-to-list')?.addEventListener('click', () => {
    switchDashboardSection('my-reports');
  });

  // Start countdown timer
  const countdownEl = document.getElementById(`countdown-${report.id}`);
  if (countdownEl && remaining > 0) {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const rem = deadline - now;
      if (rem <= 0) {
        countdownEl.textContent = '00:00:00:00';
        clearInterval(intervalId);
      } else {
        countdownEl.textContent = formatCountdown(rem);
      }
    }, 1000);

    // Store interval so we can clean it up
    AppState.countdownIntervals.push(intervalId);
  }
}


// ─── Profile Page ───────────────────────────────────────────

function initProfile() {
  const user = JSON.parse(sessionStorage.getItem('genq_user') || '{}');

  const totalReports = AppState.reports.length;
  const resolved = AppState.reports.filter((r) => r.status === 'Resolved').length;
  const pending = AppState.reports.filter((r) => r.status === 'Pending').length;
  const responseRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0;

  // Update Stats
  const statTotal = document.getElementById('statTotal');
  const statResolved = document.getElementById('statResolved');
  const statPending = document.getElementById('statPending');
  const statRate = document.getElementById('statRate');
  if (statTotal) statTotal.textContent = totalReports;
  if (statResolved) statResolved.textContent = resolved;
  if (statPending) statPending.textContent = pending;
  if (statRate) statRate.textContent = responseRate + '%';

  // Update Display
  const avatar = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  if (avatar) avatar.textContent = (user.name || 'U')[0].toUpperCase();
  if (nameEl) nameEl.textContent = user.name || 'User';
  if (emailEl) emailEl.textContent = user.email || 'user@example.com';

  // Update Form
  const editName = document.getElementById('profileEditName');
  const editEmail = document.getElementById('profileEditEmail');
  const editPhone = document.getElementById('profileEditPhone');
  if (editName) editName.value = user.name || '';
  if (editEmail) editEmail.value = user.email || '';
  if (editPhone) editPhone.value = user.phone || '';

  // Save handler
  const saveBtn = document.getElementById('saveProfile');
  if (saveBtn) {
    saveBtn.onclick = () => {
      const updated = {
        name: editName?.value.trim() || user.name,
        email: editEmail?.value.trim() || user.email,
        phone: editPhone?.value.trim() || '',
      };
      sessionStorage.setItem('genq_user', JSON.stringify(updated));

      // Update header globally
      const welcomeEl = document.querySelector('.welcome-name, .user-name, #welcomeName');
      if (welcomeEl) welcomeEl.textContent = updated.name;
      document.querySelectorAll('.avatar-initial, .user-avatar, #userAvatar, #profileAvatar').forEach((el) => {
        el.textContent = updated.name[0].toUpperCase();
      });
      if (nameEl) nameEl.textContent = updated.name;
      if (emailEl) emailEl.textContent = updated.email;

      showToast('Profile updated successfully!', 'success');
    };
  }
}


// ─── Logout ─────────────────────────────────────────────────

function handleLogout() {
  // Clear all countdown intervals
  AppState.countdownIntervals.forEach(clearInterval);
  AppState.countdownIntervals = [];

  sessionStorage.removeItem('genq_user');

  showPage('landing');
  showToast('Logged out successfully!', 'info');
}


// ─── Initialization ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Mock data removed based on user request

    // Set smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Check for existing session
    const existingUser = sessionStorage.getItem('genq_user');
    if (existingUser) {
      showPage('dashboard');
      initDashboardUI();
    } else {
      showPage('landing');
    }

    // Initialize components
    initNavbar();
    initLandingAnimations();
    initParticleBackground();
    initAuth();
    initDashboard();

    // Popstate handler for browser back/forward
    window.addEventListener('popstate', handlePopState);

    // Handle initial hash
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
      showPage(hash);
    }

    console.log('%c🏙️ GenQ — Civic Issue Reporting Platform', 'color: #6366f1; font-size: 16px; font-weight: bold;');
    console.log('%cApp initialized successfully.', 'color: #22d3ee;');

    // Dismiss the page loader
    const pageLoader = document.getElementById('pageLoader');
    if (pageLoader) {
      setTimeout(() => {
        pageLoader.classList.add('fade-out');
        setTimeout(() => {
          pageLoader.style.display = 'none';
        }, 500);
      }, 800);
    }
  } catch (err) {
    const loaderText = document.querySelector('.loader-text');
    if (loaderText) {
      loaderText.textContent = "Error: " + err.message;
      loaderText.style.color = "red";
      loaderText.style.fontSize = "12px";
      document.getElementById('pageLoader').style.opacity = "1";
    }
    console.error(err);
  }
});
