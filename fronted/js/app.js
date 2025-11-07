// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('msg');
  const email = document.getElementById('email');
  const pass = document.getElementById('password');
  const toggle = document.getElementById('togglePass');

  if (toggle && pass) {
    toggle.addEventListener('click', () => {
      const isPwd = pass.type === 'password';
      pass.type = isPwd ? 'text' : 'password';
      toggle.setAttribute('aria-label', isPwd ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  }

  if ($api.getToken()) {
    $api.request('/auth/me', { auth: true })
      .then(() => (window.location.href = 'inicio_estudiante.html'))
      .catch(() => $api.clearToken());
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    $api.hideMsg(msg);

    const correo = email.value.trim();
    const password = pass.value.trim();

    if (!correo || !password) {
      return $api.showMsg(msg, 'Completa correo y contraseña', 'error');
    }

    try {
      const { token } = await $api.request('/auth/login', {
        method: 'POST',
        body: { correo, password }
      });
      $api.setToken(token);
      $api.showMsg(msg, 'Inicio de sesión correcto. Redirigiendo…', 'ok');
      setTimeout(() => (window.location.href = 'inicio_estudiante.html'), 600);
    } catch (err) {
      $api.showMsg(msg, err.message, 'error');
    }
  });
});
