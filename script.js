/* ============================================================
   Coast Edge Electrical — landing page behaviour
   Plain vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIG
     ---------------------------------------------------------- */

  // Show the top emergency-callout bar? (README: showAnnouncementBar)
  var SHOW_ANNOUNCEMENT_BAR = true;

  // Where should quote enquiries go?
  //   • Leave as "" to use the built-in mailto fallback (opens the visitor's
  //     email app pre-filled to admin@coastedge.com.au — works with no backend).
  //   • For a proper hosted form, paste a Formspree / Basin / serverless endpoint
  //     here (POST, expects JSON). e.g. "https://formspree.io/f/xxxxxxx"
  var FORM_ENDPOINT = "/api/contact";
  var OWNER_EMAIL = "admin@coastedge.com.au";

  // Live Google reviews come from this serverless endpoint (see api/reviews.js).
  // Until it's deployed & configured with a Google key + Place ID, the public
  // site shows NO reviews (never the placeholder samples) — the sample cards
  // below appear only on localhost so the design can still be previewed.
  var REVIEWS_ENDPOINT = "/api/reviews";

  /* ----------------------------------------------------------
     DATA
     ---------------------------------------------------------- */

  // Real Google reviews for Coast Edge Electrical (all 5-star), shown on the live site.
  // If the Google reviews API is later configured (REVIEWS_ENDPOINT), live data
  // takes over automatically; otherwise these show. `meta` = the job done.
  var reviews = [
    { quote: "Our new downlights, exhaust fan and wall switches look fantastic. Josh was conscientious, methodical and paid close attention to every detail — an absolute pleasure to deal with. Wouldn't hesitate to recommend.", name: "Lindsey Hebell", meta: "Downlights & switches" },
    { quote: "Josh installed our EV charger and the quality of work was exceptional. We've had him back for extra power points and will keep using Coast Edge Electrical for all our needs. Highly recommend.", name: "Timothy King", meta: "EV charger install" },
    { quote: "Josh was very professional and completed the jobs to a high standard. Refreshing to deal with a tradesperson who genuinely takes pride in their work. No hesitation recommending Coast Edge Electrical.", name: "Eidyn Williams", meta: "Renovation electrical" },
    { quote: "Helpful, respectful, responsive and always punctual. Honest, hardworking and takes pride in his work. Completed everything professionally and on time — highly recommend.", name: "Rishi Rayamajhi", meta: "General electrical" },
    { quote: "Josh is great at communication, professional and clean in his work, and an easy bloke to get along with. Will definitely keep using his services.", name: "Shane Wright", meta: "General electrical" },
    { quote: "Josh was quick to respond and provided clean, excellent work when we had our air-con installed. Definitely will use his services again!", name: "Bailey McCoist", meta: "Air-con install" },
    { quote: "Josh installed 10 cameras for us recently. Quick to quote, clean and tidy, and completed the work quickly. Would absolutely recommend!", name: "Connor Thomas", meta: "Security cameras" },
    { quote: "Josh is always friendly, knowledgeable and efficient. Always great to deal with.", name: "Keiren Kennedy", meta: "General electrical" },
    { quote: "Coast Edge has done a number of jobs for me — excellent work every time. Would highly recommend!", name: "Ayden Kelly", meta: "Repeat customer" }
  ];

  // service icon = sprite symbol id; form = value set in the "What do you need?" select
  var services = [
    { icon: "i-wrench", title: "General repairs",         body: "Faults, power points, safety switches and those niggling jobs on the to-do list.", form: "General electrical repairs" },
    { icon: "i-zap",    title: "Switchboard upgrades",    body: "Modern boards with safety switches to protect your home and meet current standards.", form: "Switchboard upgrade" },
    { icon: "i-bulb",   title: "Lighting design",         body: "Downlights, feature and outdoor lighting planned and installed to suit your space.", form: "Lighting installation" },
    { icon: "i-sun",    title: "Solar & battery",         body: "Cut your power bill with quality solar and battery systems, sized right for you.", form: "Solar & battery" },
    { icon: "i-car",    title: "EV chargers",             body: "Fast, safe home and workplace EV charger installation by certified installers.", form: "EV charger" },
    { icon: "i-siren",  title: "Emergency callouts",      body: "Power out, sparking or something not right? Call any time — we'll get you safe and back on fast.", form: "Emergency callout", emergency: true },
    { icon: "i-wifi",   title: "Data & networking",       body: "Reliable data cabling, Wi-Fi and networking for home offices and businesses.", form: "Data & networking" },
    { icon: "i-shield-check", title: "Safety inspections", body: "Compliance checks and safety reports for homes, rentals and commercial sites.", form: "Safety inspection" },
    { icon: "i-hammer", title: "Renovations & rewiring",  body: "Rewiring, extensions and new builds — from first-fix planning to final fit-off.", form: "Renovations & rewiring" }
  ];

  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icon(id, cls) {
    return '<svg class="' + (cls || "ico") + '"><use href="#' + id + '"/></svg>';
  }
  function initial(name) { return name.trim().charAt(0).toUpperCase(); }

  /* ----------------------------------------------------------
     ANNOUNCEMENT BAR
     ---------------------------------------------------------- */
  if (!SHOW_ANNOUNCEMENT_BAR) {
    var bar = el("announce");
    if (bar) bar.remove();
  }

  /* ----------------------------------------------------------
     REVIEWS MARQUEE  (data duplicated so the -50% loop is seamless)
     ---------------------------------------------------------- */
  // Normalise either source into { quote, name, meta, rating }.
  // Live reviews carry `meta` (relative time); placeholders carry `suburb`.
  function normalizeReview(r) {
    return {
      quote: r.quote,
      name: r.name,
      meta: r.meta != null ? r.meta : (r.suburb || ""),
      rating: r.rating || 5,
    };
  }
  function starRow(rating) {
    var n = Math.max(0, Math.min(5, Math.round(Number(rating) || 5)));
    var s = "";
    for (var i = 0; i < 5; i++) s += icon("i-star", "ico ico-fill" + (i < n ? "" : " st-off"));
    return s;
  }
  function reviewCard(r) {
    return (
      '<figure class="card review-card">' +
        '<div class="review-head">' +
          '<div class="review-stars" aria-label="' + (r.rating || 5) + ' out of 5 stars">' + starRow(r.rating) + '</div>' +
          icon("i-google", "ico-google") +
        '</div>' +
        '<p class="review-quote">&ldquo;' + esc(r.quote) + '&rdquo;</p>' +
        '<figcaption class="review-foot">' +
          '<span class="review-avatar" aria-hidden="true">' + esc(initial(r.name)) + '</span>' +
          '<span class="review-name"><b>' + esc(r.name) + '</b><span>' + esc(r.meta) + '</span></span>' +
        '</figcaption>' +
      '</figure>'
    );
  }
  function renderReviewList(list) {
    var track = el("reviews-track");
    var section = document.querySelector(".reviews");
    if (!track) return;
    if (!list.length) { if (section) section.style.display = "none"; return; }
    var loop = list.concat(list); // duplicate for seamless scroll
    track.innerHTML = loop.map(reviewCard).join("");
    // Duplicated clones are decorative — hide them from screen readers.
    var half = list.length, cards = track.children;
    for (var i = half; i < cards.length; i++) cards[i].setAttribute("aria-hidden", "true");
    startMarquee(track);
  }
  // JS-driven marquee: CSS animations freeze on iOS with Reduce Motion /
  // Low Power Mode, so drive the scroll with requestAnimationFrame instead.
  function startMarquee(track) {
    track.style.animation = "none";
    var x = 0, last = null, paused = false;
    var marquee = track.parentElement;
    if (marquee) {
      marquee.addEventListener("mouseenter", function () { paused = true; });
      marquee.addEventListener("mouseleave", function () { paused = false; });
    }
    function step(ts) {
      if (last === null) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.1); // clamp tab-switch jumps
      last = ts;
      if (!paused) {
        var half = track.scrollWidth / 2;
        if (half > 0) {
          x -= (half / 46) * dt; // full loop every 46s, same as the CSS version
          if (-x >= half) x += half;
          track.style.transform = "translateX(" + x + "px)";
        }
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  (function loadReviews() {
    function fallback() {
      // Real reviews (above) — shown whenever the live API isn't returning data.
      renderReviewList(reviews.map(normalizeReview));
    }

    if (!REVIEWS_ENDPOINT) { fallback(); return; }
    fetch(REVIEWS_ENDPOINT, { headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var live = (data && data.reviews) ? data.reviews : [];
        if (live.length) renderReviewList(live.map(normalizeReview));
        else fallback();
      })
      .catch(fallback);
  })();

  /* ----------------------------------------------------------
     SCROLL REVEAL — sections/cards rise & fade in as you scroll
     ---------------------------------------------------------- */
  (function setupReveal() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var singles = document.querySelectorAll(".section-head, .services-head, .contact-panel");
    var groups = document.querySelectorAll(".grid-4, .grid-3");

    if (reduce || !("IntersectionObserver" in window)) {
      // Show everything immediately.
      singles.forEach(function (e) { e.classList.add("in-view"); });
      groups.forEach(function (e) { e.classList.add("in-view"); });
      return;
    }
    singles.forEach(function (e) { e.classList.add("reveal"); });
    groups.forEach(function (e) { e.classList.add("reveal-stagger"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    singles.forEach(function (e) { io.observe(e); });
    groups.forEach(function (e) { io.observe(e); });
  })();

  /* ----------------------------------------------------------
     SERVICES  (click / Enter / Space → prefill form + smooth scroll)
     ---------------------------------------------------------- */
  function selectService(value) {
    var sel = el("f-service");
    if (sel) sel.value = value;
  }
  function scrollToContact() {
    var c = el("contact");
    if (!c) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // scrollIntoView respects the section's CSS scroll-margin-top (sits below the nav)
    c.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  function pickService(value) {
    selectService(value);
    scrollToContact();
  }

  /* Emergency popup — the Emergency callouts card opens this instead of the quote form. */
  var emgModal = null;
  function emgKey(e) { if (e.key === "Escape") closeEmergency(); }
  function closeEmergency() {
    if (emgModal) emgModal.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", emgKey);
  }
  function openEmergency() {
    if (!emgModal) {
      emgModal = document.createElement("div");
      emgModal.className = "emg-overlay";
      emgModal.setAttribute("role", "dialog");
      emgModal.setAttribute("aria-modal", "true");
      emgModal.setAttribute("aria-label", "24/7 emergency callouts");
      emgModal.innerHTML =
        '<div class="emg-card">' +
          '<button class="emg-close" type="button" aria-label="Close">' + icon("i-x", "ico") + '</button>' +
          '<div class="emg-ico">' + icon("i-siren", "ico") + '</div>' +
          '<h3>24/7 emergency callouts</h3>' +
          '<p>Power out, sparking, or something not right? Call us any time — we&rsquo;ll get you safe and sorted, fast.</p>' +
          '<a class="emg-call" href="tel:0421165502">' + icon("i-phone", "ico") + 'Call 0421 165 502</a>' +
        '</div>';
      document.body.appendChild(emgModal);
      emgModal.addEventListener("click", function (e) { if (e.target === emgModal) closeEmergency(); });
      emgModal.querySelector(".emg-close").addEventListener("click", closeEmergency);
    }
    emgModal.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", emgKey);
  }
  function activateCard(card) {
    if (card.getAttribute("data-emergency")) openEmergency();
    else pickService(card.getAttribute("data-service"));
  }

  (function renderServices() {
    var grid = el("services-grid");
    if (!grid) return;
    grid.innerHTML = services.map(function (s) {
      var emg = s.emergency;
      return (
        '<div class="card svc" role="button" tabindex="0" data-service="' + esc(s.form) + '"' +
             (emg ? ' data-emergency="1"' : '') +
             ' aria-label="' + (emg ? "Emergency callouts — call any time" : "Get a quote for " + esc(s.title)) + '">' +
          '<div class="svc-head">' +
            icon(s.icon, "ico svc-ic") +
            icon(emg ? "i-phone" : "i-arrow-ur", "ico svc-arrow") +
          '</div>' +
          '<div class="card-title">' + esc(s.title) + '</div>' +
          '<p class="card-body">' + esc(s.body) + '</p>' +
          '<span class="svc-link">' + (emg ? "Call us any time &rarr;" : "Get a quote for this &rarr;") + '</span>' +
        '</div>'
      );
    }).join("");

    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".svc");
      if (card) activateCard(card);
    });
    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      var card = e.target.closest(".svc");
      if (card) { e.preventDefault(); activateCard(card); }
    });
  })();

  /* ----------------------------------------------------------
     CONTACT FORM  — validation + submit (endpoint or mailto fallback)
     ---------------------------------------------------------- */
  (function wireForm() {
    var form = el("quote-form");
    if (!form) return;
    var statusEl = el("form-status");
    var submitBtn = el("form-submit");

    function setError(field, msg) {
      var input = form.elements[field];
      var slot = form.querySelector('[data-error-for="' + field + '"]');
      if (slot) slot.textContent = msg || "";
      if (input) {
        if (msg) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    }
    function clearStatus() { if (statusEl) { statusEl.textContent = ""; statusEl.className = "form-status"; } }
    function showStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = "form-status" + (isError ? " error" : "");
    }

    function validate() {
      var ok = true;
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      if (!name) { setError("name", "Please enter your name."); ok = false; } else setError("name", "");
      // AU phone: at least 8 digits (allow spaces, +, brackets, dashes)
      var digits = phone.replace(/[^\d]/g, "");
      if (!phone) { setError("phone", "Please enter a phone number."); ok = false; }
      else if (digits.length < 8) { setError("phone", "That doesn't look like a valid phone number."); ok = false; }
      else setError("phone", "");
      // Email is optional, but if given it must look valid.
      var email = form.elements.email ? form.elements.email.value.trim() : "";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("email", "Please check your email address."); ok = false; }
      else setError("email", "");
      return ok;
    }

    // live-clear errors as the user types
    ["name", "phone", "email"].forEach(function (f) {
      if (!form.elements[f]) return;
      form.elements[f].addEventListener("input", function () {
        if (form.elements[f].getAttribute("aria-invalid")) setError(f, "");
      });
    });

    function collect() {
      return {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email ? form.elements.email.value.trim() : "",
        suburb: form.elements.suburb.value.trim(),
        service: form.elements.service.value,
        message: form.elements.message.value.trim(),
        company: form.elements.company ? form.elements.company.value : "" // honeypot
      };
    }

    function showSuccess() {
      var wrap = el("form-wrap");
      if (!wrap) return;
      wrap.innerHTML =
        '<div class="form-success">' +
          '<div class="success-ico">' + icon("i-check-circle", "ico ico-fill") + '</div>' +
          '<h3>Thanks — message received!</h3>' +
          '<p>We&rsquo;ll be in touch shortly. For anything urgent, call us on ' +
            '<a href="tel:0421165502">0421 165 502</a>.</p>' +
        '</div>';
    }

    function mailtoFallback(data) {
      var subject = "Quote request — " + data.service;
      var body =
        "Name: " + data.name + "\n" +
        "Phone: " + data.phone + "\n" +
        "Suburb: " + (data.suburb || "-") + "\n" +
        "Service: " + data.service + "\n\n" +
        "Details:\n" + (data.message || "-") + "\n";
      window.location.href = "mailto:" + OWNER_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      showSuccess();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();
      if (!validate()) {
        showStatus("Please fix the highlighted fields.", true);
        return;
      }
      var data = collect();

      // No backend (or running locally where the function isn't available) →
      // open the visitor's email app, pre-filled.
      var isLocal = location.protocol === "file:" ||
        /^(localhost|127\.|0\.0\.0\.0|::1|\[::1\])/.test(location.hostname);
      if (!FORM_ENDPOINT || isLocal) { mailtoFallback(data); return; }

      // Hosted endpoint path (Formspree/Basin/serverless).
      submitBtn.disabled = true;
      var originalHTML = submitBtn.innerHTML;
      submitBtn.textContent = "Sending…";
      showStatus("");

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed: " + res.status);
          showSuccess();
        })
        .catch(function () {
          // Real send failed — never fake a success (a lost lead is worse than
          // an honest error). Tell them how to reach us directly.
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
          showStatus("Sorry — that didn't go through. Please call 0421 165 502 or email admin@coastedge.com.au.", true);
        });
    });
  })();
})();
