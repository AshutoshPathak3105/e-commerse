(() => {
  const dropdowns = [...document.querySelectorAll(".dropdown")];

  const getTrigger = (dropdown) => dropdown.querySelector("[data-dropdown-trigger]");
  const getItems = (dropdown) => [
    ...dropdown.querySelectorAll('[role^="menuitem"]'),
  ];

  const resetViewportMenu = (dropdown) => {
    const menu = dropdown.querySelector("[data-dropdown-menu]");
    if (!menu) return;

    menu.classList.remove("is-viewport-menu");
    menu.style.removeProperty("left");
    menu.style.removeProperty("top");
  };

  const positionViewportMenu = (dropdown) => {
    if (
      !dropdown.closest(".category-bar") ||
      !window.matchMedia("(max-width: 840px)").matches
    ) {
      return;
    }

    const trigger = getTrigger(dropdown);
    const menu = dropdown.querySelector("[data-dropdown-menu]");
    if (!trigger || !menu) return;

    menu.classList.add("is-viewport-menu");
    const triggerBounds = trigger.getBoundingClientRect();
    const safeLeft = Math.max(
      8,
      Math.min(triggerBounds.left, window.innerWidth - menu.offsetWidth - 8),
    );

    menu.style.left = `${safeLeft}px`;
    menu.style.top = `${triggerBounds.bottom + 8}px`;
  };

  const closeDropdown = (dropdown, restoreFocus = false) => {
    if (!dropdown?.classList.contains("is-open")) return;

    dropdown.classList.remove("is-open");
    getTrigger(dropdown)?.setAttribute("aria-expanded", "false");
    resetViewportMenu(dropdown);

    if (restoreFocus) getTrigger(dropdown)?.focus();
  };

  const closeAll = (except = null) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== except) closeDropdown(dropdown);
    });
  };

  const openDropdown = (dropdown, focusPosition) => {
    const trigger = getTrigger(dropdown);
    const items = getItems(dropdown);

    closeAll(dropdown);
    dropdown.classList.add("is-open");
    trigger?.setAttribute("aria-expanded", "true");
    positionViewportMenu(dropdown);

    if (focusPosition && items.length) {
      items[focusPosition === "last" ? items.length - 1 : 0].focus();
    }
  };

  dropdowns.forEach((dropdown) => {
    const trigger = getTrigger(dropdown);
    const menu = dropdown.querySelector("[data-dropdown-menu]");

    trigger?.addEventListener("click", () => {
      if (dropdown.classList.contains("is-open")) {
        closeDropdown(dropdown);
      } else {
        openDropdown(dropdown);
      }
    });

    trigger?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        if (dropdown.classList.contains("is-open")) {
          closeDropdown(dropdown);
        } else {
          openDropdown(dropdown, "first");
        }
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openDropdown(dropdown, event.key === "ArrowUp" ? "last" : "first");
      }

      if (event.key === "Escape") closeDropdown(dropdown);
    });

    menu?.addEventListener("keydown", (event) => {
      const items = getItems(dropdown);
      const currentIndex = items.indexOf(document.activeElement);

      if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown(dropdown, true);
        return;
      }

      if (event.key === "Tab") {
        closeDropdown(dropdown);
        return;
      }

      if (!items.length) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
      if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = items.length - 1;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        items[nextIndex].focus();
      }
    });

    menu?.addEventListener("click", (event) => {
      const item = event.target.closest('[role^="menuitem"]');
      if (!item) return;

      if (item.matches("[data-dropdown-option]")) {
        const label = item.dataset.label;
        const labelTarget = trigger?.querySelector("[data-dropdown-label]");

        if (label && labelTarget) labelTarget.textContent = label;

        getItems(dropdown).forEach((option) => {
          const isSelected = option === item;
          option.classList.toggle("is-selected", isSelected);
          option.setAttribute("aria-checked", String(isSelected));
        });
      }

      closeDropdown(dropdown, true);
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openDropdowns = dropdowns.filter((dropdown) => dropdown.classList.contains("is-open"));
    openDropdowns.forEach((dropdown) => closeDropdown(dropdown, true));
  });

  window.addEventListener("resize", () => closeAll());
  document.addEventListener("scroll", () => closeAll(), true);

  /* ==========================================================================
     Footer Interactivity
     ========================================================================== */
  // 1. Smooth Back to Top
  const backToTopBtn = document.getElementById("back-to-top");
  backToTopBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 2. Newsletter Subscription with Validation and State
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterSubmitBtn = document.getElementById("newsletter-submit-btn");
  const newsletterFeedback = document.getElementById("newsletter-feedback");

  if (newsletterForm && newsletterEmail && newsletterFeedback && newsletterSubmitBtn) {
    const showFeedback = (message, type) => {
      newsletterFeedback.textContent = message;
      newsletterFeedback.className = `newsletter-feedback is-${type}`;
    };

    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = newsletterEmail.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showFeedback("Please enter your email address.", "error");
        newsletterEmail.focus();
        return;
      }

      if (!emailPattern.test(email)) {
        showFeedback("Please enter a valid email address (e.g. name@example.com).", "error");
        newsletterEmail.focus();
        return;
      }

      newsletterSubmitBtn.classList.add("is-loading");
      newsletterSubmitBtn.disabled = true;
      newsletterEmail.disabled = true;

      // Simulate API call
      setTimeout(() => {
        newsletterSubmitBtn.classList.remove("is-loading");
        newsletterSubmitBtn.disabled = false;
        newsletterEmail.disabled = false;
        newsletterEmail.value = "";
        showFeedback("🎉 Welcome to the Club! Use promo code WELCOME15 for 15% off your next purchase.", "success");
      }, 650);
    });
  }

  // 3. Mobile Footer Accordion
  const footerCols = [...document.querySelectorAll("[data-footer-accordion]")];
  footerCols.forEach((col) => {
    const headerBtn = col.querySelector(".footer-col-header");
    if (!headerBtn) return;

    headerBtn.addEventListener("click", () => {
      if (window.innerWidth > 768) return;
      const isOpen = col.classList.contains("is-open");

      col.classList.toggle("is-open", !isOpen);
      headerBtn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
})();

/* ============================================================
   Product Slider – Prev / Next / Drag / Dots
   ============================================================ */
(() => {
  const track     = document.getElementById("product-slider-track");
  const viewport  = document.getElementById("product-slider-viewport");
  const btnPrev   = document.getElementById("slider-prev");
  const btnNext   = document.getElementById("slider-next");
  const dotsWrap  = document.getElementById("slider-dots");

  if (!track || !viewport || !btnPrev || !btnNext || !dotsWrap) return;

  const cards     = [...track.querySelectorAll(".slider-card")];
  const GAP       = 18; // must match CSS gap
  let currentIdx  = 0;

  // How many cards are visible at once?
  const visibleCount = () => {
    const vw = viewport.offsetWidth;
    const cw = cards[0] ? cards[0].offsetWidth + GAP : 238;
    return Math.max(1, Math.floor(vw / cw));
  };

  const totalPages = () => Math.ceil(cards.length / visibleCount());
  const currentPage = () => Math.floor(currentIdx / visibleCount());

  /* Build pagination dots */
  const buildDots = () => {
    dotsWrap.innerHTML = "";
    const pages = totalPages();
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement("button");
      dot.className = "slider-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Page ${i + 1} of ${pages}`);
      dot.dataset.page = i;
      dot.addEventListener("click", () => goToPage(i));
      dotsWrap.appendChild(dot);
    }
  };

  const updateDots = () => {
    const page = currentPage();
    [...dotsWrap.querySelectorAll(".slider-dot")].forEach((d, i) => {
      d.classList.toggle("is-active", i === page);
    });
  };

  const updateButtons = () => {
    btnPrev.disabled = currentIdx === 0;
    btnNext.disabled = currentIdx >= cards.length - visibleCount();
  };

  const goToIndex = (idx) => {
    const maxIdx = Math.max(0, cards.length - visibleCount());
    currentIdx = Math.min(maxIdx, Math.max(0, idx));
    const card = cards[currentIdx];
    const offset = card ? card.offsetLeft : 0;
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
    updateButtons();
  };

  const goToPage = (page) => {
    goToIndex(page * visibleCount());
  };

  btnNext.addEventListener("click", () => goToIndex(currentIdx + visibleCount()));
  btnPrev.addEventListener("click", () => goToIndex(currentIdx - visibleCount()));

  /* Drag-to-scroll */
  let dragStart = null;
  let dragStartIdx = null;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragStart    = e.clientX;
    dragStartIdx = currentIdx;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (dragStart === null) return;
    const delta = dragStart - e.clientX;
    const card  = cards[0];
    if (!card) return;
    const cardW = card.offsetWidth + GAP;
    const shifted = Math.round(delta / cardW);
    const target = Math.min(
      Math.max(0, dragStartIdx + shifted),
      cards.length - visibleCount()
    );
    // Live feedback without easing
    const liveOffset = cards[target] ? cards[target].offsetLeft : 0;
    track.style.transition = "none";
    track.style.transform   = `translateX(-${liveOffset}px)`;
    currentIdx = target;
  });

  viewport.addEventListener("pointerup", () => {
    if (dragStart === null) return;
    track.style.transition = "";
    goToIndex(currentIdx);
    dragStart    = null;
          option.setAttribute("aria-checked", String(isSelected));
        });
      }

      closeDropdown(dropdown, true);
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openDropdowns = dropdowns.filter((dropdown) => dropdown.classList.contains("is-open"));
    openDropdowns.forEach((dropdown) => closeDropdown(dropdown, true));
  });

  window.addEventListener("resize", () => closeAll());
  document.addEventListener("scroll", () => closeAll(), true);

  /* ==========================================================================
     Footer Interactivity
     ========================================================================== */
  // 1. Smooth Back to Top
  const backToTopBtn = document.getElementById("back-to-top");
  backToTopBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 2. Newsletter Subscription with Validation and State
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterSubmitBtn = document.getElementById("newsletter-submit-btn");
  const newsletterFeedback = document.getElementById("newsletter-feedback");

  if (newsletterForm && newsletterEmail && newsletterFeedback && newsletterSubmitBtn) {
    const showFeedback = (message, type) => {
      newsletterFeedback.textContent = message;
      newsletterFeedback.className = `newsletter-feedback is-${type}`;
    };

    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = newsletterEmail.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showFeedback("Please enter your email address.", "error");
        newsletterEmail.focus();
        return;
      }

      if (!emailPattern.test(email)) {
        showFeedback("Please enter a valid email address (e.g. name@example.com).", "error");
        newsletterEmail.focus();
        return;
      }

      newsletterSubmitBtn.classList.add("is-loading");
      newsletterSubmitBtn.disabled = true;
      newsletterEmail.disabled = true;

      // Simulate API call
      setTimeout(() => {
        newsletterSubmitBtn.classList.remove("is-loading");
        newsletterSubmitBtn.disabled = false;
        newsletterEmail.disabled = false;
        newsletterEmail.value = "";
        showFeedback("🎉 Welcome to the Club! Use promo code WELCOME15 for 15% off your next purchase.", "success");
      }, 650);
    });
  }

  // 3. Mobile Footer Accordion
  const footerCols = [...document.querySelectorAll("[data-footer-accordion]")];
  footerCols.forEach((col) => {
    const headerBtn = col.querySelector(".footer-col-header");
    if (!headerBtn) return;

    headerBtn.addEventListener("click", () => {
      if (window.innerWidth > 768) return;
      const isOpen = col.classList.contains("is-open");

      col.classList.toggle("is-open", !isOpen);
      headerBtn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
})();

/* ============================================================
   Product Slider – Prev / Next / Drag / Dots
   ============================================================ */
(() => {
  const track     = document.getElementById("product-slider-track");
  const viewport  = document.getElementById("product-slider-viewport");
  const btnPrev   = document.getElementById("slider-prev");
  const btnNext   = document.getElementById("slider-next");
  const dotsWrap  = document.getElementById("slider-dots");

  if (!track || !viewport || !btnPrev || !btnNext || !dotsWrap) return;

  const cards     = [...track.querySelectorAll(".slider-card")];
  const GAP       = 18; // must match CSS gap
  let currentIdx  = 0;

  // How many cards are visible at once?
  const visibleCount = () => {
    const vw = viewport.offsetWidth;
    const cw = cards[0] ? cards[0].offsetWidth + GAP : 238;
    return Math.max(1, Math.floor(vw / cw));
  };

  const totalPages = () => Math.ceil(cards.length / visibleCount());
  const currentPage = () => Math.floor(currentIdx / visibleCount());

  /* Build pagination dots */
  const buildDots = () => {
    dotsWrap.innerHTML = "";
    const pages = totalPages();
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement("button");
      dot.className = "slider-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Page ${i + 1} of ${pages}`);
      dot.dataset.page = i;
      dot.addEventListener("click", () => goToPage(i));
      dotsWrap.appendChild(dot);
    }
  };

  const updateDots = () => {
    const page = currentPage();
    [...dotsWrap.querySelectorAll(".slider-dot")].forEach((d, i) => {
      d.classList.toggle("is-active", i === page);
    });
  };

  const updateButtons = () => {
    btnPrev.disabled = currentIdx === 0;
    btnNext.disabled = currentIdx >= cards.length - visibleCount();
  };

  const goToIndex = (idx) => {
    const maxIdx = Math.max(0, cards.length - visibleCount());
    currentIdx = Math.min(maxIdx, Math.max(0, idx));
    const card = cards[currentIdx];
    const offset = card ? card.offsetLeft : 0;
    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
    updateButtons();
  };

  const goToPage = (page) => {
    goToIndex(page * visibleCount());
  };

  btnNext.addEventListener("click", () => goToIndex(currentIdx + visibleCount()));
  btnPrev.addEventListener("click", () => goToIndex(currentIdx - visibleCount()));

  /* Drag-to-scroll */
  let dragStart = null;
  let dragStartIdx = null;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragStart    = e.clientX;
    dragStartIdx = currentIdx;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (dragStart === null) return;
    const delta = dragStart - e.clientX;
    const card  = cards[0];
    if (!card) return;
    const cardW = card.offsetWidth + GAP;
    const shifted = Math.round(delta / cardW);
    const target = Math.min(
      Math.max(0, dragStartIdx + shifted),
      cards.length - visibleCount()
    );
    // Live feedback without easing
    const liveOffset = cards[target] ? cards[target].offsetLeft : 0;
    track.style.transition = "none";
    track.style.transform   = `translateX(-${liveOffset}px)`;
    currentIdx = target;
  });

  viewport.addEventListener("pointerup", () => {
    if (dragStart === null) return;
    track.style.transition = "";
    goToIndex(currentIdx);
    dragStart    = null;
    dragStartIdx = null;
    updateDots();
    updateButtons();
  });

  /* Keyboard nav */
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goToIndex(currentIdx + 1);
    if (e.key === "ArrowLeft")  goToIndex(currentIdx - 1);
  });

  /* ── Mouse-wheel / Trackpad scroll ──────────────────────────
     Scroll vertically or horizontally over the slider to move
     one card at a time. Debounced so one wheel tick = one step.
  ────────────────────────────────────────────────────────────── */
  let wheelTimer = null;

  viewport.addEventListener("wheel", (e) => {
    // Only hijack when cursor is over the slider
    e.preventDefault();

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      // Support both horizontal (trackpad) and vertical (mouse wheel) axis
      const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta > 0) {
        goToIndex(currentIdx + 1);
      } else if (delta < 0) {
        goToIndex(currentIdx - 1);
      }
    }, 60); // 60ms debounce — prevents runaway scrolling on fast wheels
  }, { passive: false });

  /* ── Hover scroll-hint tooltip ─────────────────────────────
     Shows a brief "Scroll to browse" hint on the first hover
     then never appears again (sessionStorage flag).
  ────────────────────────────────────────────────────────────── */
  if (!sessionStorage.getItem("sliderHintSeen")) {
    const hint = document.createElement("div");
    hint.id = "slider-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/><path d="M19 12H5M12 19l-7-7 7-7" opacity=".35"/></svg>
      <span>Scroll or drag to browse</span>`;
    document.body.appendChild(hint);

    const showHint = () => {
      const r = viewport.getBoundingClientRect();
      hint.style.top  = `${r.top  + r.height / 2}px`;
      hint.style.left = `${r.left + r.width  / 2}px`;
      hint.classList.add("is-visible");
      viewport.removeEventListener("mouseenter", showHint);
      setTimeout(() => {
        hint.classList.remove("is-visible");
        setTimeout(() => hint.remove(), 300);
      }, 2000);
      sessionStorage.setItem("sliderHintSeen", "1");
    };
    viewport.addEventListener("mouseenter", showHint);
  }

  /* Init + re-init on resize */
  buildDots();
  updateButtons();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goToIndex(0);
    }, 200);
  });
})();

/* ============================================================
   Today's Deals Countdown – counts down to midnight
   ============================================================ */
(() => {
  const elH = document.getElementById("cnt-h");
  const elM = document.getElementById("cnt-m");
  const elS = document.getElementById("cnt-s");
  if (!elH || !elM || !elS) return;

  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const now  = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight - now) / 1000));

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    // Animate only when value changes
    const update = (el, val) => {
      const str = pad(val);
      if (el.textContent !== str) {
        el.style.transform = "translateY(-4px)";
        el.style.opacity   = "0.4";
        requestAnimationFrame(() => {
          el.textContent = str;
          el.style.transition = "transform 160ms ease, opacity 160ms ease";
          el.style.transform  = "translateY(0)";
          el.style.opacity    = "1";
        });
      }
    };

    update(elH, h);
    update(elM, m);
    update(elS, s);
  };

  tick();
  setInterval(tick, 1000);
})();
