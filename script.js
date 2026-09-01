(function () {
  var STORAGE_KEY = "site-lang";

  var translations = {
    en: {
      "nav-about": "About",
      "nav-experience": "Experience",
      "nav-skills": "Skills",
      "nav-contact": "Contact",
      "toggle-label": "ES",
      "toggle-aria": "Switch to Spanish",
      "hero-kicker": "Grand Rapids, MI · Open to remote roles",
      "hero-h1": "Bilingual professional developing web skills & building software.",
      "hero-sub": "Quality & operations professional moving toward data and business analysis — bilingual in English and Spanish, fluent in SAP/EMOS, and currently earning a QuickBooks ProAdvisor certification.",
      "about-h2": "About",
      "about-p1": "Hi there! I am a quality technician at a healthcare packaging corporation. Update: we got fired",
      "about-p2": "I'm bilingual — full professional proficiency in English and Spanish — and I use both daily to keep instructions and corrections clear across a mixed-language floor. I'm now building toward analyst-level data work: closing the accounting gaps in my background through a QuickBooks certification, and rebuilding my web development skills from a partial computer science background at the University of Michigan.",
      "fact-based-label": "Based in",
      "fact-based-value": "Grand Rapids, MI",
      "fact-lang-label": "Languages",
      "fact-lang-value": "English, Spanish — full professional",
      "fact-current-label": "Currently",
      "fact-current-value": "Quality Technician, Oliver Healthcare Packaging",
      "fact-progress-label": "In progress",
      "fact-progress-value": "QuickBooks Online ProAdvisor cert",
      "experience-h2": "Experience",
      "job1-title": "Quality Technician",
      "job1-meta": "Oliver Healthcare Packaging · May 2025 – Present",
      "job1-desc": "Verify product and process quality against spec using SAP/EMOS systems; document deviations; informally cross-train coworkers on quality procedures and system entry.",
      "job2-title": "Warehouse Operator",
      "job2-meta": "Oliver Healthcare Packaging",
      "job2-desc": "Supported inventory movement and warehouse operations ahead of transitioning into the Quality Technician role.",
      "job3-title": "Fulfillment Expert",
      "job3-meta": "Target Corporation",
      "job3-desc": "Handled order fulfillment and fast-paced logistics in a high-volume retail environment.",
      "skills-h2": "Skills",
      "skills-systems-h3": "Systems & tools",
      "skills-systems-p": "SAP · EMOS · Excel (VLOOKUPs, PivotTables)",
      "skills-progress-h3": "In progress",
      "skills-progress-p": "QuickBooks Online ProAdvisor certification · AP/AR & reconciliation practice",
      "skills-lang-h3": "Language",
      "skills-lang-p": "English & Spanish — full professional proficiency, speaking, reading, and writing",
      "skills-academic-h3": "Academic foundation",
      "skills-academic-p": "SQL and Python (coursework-level) · HTML, CSS, JavaScript",
      "contact-h2": "Contact",
      "contact-p": "Reach out about analyst, operations, or bilingual coordination roles.",
      "footer-p": "Built by hand, one project at a time."
    },
    es: {
      "nav-about": "Acerca de",
      "nav-experience": "Experiencia",
      "nav-skills": "Habilidades",
      "nav-contact": "Contacto",
      "toggle-label": "EN",
      "toggle-aria": "Cambiar a inglés",
      "hero-kicker": "Grand Rapids, MI · Disponible para trabajo remoto",
      "hero-h1": "Profesional bilingüe desarrollando habilidades web y creando software.",
      "hero-sub": "Profesional de calidad y operaciones en transición hacia el análisis de datos y de negocios — bilingüe en inglés y español, con dominio de SAP/EMOS, y actualmente cursando la certificación QuickBooks ProAdvisor.",
      "about-h2": "Acerca de",
      "about-p1": "¡Hola! Soy técnico de calidad en una corporación de empaque para el sector de la salud.",
      "about-p2": "Soy bilingüe — dominio profesional completo en inglés y español — y uso ambos idiomas a diario para mantener claras las instrucciones y correcciones en un equipo multilingüe. Ahora me estoy preparando para trabajo de nivel analista en datos: cerrando brechas contables mediante una certificación de QuickBooks, y retomando mis habilidades de desarrollo web a partir de estudios parciales de ciencias de la computación en la Universidad de Michigan.",
      "fact-based-label": "Ubicación",
      "fact-based-value": "Grand Rapids, MI",
      "fact-lang-label": "Idiomas",
      "fact-lang-value": "Inglés, español — dominio profesional completo",
      "fact-current-label": "Actualmente",
      "fact-current-value": "Técnico de Calidad, Oliver Healthcare Packaging",
      "fact-progress-label": "En curso",
      "fact-progress-value": "Certificación QuickBooks Online ProAdvisor",
      "experience-h2": "Experiencia",
      "job1-title": "Técnico de Calidad",
      "job1-meta": "Oliver Healthcare Packaging · Mayo 2025 – Presente",
      "job1-desc": "Verifico la calidad de productos y procesos según especificaciones usando los sistemas SAP/EMOS; documento desviaciones; capacito informalmente a compañeros en procedimientos de calidad y registro en el sistema.",
      "job2-title": "Operador de Almacén",
      "job2-meta": "Oliver Healthcare Packaging",
      "job2-desc": "Apoyé el movimiento de inventario y las operaciones de almacén antes de pasar al puesto de Técnico de Calidad.",
      "job3-title": "Especialista de Cumplimiento de Pedidos",
      "job3-meta": "Target Corporation",
      "job3-desc": "Gestioné el cumplimiento de pedidos y la logística de ritmo acelerado en un entorno minorista de alto volumen.",
      "skills-h2": "Habilidades",
      "skills-systems-h3": "Sistemas y herramientas",
      "skills-systems-p": "SAP · EMOS · Excel (BUSCARV, tablas dinámicas)",
      "skills-progress-h3": "En curso",
      "skills-progress-p": "Certificación QuickBooks Online ProAdvisor · práctica de cuentas por pagar/cobrar y conciliación",
      "skills-lang-h3": "Idioma",
      "skills-lang-p": "Inglés y español — dominio profesional completo: hablado, lectura y escritura",
      "skills-academic-h3": "Formación académica",
      "skills-academic-p": "SQL y Python (nivel universitario) · HTML, CSS, JavaScript",
      "contact-h2": "Contacto",
      "contact-p": "Escríbeme sobre puestos de análisis, operaciones o coordinación bilingüe.",
      "footer-p": "Hecho a mano, un proyecto a la vez."
    }
  };

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle("lang-es", lang === "es");

    var dict = translations[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    var toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.textContent = dict["toggle-label"];
      toggle.setAttribute("aria-label", dict["toggle-aria"]);
    }

    document.title = lang === "es"
      ? "Roberto Jimenez-Martinez — Portafolio"
      : "Roberto Jimenez-Martinez — Portfolio";

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* localStorage unavailable — language just won't persist */
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    applyLanguage(saved === "es" ? "es" : "en");

    var toggle = document.getElementById("langToggle");
    toggle.addEventListener("click", function () {
      var current = document.documentElement.lang === "es" ? "es" : "en";
      applyLanguage(current === "es" ? "en" : "es");
    });
  });
})();
