// js/inicio_estudiante.js
document.addEventListener('DOMContentLoaded', () => {
  const avatar = document.getElementById('avatar');
  const phNombre = document.getElementById('ph-nombre');
  const phCarrera = document.getElementById('ph-carrera');
  const cvInput = document.getElementById('fileCv');
  const cvList = document.getElementById('cvList');

  const setActiveByHash = () => {
    const hash = (location.hash || '#dashboard').replace('#', '');
    document.querySelectorAll('.menu .menu-item').forEach((a) => a.classList.remove('active'));
    document.querySelectorAll('.section').forEach((s) => s.classList.remove('show'));
    const menu = document.querySelector(`.menu .menu-item[href="#${hash}"]`);
    menu?.classList.add('active');
    document.getElementById(hash)?.classList.add('show');
  };

  const ensureAuth = async () => {
    const token = $api.getToken();
    if (!token) return (window.location.href = 'index.html');
    try {
      const me = await $api.request('/auth/me', { auth: true });
      renderProfile(me);
    } catch {
      $api.clearToken();
      window.location.href = 'index.html';
    }
  };

  function renderProfile(me) {
    const full = me?.nombre || 'Estudiante';
    if (phNombre) phNombre.textContent = full;
    if (phCarrera) phCarrera.textContent = me?.carrera || '—';

    if (avatar && avatar.childElementCount === 0) {
      avatar.innerHTML = `
        <svg viewBox="0 0 128 128" width="72" height="72" aria-hidden="true">
          <circle cx="64" cy="64" r="62" fill="#eef2ff" />
          <circle cx="64" cy="48" r="20" fill="#93a8ff"/>
          <path d="M24 102c8-20 28-26 40-26s32 6 40 26" fill="#93a8ff"/>
        </svg>`;
    }

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('p_nombres', full.split(' ').slice(0, -1).join(' '));
    set('p_apellidos', full.split(' ').slice(-1).join(' '));
    set('p_cedula', me?.cedula);
    set('p_nacimiento', me?.nacimiento);
    set('p_correo', me?.correo);
    set('p_telefono', me?.telefono);
    set('p_direccion', me?.direccion);
    set('a_facultad', me?.facultad);
    set('a_carrera', me?.carrera);
  }

  cvInput?.addEventListener('change', () => {
    const file = cvInput.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Máx. 5 MB');
      return;
    }
    const item = document.createElement('article');
    item.className = 'doc-item';
    item.innerHTML = `
      <div class="doc-left">
        <div class="doc-icon" aria-hidden="true"></div>
        <div class="doc-info">
          <span class="doc-name">${file.name}</span>
          <div class="doc-meta">PDF · ${(file.size/1024).toFixed(0)} KB · ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      <div class="doc-actions">
        <button class="icon-btn danger" title="Eliminar">&times;</button>
      </div>`;
    item.querySelector('.danger').addEventListener('click', () => item.remove());
    cvList?.prepend(item);
  });

  document.querySelectorAll('.menu .menu-item').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        history.pushState({}, '', href);
        setActiveByHash();
        window.scrollTo({ top: 0 });
      }
    });
  });
  window.addEventListener('hashchange', setActiveByHash);

  setActiveByHash();
  ensureAuth();
});
