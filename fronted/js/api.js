// js/api.js
(() => {
  const API_BASE = 'http://localhost:3000/api/v1'; // 🔹 cambia si tu backend usa otro puerto

  const parseJSON = async (res) => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { raw: text }; }
  };

  async function request(path, { auth = false, method = 'GET', body, headers = {} } = {}) {
    const h = { 'Content-Type': 'application/json', ...headers };
    if (auth) {
      const t = localStorage.getItem('token');
      if (t) h.Authorization = `Bearer ${t}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await parseJSON(res);
    if (!res.ok) {
      const msg = data?.error || data?.message || 'Error en la solicitud';
      throw new Error(msg);
    }
    return data?.data ?? data;
  }

  function setToken(token) {
    localStorage.setItem('token', token);
  }
  function getToken() {
    return localStorage.getItem('token');
  }
  function clearToken() {
    localStorage.removeItem('token');
  }

  function showMsg(el, text, type = 'ok') {
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.toggle('alert-error', type !== 'ok');
    el.textContent = text;
  }
  function hideMsg(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.textContent = '';
  }

  window.$api = { request, setToken, getToken, clearToken, showMsg, hideMsg };
})();
