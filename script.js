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
})();
