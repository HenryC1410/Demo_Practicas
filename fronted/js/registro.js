// fronted/js/registro.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-reg');
  const msg = document.getElementById('msg-reg');

  const fieldError = (name, text) => {
    const small = document.querySelector(`.field-error[data-for="${name}"]`);
    if (small) small.textContent = text || '';
  };
  const clearErrors = () => {
    document.querySelectorAll('.field-error').forEach((s) => (s.textContent = ''));
    $api.hideMsg(msg);
  };

  // Construye payload leyendo por name/id exactamente como tu HTML
  const readPayload = () => ({
    universidad: document.getElementById('universidad')?.value?.trim(),
    nombre:      document.getElementById('nombre')?.value?.trim(),
    cedula:      document.getElementById('cedula')?.value?.trim(),
    correo:      document.getElementById('correo')?.value?.trim(),
    telefono:    document.getElementById('telefono')?.value?.trim(),
    direccion:   document.getElementById('direccion')?.value?.trim(),
    provincia:   document.getElementById('provincia')?.value,
    ciudad:      document.getElementById('ciudad')?.value?.trim(),
    facultad:    document.getElementById('facultad')?.value?.trim(),
    carrera:     document.getElementById('carrera')?.value?.trim(),
    nacimiento:  document.getElementById('nacimiento')?.value,
    genero:      document.getElementById('genero')?.value,
    password:    document.getElementById('password')?.value
  });

  const validate = (p) => {
    let ok = true;
    const set = (field, cond, msg) => {
      if (!cond) { fieldError(field, msg); ok = false; }
    };
    // Validaciones mínimas
    set('universidad', !!p.universidad, 'Requerido');
    set('nombre', !!p.nombre, 'Requerido');
    set('cedula', /^\d{10}$/.test(p.cedula || ''), 'Cédula (10 dígitos)');
    set('correo', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.correo || ''), 'Correo inválido');
    set('telefono', /^\d{9,10}$/.test(p.telefono || ''), 'Teléfono inválido');
    set('direccion', !!p.direccion, 'Requerido');
    set('provincia', !!p.provincia, 'Selecciona provincia');
    set('ciudad', !!p.ciudad, 'Requerido');
    set('facultad', !!p.facultad, 'Requerido');
    set('carrera', !!p.carrera, 'Requerido');
    set('nacimiento', !!p.nacimiento, 'Requerido');
    set('genero', !!p.genero, 'Selecciona opción');
    set('password', (p.password || '').length >= 8, 'Mínimo 8 caracteres');
    return ok;
  };

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const payload = readPayload();
    if (!validate(payload)) {
      $api.showMsg(msg, 'Revisa los campos marcados', 'error');
      return;
    }

    try {
      const { token } = await $api.request('/auth/register', {
        method: 'POST',
        body: payload
      });
      $api.setToken(token);
      $api.showMsg(msg, '¡Registro exitoso! Redirigiendo…', 'ok');
      setTimeout(() => (window.location.href = 'inicio_estudiante.html'), 700);
    } catch (err) {
      $api.showMsg(msg, err.message, 'error');
      // Si el backend mandó "El correo ya está registrado"
      if (/correo/i.test(err.message)) fieldError('correo', err.message);
    }
  });
});
