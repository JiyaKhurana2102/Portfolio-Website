/*
  Main JavaScript for the portfolio front-end.
  - Handles the auto-scrolling carousel using the CAROUSEL_IMAGES global injected by the HTML template.
  - Adds smooth scrolling for sidebar navigation links.
  - Adds a simple mobile toggle for the sidebar on very small screens.

  Comments explain each function so you can learn what each piece is doing.
*/

// Wait for DOM content to ensure elements exist before manipulating them
document.addEventListener('DOMContentLoaded', function () {
  // ---------- Smooth scrolling for sidebar links ----------
  // Grab all internal nav links that point to sections on this page
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;

      // Compute an offset to account for any fixed header/sidebar that may overlap the section title.
      // On small screens the sidebar becomes a top bar (height ~64px); on desktop it is vertical so no top offset needed.
      const sidebar = document.getElementById('sidebar');
      let offset = 12; // default small spacing from top
      if (sidebar) {
        // If the sidebar currently spans the top of the page (mobile), subtract its height
        const sidebarStyle = window.getComputedStyle(sidebar);
        const isTopBar = sidebarStyle.position === 'fixed' && sidebar.getBoundingClientRect().width >= window.innerWidth - 1;
        if (isTopBar) {
          offset = sidebar.getBoundingClientRect().height + 8; // a little extra breathing room
        }
      }

      // Calculate the exact document position to scroll to, taking into account current scrollY
      const targetRect = target.getBoundingClientRect();
      const scrollTarget = window.scrollY + targetRect.top - offset;

      // Scroll smoothly to that computed position
      window.scrollTo({ top: scrollTarget, behavior: 'smooth' });

      // On small screens, close the sidebar if it was open
      if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
    });
  });

  // ---------- Mobile sidebar toggle ----------
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('open');
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
