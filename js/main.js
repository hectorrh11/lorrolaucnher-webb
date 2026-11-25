(function () {
  'use strict';

  var FEEDBACK_MS = 1800;

  function showFeedback(button, state, label) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.textContent.trim();
    }
    if (button._feedbackTimer) {
      window.clearTimeout(button._feedbackTimer);
    }
    button.dataset.state = state;
    button.textContent = label;
    button._feedbackTimer = window.setTimeout(function () {
      button.textContent = button.dataset.originalLabel;
      delete button.dataset.state;
      button._feedbackTimer = null;
    }, FEEDBACK_MS);
  }

  function legacyCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '0';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(field);
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        var card = button.closest('.source');
        var urlElement = card && card.querySelector('.source__url');
        if (!urlElement) return;
        var url = urlElement.textContent.trim();
        copyText(url).then(function (copied) {
          showFeedback(button, copied ? 'ok' : 'error', copied ? 'Copiado' : 'No se pudo');
        });
      });
    });

    var copyAll = document.getElementById('copy-all');
    if (!copyAll) return;
    copyAll.addEventListener('click', function () {
      var urls = [];
      document.querySelectorAll('.source__url').forEach(function (element) {
        urls.push(element.textContent.trim());
      });
      copyText(urls.join('\n')).then(function (copied) {
        showFeedback(copyAll, copied ? 'ok' : 'error', copied ? 'Copiado' : 'No se pudo');
      });
    });
  }

  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    var image = document.getElementById('lightbox-img');
    var caption = document.getElementById('lightbox-caption');
    var closeButton = document.getElementById('lightbox-close');
    var opener = null;

    function open(shot) {
      var shotImage = shot.querySelector('img');
      if (!shotImage) return;
      opener = shot;
      image.src = shotImage.getAttribute('src');
      image.alt = shotImage.getAttribute('alt') || '';
      var figure = shot.closest('figure');
      var figcaption = figure && figure.querySelector('figcaption');
      if (figcaption) {
        caption.textContent = figcaption.textContent.trim();
      } else {
        var step = shot.closest('.step');
        var heading = step && step.querySelector('h3');
        caption.textContent = heading ? heading.textContent.trim() : '';
      }
      lightbox.hidden = false;
      closeButton.focus();
    }

    function close() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      image.removeAttribute('src');
      if (opener) opener.focus();
      opener = null;
    }

    document.querySelectorAll('.zoomable').forEach(function (shot) {
      shot.addEventListener('click', function () { open(shot); });
    });
    closeButton.addEventListener('click', close);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox || event.target.tagName === 'FIGURE') close();
    });

    return {
      close: close,
      isOpen: function () { return !lightbox.hidden; },
      focusClose: function () { closeButton.focus(); }
    };
  }

  function initMenu() {
    var toggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return { close: function () {}, isOpen: function () { return false; } };

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });

    return {
      close: function () {
        if (nav.classList.contains('is-open')) {
          setOpen(false);
          toggle.focus();
        }
      },
      isOpen: function () { return nav.classList.contains('is-open'); }
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lightbox = initLightbox();
    var menu = initMenu();
    initCopyButtons();

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (lightbox.isOpen()) {
          lightbox.close();
        } else if (menu.isOpen()) {
          menu.close();
        }
      }
      if (event.key === 'Tab' && lightbox.isOpen()) {
        event.preventDefault();
        lightbox.focusClose();
      }
    });
  });
})();
