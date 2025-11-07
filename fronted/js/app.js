// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const form   = document.getElementById('login-form');
  const msg    = document.getElementById('msg');
  const email  = document.getElementById('email');
  const pass   = document.getElementById('password');
  const toggle = document.getElementById('togglePass');

  // ===== MODO ESTRICTO DE LOGIN =====
  // Siempre que entres a index.html se limpia cualquier sesión previa
  // para evitar redirecciones automáticas o "reaperturas" indeseadas.
  try { $api.clearToken(); } catch {}

  // ===== util =====
  const disableForm = (v = true) => {
    if (!form) return;
    [...form.elements].forEach((el) => (el.disabled = v));
  };

  const redirectByRole = (user) => {
    // si tu backend devuelve "rol" en /auth/me, puedes decidir destino
    if (user?.rol === 'admin' || user?.rol === 'coordinador') {
      window.location.href = 'coordinador.html';
    } else {
      window.location.href = 'inicio_estudiante.html';
    }
  };

  // Mostrar/ocultar contraseña
  if (toggle && pass) {
    toggle.addEventListener('click', () => {
      const isPwd = pass.type === 'password';
      pass.type = isPwd ? 'text' : 'password';
      toggle.setAttribute('aria-label', isPwd ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  }

  // ===== NADA DE AUTO-REDIRECCIONES EN EL LOAD =====
  // (Eliminado cualquier verificación de token existente)

  // ===== Submit Login =====
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    $api.hideMsg(msg);

    const correo   = (email?.value || '').trim();
    const password = (pass?.value  || '').trim();

    if (!correo || !password) {
      return $api.showMsg(msg, 'Completa correo y contraseña', 'error');
    }

    try {
      disableForm(true);
      $api.showMsg(msg, 'Validando credenciales…', 'ok');

      // 1) Login → obtiene token
      const { token } = await $api.request('/auth/login', {
        method: 'POST',
        body: { correo, password }
      });

      if (!token) throw new Error('No se recibió token del servidor.');

      // 2) Guardar token y validar perfil inmediatamente
      $api.setToken(token);

      let me = null;
      try {
        me = await $api.request('/auth/me', { auth: true });
      } catch {
        $api.clearToken();
        throw new Error('No se pudo validar la sesión. Intenta nuevamente.');
      }

      // 3) Mensaje + redirección
      $api.showMsg(msg, 'Inicio de sesión correcto. Redirigiendo…', 'ok');
      setTimeout(() => redirectByRole(me), 500);

    } catch (err) {
      $api.showMsg(msg, err.message || 'Error al iniciar sesión', 'error');
    } finally {
      disableForm(false);
    }
  });
});
