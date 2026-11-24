import {
  clamp,
  damp,
  computeHeroCarTransform,
  computeFooterCarTransform,
  computeDividerCarOffset,
  formatCountdownParts,
  buildEventIcs,
  type CarTransform,
} from './motion/scrollMath';
import {
  WEDDING_EVENTS,
  COUPLE_PORTRAITS,
  WEDDING_TARGET_ISO,
  WEDDING_HASHTAG,
  type EventDayGroup,
  type WeddingEvent,
} from './data/weddingEvents';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showToast(message: string): void {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.className =
    'pointer-events-auto rounded-xl bg-[#192635]/95 text-champagne border border-champagne/35 px-4 py-3 shadow-2xl font-manrope text-xs tracking-wide backdrop-blur-md transition-all duration-300 opacity-0 translate-y-2';
  toast.textContent = message;

  root.innerHTML = '';
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  window.setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-2');
    window.setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* ============================================================================
   1. UNIFIED ON-DEMAND SPRING SCROLL ENGINE (CITY-2 INSPIRED)
   Zero sticky scroll-traps, zero wobble, sleeps cleanly when settled.
============================================================================ */
function initMotionEngine(): void {
  const heroSection = document.getElementById('hero-section');
  const heroCar = document.getElementById('hero-car-wrap');
  const heroShadow = document.getElementById('hero-car-shadow');
  const heroBackdrop = document.getElementById('hero-backdrop-img');
  const heroTitle = document.getElementById('hero-title-group');
  const heroLanterns = Array.from(document.querySelectorAll<HTMLElement>('[data-lantern-depth]'));

  const dividerTrack1 = document.getElementById('divider-track-1');
  const dividerCar1 = document.getElementById('divider-car-1');
  const dividerTrack2 = document.getElementById('divider-track-2');
  const dividerCar2 = document.getElementById('divider-car-2');

  const footerSection = document.getElementById('countdown-section');
  const footerCar = document.getElementById('footer-car-wrap');
  const footerShadow = document.getElementById('footer-car-shadow');

  const progressBar = document.getElementById('scroll-progress-bar');
  const navBar = document.getElementById('heritage-nav');
  const scrollChevron = document.getElementById('scroll-chevron');

  let cachedVW = window.innerWidth || 1280;
  let cachedVH = window.innerHeight || 800;

  const isMobile = () => cachedVW < 640;

  const applyCarDom = (
    el: HTMLElement | null,
    shadow: HTMLElement | null,
    t: CarTransform
  ) => {
    if (!el) return;
    const xPx = (t.xVw * cachedVW) / 100;
    const yPx = (t.yVh * cachedVH) / 100;
    el.style.transform = `translate3d(${xPx.toFixed(2)}px, ${yPx.toFixed(2)}px, 0) scale(${t.scale.toFixed(4)})`;
    el.style.opacity = t.opacity.toFixed(3);
    if (shadow) {
      shadow.style.transform = `scale3d(${t.shadowScale.toFixed(3)}, ${(t.shadowScale * 0.72).toFixed(3)}, 1)`;
      shadow.style.opacity = t.shadowOpacity.toFixed(3);
    }
  };

  if (REDUCED_MOTION) {
    applyCarDom(heroCar, heroShadow, computeHeroCarTransform(0, isMobile()));
    applyCarDom(footerCar, footerShadow, computeFooterCarTransform(1, isMobile()));
    return;
  }

  // Smoothed state values (lerped toward scroll targets with frame-rate-independent damp)
  const state = {
    heroP: 0,
    footerP: 0,
    div1P: 0.5,
    div2P: 0.5,
    pageP: 0,
  };

  const target = {
    heroP: 0,
    footerP: 0,
    div1P: 0.5,
    div2P: 0.5,
    pageP: 0,
  };

  const measureTargets = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - cachedVH);
    target.pageP = clamp(scrollY / maxScroll, 0, 1);

    // Header chrome & hero scroll cue
    if (navBar) {
      const scrolled = scrollY > 48;
      navBar.dataset.scrolled = scrolled ? 'true' : 'false';
    }
    if (scrollChevron) {
      scrollChevron.style.opacity = scrollY > 60 ? '0' : '';
    }

    // Hero car progress: 0 at page top -> 1 as hero scrolls naturally upward out of view
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      const travel = Math.max(1, rect.height * 0.92);
      target.heroP = clamp(-rect.top / travel, 0, 1);
    }

    // Divider cars: 0 when divider enters bottom of viewport -> 1 when it leaves top
    if (dividerTrack1) {
      const r = dividerTrack1.getBoundingClientRect();
      const span = cachedVH + r.height;
      target.div1P = clamp((cachedVH - r.top) / Math.max(1, span), 0, 1);
    }
    if (dividerTrack2) {
      const r = dividerTrack2.getBoundingClientRect();
      const span = cachedVH + r.height;
      target.div2P = clamp((cachedVH - r.top) / Math.max(1, span), 0, 1);
    }

    // Footer car progress: 0 as footer enters viewport bottom -> 1 as footer settles into view
    if (footerSection) {
      const r = footerSection.getBoundingClientRect();
      const enterSpan = Math.max(1, cachedVH * 0.95);
      target.footerP = clamp((cachedVH - r.top) / enterSpan, 0, 1);
    }
  };

  const renderState = () => {
    const mobile = isMobile();

    // 1. Hero vintage car & palace parallax
    applyCarDom(heroCar, heroShadow, computeHeroCarTransform(state.heroP, mobile));

    if (heroBackdrop) {
      const yShift = state.heroP * (mobile ? 28 : 54);
      const scale = 1 + state.heroP * 0.045;
      heroBackdrop.style.transform = `translate3d(0, ${yShift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    }

    if (heroTitle) {
      const titleY = -state.heroP * (mobile ? 28 : 48);
      const titleOpacity = clamp(1 - state.heroP * 1.15, 0, 1);
      heroTitle.style.transform = `translate3d(0, ${titleY.toFixed(2)}px, 0)`;
      heroTitle.style.opacity = titleOpacity.toFixed(3);
    }

    for (const lantern of heroLanterns) {
      const depth = Number(lantern.dataset.lanternDepth || '0.5');
      const lShift = -state.heroP * depth * (mobile ? 46 : 82);
      lantern.style.transform = `translate3d(0, ${lShift.toFixed(2)}px, 0)`;
    }

    // 2. Section divider vintage cars gliding across the track
    const divTravel = mobile ? 72 : 175;
    if (dividerCar1) {
      const x1 = computeDividerCarOffset(state.div1P, 1, divTravel);
      dividerCar1.style.transform = `translate3d(${x1.toFixed(2)}px, 0, 0)`;
    }
    if (dividerCar2) {
      const x2 = computeDividerCarOffset(state.div2P, -1, divTravel);
      dividerCar2.style.transform = `translate3d(${x2.toFixed(2)}px, 0, 0)`;
    }

    // 3. Footer vintage obsidian roadster emerging from palace archway
    applyCarDom(footerCar, footerShadow, computeFooterCarTransform(state.footerP, mobile));

    // 4. Top brass reading progress hairline
    if (progressBar) {
      progressBar.style.transform = `scaleX(${state.pageP.toFixed(4)})`;
    }
  };

  let rafId: number | null = null;
  let lastTime = 0;
  const LAMBDA = 11.5; // Responsive, silky spring settle (no sluggish lag)

  const tick = (now: number) => {
    const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
    lastTime = now;

    measureTargets();

    state.heroP = damp(state.heroP, target.heroP, LAMBDA, dt, 0.0004);
    state.footerP = damp(state.footerP, target.footerP, LAMBDA, dt, 0.0004);
    state.div1P = damp(state.div1P, target.div1P, LAMBDA, dt, 0.0005);
    state.div2P = damp(state.div2P, target.div2P, LAMBDA, dt, 0.0005);
    state.pageP = damp(state.pageP, target.pageP, 16, dt, 0.0004);

    renderState();

    const settled =
      state.heroP === target.heroP &&
      state.footerP === target.footerP &&
      state.div1P === target.div1P &&
      state.div2P === target.div2P &&
      state.pageP === target.pageP;

    if (settled) {
      rafId = null;
      lastTime = 0;
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  const wake = () => {
    if (rafId === null) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  // Snap initial pose synchronously so there is zero first-paint jump
  measureTargets();
  Object.assign(state, target);
  renderState();

  window.addEventListener('scroll', wake, { passive: true });

  let resizeTimer: number | null = null;
  window.addEventListener(
    'resize',
    () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        cachedVW = window.innerWidth || 1280;
        cachedVH = window.innerHeight || 800;
        wake();
      }, 120);
    },
    { passive: true }
  );
}

/* ============================================================================
   2. CHOREOGRAPHED COMPOSITOR-ONLY SCROLL REVEALS
============================================================================ */
function initScrollReveals(): void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!nodes.length) return;

  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    nodes.forEach((n) => n.classList.add('is-revealed'));
    return;
  }

  document.documentElement.classList.add('motion-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.revealDelay || '0');
        if (delay > 0) {
          el.style.transitionDelay = `${delay}ms`;
        }
        el.classList.add('is-revealed');
        observer.unobserve(el);
      }
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -36px 0px',
    }
  );

  nodes.forEach((n) => observer.observe(n));
}

/* ============================================================================
   3. INTERACTIVE NAVIGATION + ACTIVE SECTION HIGHLIGHTING
============================================================================ */
function initNavigation(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const mobileMenuBtn = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');

  const closeMobileDrawer = () => {
    if (!mobileDrawer || !mobileMenuBtn) return;
    mobileDrawer.classList.add('hidden');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  };

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = !mobileDrawer.classList.contains('hidden');
      mobileDrawer.classList.toggle('hidden', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const targetEl = document.querySelector(href);
      if (!targetEl) return;
      e.preventDefault();
      closeMobileDrawer();
      targetEl.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Track active section
  const sections = ['invite-section', 'couple-section', 'details-section', 'countdown-section']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const activeId = `#${entry.target.id}`;
          links.forEach((link) => {
            const isMatch = link.getAttribute('href') === activeId;
            link.dataset.active = isMatch ? 'true' : 'false';
          });
        }
      },
      { rootMargin: '-38% 0px -48% 0px', threshold: 0 }
    );
    sections.forEach((s) => navObserver.observe(s));
  }
}

/* ============================================================================
   4. EVENT DAY FILTER + ACCESSIBLE VENUE & ROUTE MODAL WITH REAL .ICS EXPORT
============================================================================ */
function initEventsUI(): void {
  const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-event-filter]'));
  const eventCards = Array.from(document.querySelectorAll<HTMLElement>('[data-event-card]'));
  const eventCountLabel = document.getElementById('event-filter-count');

  const applyFilter = (group: EventDayGroup) => {
    let visibleCount = 0;
    eventCards.forEach((card) => {
      const cardGroup = card.dataset.dayGroup;
      const matches = group === 'all' || cardGroup === group;
      card.hidden = !matches;
      if (matches) {
        visibleCount++;
        card.classList.add('is-revealed');
      }
    });

    filterButtons.forEach((btn) => {
      const active = btn.dataset.eventFilter === group;
      btn.setAttribute('aria-pressed', String(active));
      btn.dataset.active = active ? 'true' : 'false';
    });

    if (eventCountLabel) {
      eventCountLabel.textContent =
        visibleCount === 1 ? 'Showing 1 celebration' : `Showing ${visibleCount} celebrations`;
    }
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = (btn.dataset.eventFilter || 'all') as EventDayGroup;
      applyFilter(group);
    });
  });

  // Event Route / Details Modal Dialog
  const modal = document.getElementById('event-modal') as HTMLDialogElement | null;
  const modalTitle = document.getElementById('modal-event-title');
  const modalDate = document.getElementById('modal-event-date');
  const modalTime = document.getElementById('modal-event-time');
  const modalVenue = document.getElementById('modal-event-venue');
  const modalAttire = document.getElementById('modal-event-attire');
  const modalMapLink = document.getElementById('modal-map-link') as HTMLAnchorElement | null;
  const modalIcsBtn = document.getElementById('modal-ics-btn') as HTMLButtonElement | null;
  const modalCloseBtn = document.getElementById('modal-close-btn');

  let activeEvent: WeddingEvent | null = null;

  const openEventModal = (event: WeddingEvent) => {
    activeEvent = event;
    if (modalTitle) modalTitle.textContent = event.name;
    if (modalDate) modalDate.textContent = event.dateLabel;
    if (modalTime) modalTime.textContent = `${event.city} · ${event.timeLabel}`;
    if (modalVenue) modalVenue.textContent = event.venueNote;
    if (modalAttire) modalAttire.textContent = event.attire;
    if (modalMapLink) {
      modalMapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.mapQuery)}`;
    }
    if (modal) {
      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', 'true');
      }
    }
  };

  const closeEventModal = () => {
    if (!modal) return;
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
  };

  document.querySelectorAll<HTMLElement>('[data-open-event]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id = trigger.dataset.openEvent;
      const found = WEDDING_EVENTS.find((ev) => ev.id === id) || WEDDING_EVENTS[4]; // Default Shaadi
      openEventModal(found);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeEventModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEventModal();
    });
  }

  if (modalIcsBtn) {
    modalIcsBtn.addEventListener('click', () => {
      if (!activeEvent) return;
      const ics = buildEventIcs({
        id: `${activeEvent.id}-2027`,
        title: `${activeEvent.name} — Niraalii & Uttkarsh`,
        startIso: activeEvent.startIso,
        endIso: activeEvent.endIso,
        location: `${activeEvent.city}, India`,
        description: `${activeEvent.venueNote} Attire: ${activeEvent.attire}.`,
      });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `niraalii-uttkarsh-${activeEvent.id}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Saved ${activeEvent.name} calendar invite`);
    });
  }
}

/* ============================================================================
   5. COUPLE PORTRAIT GALLERY (CROSSFADE, SWIPE, KEYBOARD & COUNTER)
============================================================================ */
function initGallery(): void {
  const viewport = document.getElementById('gallery-viewport');
  const caption = document.getElementById('gallery-caption');
  const subtitle = document.getElementById('gallery-subtitle');
  const counter = document.getElementById('gallery-counter');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]'));

  let current = 0;

  const setPhoto = (nextIndex: number) => {
    current = (nextIndex + COUPLE_PORTRAITS.length) % COUPLE_PORTRAITS.length;
    const item = COUPLE_PORTRAITS[current];

    COUPLE_PORTRAITS.forEach((_, idx) => {
      const img = document.getElementById(`gallery-img-${idx}`);
      if (!img) return;
      img.classList.toggle('gallery-active', idx === current);
      img.classList.toggle('gallery-inactive', idx !== current);
    });

    if (caption) caption.textContent = item.caption;
    if (subtitle) subtitle.textContent = item.subtitle;
    if (counter) {
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(COUPLE_PORTRAITS.length).padStart(2, '0')}`;
    }

    dots.forEach((dot, idx) => {
      const active = idx === current;
      dot.setAttribute('aria-pressed', String(active));
      dot.className = active
        ? 'h-2.5 w-7 rounded-full bg-blushcream transition-all duration-300'
        : 'h-2.5 w-2.5 rounded-full bg-blushcream/40 hover:bg-blushcream/70 transition-all duration-300';
    });
  };

  prevBtn?.addEventListener('click', () => setPhoto(current - 1));
  nextBtn?.addEventListener('click', () => setPhoto(current + 1));
  dots.forEach((dot) => {
    dot.addEventListener('click', () => setPhoto(Number(dot.dataset.galleryDot || '0')));
  });

  if (viewport) {
    let startX = 0;
    let startY = 0;
    viewport.addEventListener(
      'touchstart',
      (e) => {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    viewport.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          setPhoto(dx < 0 ? current + 1 : current - 1);
        }
      },
      { passive: true }
    );

    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') setPhoto(current + 1);
      if (e.key === 'ArrowLeft') setPhoto(current - 1);
    });
  }
}

/* ============================================================================
   6. NON-REFLOWING LIVE COUNTDOWN TIMER
============================================================================ */
function initCountdown(): void {
  const targetMs = new Date(WEDDING_TARGET_ISO).getTime();
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  const tick = () => {
    const parts = formatCountdownParts(targetMs, Date.now());
    if (daysEl.textContent !== parts.days) daysEl.textContent = parts.days;
    if (hoursEl.textContent !== parts.hours) hoursEl.textContent = parts.hours;
    if (minsEl.textContent !== parts.mins) minsEl.textContent = parts.mins;
    if (secsEl.textContent !== parts.secs) secsEl.textContent = parts.secs;
  };

  tick();
  window.setInterval(tick, 1000);
}

/* ============================================================================
   7. COPYABLE HASHTAG & INSTAGRAM ACTION
============================================================================ */
function initDetailsActions(): void {
  const copyHashtag = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(WEDDING_HASHTAG);
      } else {
        const area = document.createElement('textarea');
        area.value = WEDDING_HASHTAG;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      showToast(`Copied ${WEDDING_HASHTAG} — ready for your celebration photos`);
    } catch {
      showToast(`Use hashtag ${WEDDING_HASHTAG} on Instagram`);
    }
  };

  document.getElementById('copy-hashtag-btn')?.addEventListener('click', copyHashtag);
  document.getElementById('instagram-action-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    copyHashtag();
  });
}

/* ============================================================================
   8. AMBIENT WEDDING MELODY SYNTHESIZER (WEB AUDIO)
============================================================================ */
function initMusicToggle(): void {
  const btn = document.getElementById('music-toggle');
  const iconOff = document.getElementById('music-icon-off');
  const iconOn = document.getElementById('music-icon-on');
  if (!btn || !iconOff || !iconOn) return;

  let audioCtx: AudioContext | null = null;
  let musicInterval: number | null = null;
  let isPlaying = false;

  const playGentleNote = (freq: number, duration: number) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, audioCtx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  btn.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      if (musicInterval) window.clearInterval(musicInterval);
      musicInterval = null;
      btn.setAttribute('aria-pressed', 'false');
      iconOff.classList.remove('hidden');
      iconOn.classList.add('hidden');
      showToast('Wedding melody paused');
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      showToast('Audio not supported in this browser');
      return;
    }
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const notes = [293.66, 329.63, 369.99, 440.0, 493.88, 554.37, 587.33, 440.0];
    let step = 0;
    playGentleNote(notes[0], 1.4);
    musicInterval = window.setInterval(() => {
      step++;
      playGentleNote(notes[step % notes.length], 1.4);
    }, 900);

    isPlaying = true;
    btn.setAttribute('aria-pressed', 'true');
    iconOff.classList.add('hidden');
    iconOn.classList.remove('hidden');
    showToast('Playing gentle Yaman wedding melody');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMotionEngine();
  initScrollReveals();
  initNavigation();
  initEventsUI();
  initGallery();
  initCountdown();
  initDetailsActions();
  initMusicToggle();
});
