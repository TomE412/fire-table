/* Build guide: tick steps off (saved on this device) and jump to the 3D view. */
(() => {
  const KEY = 'firetable-guide-revB';
  let done = {};
  try { done = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}

  document.querySelectorAll('#guide .step[data-step]').forEach((st) => {
    const n = st.dataset.step;
    const lab = document.createElement('label');
    lab.className = 'done';
    lab.innerHTML = '<input type="checkbox"> Done';
    const box = lab.querySelector('input');
    box.checked = !!done[n];
    st.classList.toggle('is-done', box.checked);
    box.addEventListener('change', () => {
      done[n] = box.checked;
      st.classList.toggle('is-done', box.checked);
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
    });
    st.appendChild(lab);
  });

  document.querySelectorAll('#guide .see3d').forEach((b) => b.addEventListener('click', () => {
    const m = document.querySelector('#modeGroup [data-v="' + b.dataset.mode + '"]');
    if (m) m.click();
    document.getElementById('tab-3d').click();
    window.scrollTo(0, 0);
  }));
})();
