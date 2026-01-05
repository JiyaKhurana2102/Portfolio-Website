/*
  Main JavaScript for the portfolio front-end.
  - Handles the auto-scrolling carousel using the CAROUSEL_IMAGES global injected by the HTML template.
  - Adds smooth scrolling for sidebar navigation links.
  - Adds a simple mobile toggle for the sidebar on very small screens.

  Comments explain each function so you can learn what each piece is doing.
*/

// Wait for DOM content to ensure elements exist before manipulating them
document.addEventListener('DOMContentLoaded', function () {
  // helper to compute sidebar and offset for scrolling
  function getSidebarAndOffset() {
    const sidebar = document.getElementById('sidebar');
    let offset = 12;
    if (sidebar) {
      // Use media query to decide if sidebar is acting as a top bar (mobile)
      const isTopBar = window.matchMedia('(max-width: 640px)').matches;
      if (isTopBar) offset = sidebar.getBoundingClientRect().height + 8;
    }
    return { sidebar, offset };
  }

  // unified handler for nav link clicks
  function onNavLinkClick(e) {
    if (!e.currentTarget) return;
    e.preventDefault();

    const href = this.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return; // only handle in-page anchors

    const target = document.querySelector(href);
    if (!target) {
      console.warn('Nav target not found for', href);
      return;
    }

    const { sidebar, offset } = getSidebarAndOffset();

    // Use scrollIntoView for the main smooth scroll and then adjust by offset.
    // This avoids layout measurement timing issues in some browsers.
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // After the browser has performed the initial smooth scroll, nudge the page up by the offset
    // Use a small timeout to allow the initial scroll to start — 300ms is usually sufficient.
    // Use a non-zero timeout so the adjustment is animated (keeps UX smooth).
    setTimeout(() => {
      // Use window.scrollBy with smooth behavior where supported
      try {
        window.scrollBy({ top: -offset, left: 0, behavior: 'smooth' });
      } catch (err) {
        // Fallback for browsers that don't support smooth in scrollBy
        window.scrollTo({ top: window.scrollY - offset });
      }

      // Update URL hash without jumping
      if (history.replaceState) history.replaceState(null, '', href);
    }, 320);

    // Close mobile sidebar if open
    if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
  }

  // Attach to all nav links (covers sidebar and any other nav areas)
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => link.addEventListener('click', onNavLinkClick));

  // ---------- Mobile sidebar toggle ----------
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function (ev) {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;
      sidebar.classList.toggle('open');
      // ensure focus moves to first link for keyboard users
      if (sidebar.classList.contains('open')) {
        const firstLink = sidebar.querySelector('.nav-link');
        if (firstLink) firstLink.focus();
      }
    });
  }

  // ---------- Carousel setup ----------
  // CAROUSEL_IMAGES is defined inline in the HTML. If not present, use a fallback empty list.
  const images = window.CAROUSEL_IMAGES || [];
  const track = document.getElementById('carouselTrack');

  if (track && images.length) {
    // For a smooth infinite effect, we'll duplicate the image list so it can scroll continuously.
    const imageList = images.concat(images);

    // Create DOM elements for each image in the list
    imageList.forEach(src => {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      const img = document.createElement('img');
      img.src = src; // image URL from the server
      img.alt = 'Carousel image';
      item.appendChild(img);
      track.appendChild(item);
    });

    // Animation parameters
    let speed = 40; // pixels per second (adjust to change how fast the carousel moves)

    // Track current translation (pixels) applied to the carousel track
    let offset = 0;

    // Measure the width of the duplicated half so we can reset the scroll at the halfway point
    function getHalfWidth() {
      // Sum widths of first half of items
      const items = track.querySelectorAll('.carousel-item');
      let half = 0;
      const count = items.length / 2; // because we duplicated
      for (let i = 0; i < count; i++) {
        half += items[i].getBoundingClientRect().width + parseFloat(getComputedStyle(items[i]).marginRight || 0);
      }
      return half;
    }

    // Use requestAnimationFrame for smooth, efficient animation tied to display refresh.
    let lastTime = performance.now();
    let halfWidth = getHalfWidth();

    function step(now) {
      const dt = (now - lastTime) / 1000; // seconds elapsed since last frame
      lastTime = now;

      // Advance offset according to speed
      offset -= speed * dt;

      // When we've scrolled through half the duplicated track, snap back to start for seamless loop
      if (Math.abs(offset) >= halfWidth) {
        offset += halfWidth; // reset by adding halfWidth back
      }

      track.style.transform = `translateX(${offset}px)`;
      requestAnimationFrame(step);
    }

    // Recompute widths on resize to keep the loop seamless
    window.addEventListener('resize', function () {
      halfWidth = getHalfWidth();
    });

    // Start the animation loop
    requestAnimationFrame(step);

    // Pause animation on hover to allow users to interact
    track.addEventListener('mouseenter', function () { speed = 0; });
    track.addEventListener('mouseleave', function () { speed = 40; });
  }

  // ---------- Accessibility improvement: enable keyboard navigation for sidebar ----------
  // Add focus styles and allow Enter key to activate links for keyboard users
  document.querySelectorAll('.sidebar a').forEach(a => {
    a.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') this.click();
    });
  });
});
