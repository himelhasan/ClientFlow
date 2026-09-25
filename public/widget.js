(function () {
  "use strict";

  // Find the calling script tag to extract configuration
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  const formId = currentScript.getAttribute("data-form");
  if (!formId) {
    console.error("[ClientFlow Widget] Missing data-form attribute on script tag.");
    return;
  }

  const scriptSrc = currentScript.src;
  const baseUrl = scriptSrc ? new URL(scriptSrc).origin : window.location.origin;

  // Create or identify host container
  let container = document.getElementById("clientflow-widget-" + formId);
  if (!container) {
    container = document.createElement("div");
    container.id = "clientflow-widget-" + formId;
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
  }

  // Create isolated responsive iframe to prevent CSS conflicts with host website (Section 12)
  const iframe = document.createElement("iframe");
  iframe.src = `${baseUrl}/f/${formId}?embed=true`;
  iframe.style.width = "100%";
  iframe.style.minHeight = "600px";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.style.transition = "height 0.2s ease";
  iframe.loading = "lazy";
  iframe.setAttribute("scrolling", "no");

  // Listen for resize messages from iframe for seamless responsive height
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "CLIENTFLOW_RESIZE" && event.data.formId === formId) {
      iframe.style.height = event.data.height + "px";
    }
  });

  container.appendChild(iframe);
})();
