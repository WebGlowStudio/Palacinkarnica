(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("navigacija");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-shrunk", window.scrollY > 16);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setNav(open) {
    if (!toggle || !header) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    var label = toggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Zatvori meni" : "Otvori meni";
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setNav(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 900) setNav(false);
  });

  var links = document.querySelectorAll('.nav a[href^="#"]');
  var sections = [];
  links.forEach(function (link) {
    if (link.classList.contains("btn")) return;
    var id = link.getAttribute("href").slice(1);
    var section = document.getElementById(id);
    if (section) sections.push({ link: link, section: section });
  });

  if ("IntersectionObserver" in window && sections.length) {
    var currentObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.filter(function (item) {
            return item.section === entry.target;
          })[0];
          if (!match) return;
          if (entry.isIntersecting) {
            sections.forEach(function (item) {
              item.link.removeAttribute("aria-current");
            });
            match.link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (item) {
      currentObserver.observe(item.section);
    });
  }

  var floaters = Array.prototype.slice.call(document.querySelectorAll(".floater"));
  var pointer = { x: 0, y: 0 };
  var parallaxPending = false;

  function paintParallax() {
    parallaxPending = false;
    var y = window.scrollY || 0;
    floaters.forEach(function (el) {
      var depth = Number(el.dataset.depth) || 12;
      var speed = Number(el.dataset.speed) || 0;
      var tx = pointer.x * depth;
      var ty = pointer.y * depth * 0.65 - y * speed;
      el.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
    });
  }

  function requestParallax() {
    if (reduce || parallaxPending) return;
    parallaxPending = true;
    window.requestAnimationFrame(paintParallax);
  }

  if (!reduce && floaters.length) {
    window.addEventListener("scroll", requestParallax, { passive: true });
    if (finePointer) {
      window.addEventListener(
        "mousemove",
        function (event) {
          pointer.x = event.clientX / window.innerWidth - 0.5;
          pointer.y = event.clientY / window.innerHeight - 0.5;
          requestParallax();
        },
        { passive: true }
      );
    }
  }

  document.querySelectorAll(".reveal").forEach(function (el) {
    var siblings = el.parentElement
      ? el.parentElement.querySelectorAll(":scope > .reveal")
      : [];
    var index = Array.prototype.indexOf.call(siblings, el);
    if (index > 0) el.style.setProperty("--d", Math.min(index, 8) * 70 + "ms");
  });

  if (reduce || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".menu-card"));
  var grid = document.getElementById("menu-grid");
  var glider = document.querySelector(".tab-glider");
  var filters = document.querySelector(".filters");
  var filterToken = 0;

  function moveGlider(tab) {
    if (!glider || !filters || !tab) return;
    glider.style.width = tab.offsetWidth + "px";
    glider.style.transform = "translateX(" + (tab.offsetLeft - filters.scrollLeft) + "px)";
    filters.classList.add("is-ready");
  }

  function showCards(category, animate) {
    cards.forEach(function (card, index) {
      var match = card.dataset.cat === category;
      card.classList.remove("is-leaving", "is-entering");
      card.classList.toggle("is-shown", match);
      if (match && animate && !reduce) {
        card.classList.add("is-entering");
        window.setTimeout(function () {
          card.classList.remove("is-entering");
        }, 40 + index * 30);
      }
      if (match) card.classList.add("is-in");
    });
  }

  function applyFilter(tab, animate) {
    var category = tab.dataset.filter;
    var token = ++filterToken;
    tabs.forEach(function (item) {
      var on = item === tab;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.tabIndex = on ? 0 : -1;
    });
    if (grid) grid.setAttribute("aria-labelledby", tab.id);
    moveGlider(tab);

    var leaving = cards.filter(function (card) {
      return card.classList.contains("is-shown") && card.dataset.cat !== category;
    });

    if (!animate || reduce || !leaving.length) {
      showCards(category, animate);
      return;
    }

    leaving.forEach(function (card) {
      card.classList.add("is-leaving");
    });

    window.setTimeout(function () {
      if (token !== filterToken) return;
      showCards(category, true);
    }, 220);
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      if (tab.getAttribute("aria-selected") === "true") return;
      applyFilter(tab, true);
    });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      var next =
        event.key === "ArrowRight"
          ? (index + 1) % tabs.length
          : (index - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      applyFilter(tabs[next], true);
    });
  });

  if (tabs[0]) moveGlider(tabs[0]);
  window.addEventListener("resize", function () {
    var active = tabs.filter(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    })[0];
    moveGlider(active || tabs[0]);
  });

  var builder = document.getElementById("builder");
  var totalEl = document.getElementById("builder-total");
  var lineEl = document.getElementById("preview-line");
  var dotsEl = document.getElementById("mini-dots");

  function formatRsd(value) {
    return value.toLocaleString("sr-RS") + " RSD";
  }

  function updateBuilder() {
    if (!builder || !totalEl || !lineEl) return;
    var base = builder.querySelector('input[name="baza"]:checked');
    var sum = base ? Number(base.value) : 0;
    var names = base ? [base.dataset.label] : [];
    var kinds = [];
    builder.querySelectorAll('input[type="checkbox"]:checked').forEach(function (box) {
      sum += Number(box.dataset.price) || 0;
      names.push(box.dataset.label);
      kinds.push(box.dataset.kind || "sweet");
    });
    totalEl.textContent = formatRsd(sum);
    lineEl.textContent = names.join(", ");
    if (!reduce) {
      totalEl.classList.remove("pop");
      void totalEl.offsetWidth;
      totalEl.classList.add("pop");
    }
    if (!dotsEl) return;
    dotsEl.replaceChildren();
    kinds.forEach(function (kind, i) {
      var dot = document.createElement("span");
      dot.className = "dot dot-" + kind;
      dot.style.setProperty("--a", (i * 42 - 30) + "deg");
      dotsEl.appendChild(dot);
    });
  }

  if (builder) {
    builder.addEventListener("change", updateBuilder);
    updateBuilder();
  }

  var orderThis = document.querySelector(".builder-preview .btn");
  if (orderThis && lineEl) {
    orderThis.addEventListener("click", function () {
      var note = document.getElementById("poruka");
      if (note) note.value = lineEl.textContent;
    });
  }

  var hourRows = document.querySelectorAll(".hours li");
  var openState = document.getElementById("open-state");

  try {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Belgrade",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    var bag = {};
    parts.forEach(function (part) {
      bag[part.type] = part.value;
    });
    var minutes = Number(bag.hour) * 60 + Number(bag.minute);
    hourRows.forEach(function (row) {
      var days = (row.dataset.days || "").split(" ");
      if (days.indexOf(bag.weekday) === -1) return;
      row.classList.add("is-today");
      var open = (row.dataset.open || "00:00").split(":");
      var close = (row.dataset.close || "00:00").split(":");
      var start = Number(open[0]) * 60 + Number(open[1]);
      var end = Number(close[0]) * 60 + Number(close[1]);
      var isOpen = minutes >= start && minutes < end;
      if (openState) {
        openState.hidden = false;
        openState.textContent = isOpen ? "Sada otvoreno" : "Sada zatvoreno";
        openState.classList.toggle("is-closed", !isOpen);
      }
    });
  } catch (err) {
    if (openState) openState.hidden = true;
  }

  var form = document.getElementById("order-form");
  var formError = document.getElementById("form-error");
  var success = document.getElementById("form-success");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("ime");
      var phone = document.getElementById("telefon");
      [name, phone].forEach(function (field) {
        if (field) field.classList.remove("is-invalid");
      });
      var nameOk = name && name.value.trim().length > 1;
      var digits = phone ? phone.value.replace(/\D/g, "") : "";
      var phoneOk = digits.length >= 6;
      if (!nameOk && name) name.classList.add("is-invalid");
      if (!phoneOk && phone) phone.classList.add("is-invalid");
      if (!nameOk || !phoneOk) {
        if (formError) formError.hidden = false;
        if (!nameOk && name) name.focus();
        else if (phone) phone.focus();
        return;
      }
      if (formError) formError.hidden = true;
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });
  }

  var year = document.getElementById("godina");
  if (year) {
    try {
      year.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Belgrade",
        year: "numeric"
      }).format(new Date());
    } catch (err) {
      year.textContent = "2026";
    }
  }
})();
