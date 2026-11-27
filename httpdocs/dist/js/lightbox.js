// Video lightbox for links marked data-lightbox-video. The link's href is the
// video file, so without JS it still plays (the browser opens the file).
// Optional credit line: data-credit-name, data-credit-href, data-credit-text.
(function () {
  var links = document.querySelectorAll('a[data-lightbox-video]');
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;

  var dialog = document.createElement('dialog');
  dialog.className = 'video-lightbox';
  dialog.setAttribute('aria-label', 'Video');
  dialog.innerHTML =
    '<button type="button" class="video-lightbox-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>' +
    '<video autoplay muted loop playsinline controls></video>' +
    '<p class="video-lightbox-caption"></p>';
  document.body.appendChild(dialog);

  var video = dialog.querySelector('video');
  var caption = dialog.querySelector('.video-lightbox-caption');

  function close() { dialog.close(); }

  dialog.querySelector('.video-lightbox-close').addEventListener('click', close);
  // Clicking the backdrop (the dialog element itself, outside its content) closes it.
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  dialog.addEventListener('close', function () {
    // The close event is queued; if another clip was opened since, leave it alone.
    if (dialog.open) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
  });

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab clicks through
      e.preventDefault();
      var img = link.querySelector('img');
      video.poster = img ? img.src : '';
      video.src = link.href;

      caption.textContent = '';
      if (link.dataset.creditName) {
        var a = document.createElement('a');
        a.href = link.dataset.creditHref || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'text-link';
        a.textContent = link.dataset.creditName;
        caption.appendChild(a);
        caption.appendChild(document.createTextNode(' ' + (link.dataset.creditText || '')));
      }
      caption.hidden = !link.dataset.creditName;

      dialog.showModal();
      video.play().catch(function () {});
    });
  });
})();
