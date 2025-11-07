// fronted/js/main.js (usar type="module" en coordinador.html)
"use strict";
import { supabase, getSession, onAuth } from "./supabaseClient.js";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const content = $("#content");
const BUCKET = "documentos"; // crea este bucket en Storage

// === Estado en memoria
let session = null;
let myProfile = null;

// === Utilidades
document.documentElement.style.overflowX = "hidden";
document.body.style.overscrollBehavior = "contain";

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="100%" height="100%" fill="#EFF2FF"/>
  <circle cx="128" cy="96" r="48" fill="#BFD3FF"/>
  <rect x="48" y="160" width="160" height="72" rx="36" fill="#BFD3FF"/>
</svg>`);

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function sanitizeFileName(n) {
  return n.replace(/[^\w.\-]+/g, "_");
}
function cardInfo(title, body = "") {
  return `<section class="panel"><h2>${title}</h2>${body}</section>`;
}

// === Cargar sesión y perfil
async function ensureSessionAndProfile() {
  session = await getSession();
  if (!session) {
    // si no hay sesión, enviar al login
    window.location.href = "index.html";
    return;
  }
  // Obtener/crear perfil
  const { data: prof, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_uid", session.user.id)
    .maybeSingle();

  if (error) throw error;

  if (!prof) {
    // crear uno mínimo
    const { data: ins, error: insErr } = await supabase
      .from("profiles")
      .insert({
        auth_uid: session.user.id,
        nombre: session.user.email?.split("@")[0] || "usuario",
        rol: "estudiante",
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    myProfile = ins;
  } else {
    myProfile = prof;
  }
}

// === Router
const routes = {
  async dashboard() {
    content.innerHTML = cardInfo(
      "Resumen",
      `<p>Hola, <strong>${escapeHtml(myProfile?.nombre)}</strong>. 
      Tu rol: <code>${escapeHtml(myProfile?.rol)}</code>.</p>
      <p>Usa el menú para navegar: Mi perfil, Ofertas y Estudiantes.</p>`
    );
  },

  async solicitudes() {
    // Mostramos Ofertas publicadas con info de empresa y opción de postular
    content.innerHTML = `
      <section class="panel">
        <h2>Ofertas de prácticas</h2>
        <div class="toolbar">
          <input id="q" class="input" placeholder="Buscar por título o empresa…" />
          <button id="btnBuscar" class="btn-primary">Buscar</button>
          <button id="btnMisPostulaciones" class="btn-secondary">Mis postulaciones</button>
        </div>
        <div id="ofertasList" class="list"></div>
      </section>
    `;

    const render = (rows) => {
      const el = $("#ofertasList");
      if (!rows?.length) return (el.innerHTML = "<p>No hay ofertas.</p>");
      el.innerHTML = rows
        .map(
          (o) => `
        <article class="card-row">
          <div class="col">
            <strong>${escapeHtml(o.titulo)}</strong>
            <div class="muted">
              ${escapeHtml(o.empresas?.nombre || "Empresa")}
              · ${escapeHtml(o.modalidad || "")} · ${escapeHtml(o.ubicacion || "")}
            </div>
            <p>${escapeHtml(o.descripcion || "")}</p>
          </div>
          <div class="col">
            <button class="btn-primary" data-accion="postular" data-id="${o.id}">Postular</button>
          </div>
        </article>`
        )
        .join("");

      // Eventos de postulación
      $$("#ofertasList [data-accion='postular']").forEach((b) =>
        b.addEventListener("click", async () => {
          const oferta_id = b.getAttribute("data-id");
          try {
            const { error } = await supabase.from("postulaciones").insert({
              oferta_id,
              estudiante_id: myProfile.id,
            });
            if (error) throw error;
            alert("¡Postulación enviada!");
          } catch (err) {
            console.error(err);
            alert(err.message || "No se pudo postular.");
          }
        })
      );
    };

    async function cargar(q = "") {
      let qb = supabase
        .from("ofertas")
        .select("*, empresas(nombre)")
        .eq("estado", "publicada")
        .order("publicado_en", { ascending: false })
        .limit(50);

      if (q) {
        qb = qb.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`);
      }
      const { data, error } = await qb;
      if (error) {
        console.error(error);
        $("#ofertasList").innerHTML = `<p class="error">${error.message}</p>`;
      } else {
        render(data || []);
      }
    }

    $("#btnBuscar")?.addEventListener("click", () => {
      const term = $("#q")?.value.trim();
      cargar(term);
    });

    $("#btnMisPostulaciones")?.addEventListener("click", async () => {
      const { data, error } = await supabase
        .from("postulaciones")
        .select("*, ofertas(titulo, empresas(nombre))")
        .eq("estudiante_id", myProfile.id)
        .order("fecha", { ascending: false });
      if (error) return alert(error.message);
      const el = $("#ofertasList");
      if (!data?.length) return (el.innerHTML = "<p>No tienes postulaciones.</p>");
      el.innerHTML = data
        .map(
          (p) => `
        <article class="card-row">
          <div class="col">
            <strong>${escapeHtml(p.ofertas?.titulo || "")}</strong>
            <div class="muted">${escapeHtml(p.ofertas?.empresas?.nombre || "")}</div>
            <div>Estado: <code>${escapeHtml(p.estado)}</code></div>
          </div>
        </article>`
        )
        .join("");
    });

    cargar();
  },

  async estudiantes() {
    content.innerHTML = `
      <section class="panel">
        <h2>Estudiantes</h2>
        <div class="toolbar">
          <input id="q" class="input" placeholder="Buscar por nombre…" />
          <button id="btnBuscar" class="btn-primary">Buscar</button>
        </div>
        <div id="list" class="list"></div>
      </section>
    `;

    async function cargar(term = "") {
      let qb = supabase.from("profiles").select("id,nombre,cedula,telefono,ciudad,correo:auth.users(email)").eq("rol", "estudiante").limit(100);
      if (term) qb = qb.ilike("nombre", `%${term}%`);
      const { data, error } = await qb;
      const el = $("#list");
      if (error) return (el.innerHTML = `<p class="error">${error.message}</p>`);
      if (!data?.length) return (el.innerHTML = "<p>No hay resultados.</p>");
      el.innerHTML = data
        .map(
          (r) => `
          <article class="card-row">
            <div class="col">
              <strong>${escapeHtml(r.nombre)}</strong>
              <div class="muted">${escapeHtml(r.cedula || "")} · ${escapeHtml(r.correo?.email || "")}</div>
              <div>${escapeHtml(r.ciudad || "")} · ${escapeHtml(r.telefono || "")}</div>
            </div>
            <div class="col">
              <button class="btn-secondary" data-accion="pdf" data-id="${r.id}">Generar PDF</button>
            </div>
          </article>`
        )
        .join("");

      // Placeholder PDF
      $$("#list [data-accion='pdf']").forEach((b) =>
        b.addEventListener("click", () => alert("Generación de PDF pendiente (jsPDF o servidor)."))
      );
    }

    $("#btnBuscar")?.addEventListener("click", () => {
      const term = $("#q")?.value.trim();
      cargar(term);
    });

    cargar();
  },

  async perfil() {
    content.innerHTML = `
      <section class="panel perfil">
        <h2>Mi perfil</h2>
        <div class="profile-wrap">
          <div class="avatar-col">
            <img id="avatar" class="avatar" alt="Avatar de usuario" src="${DEFAULT_AVATAR}">
            <div class="muted">Si no has subido imagen, se muestra el avatar por defecto.</div>
          </div>
          <form id="perfil-form" class="form-grid" autocomplete="off">
            ${input("p_nombre","Nombre completo")}
            ${input("p_cedula","Cédula")}
            ${input("p_correo","Correo")}
            ${input("p_telefono","Teléfono")}
            ${input("p_direccion","Dirección")}
            ${input("p_ciudad","Ciudad")}
            ${input("p_provincia","Provincia")}
            ${input("p_universidad","Universidad")}
            ${input("p_facultad","Facultad")}
            ${input("p_carrera","Carrera")}
            ${input("p_genero","Género")}
            ${input("p_nacimiento","Nacimiento","date")}
            <div class="divider"></div>
            <div class="field full">
              <label class="label" for="cv">Mi CV (PDF)</label>
              <input id="cv" type="file" accept="application/pdf" />
              <small class="muted">Se sube a Storage bucket <code>${BUCKET}</code> y se registra en <code>documentos</code>.</small>
              <ul id="cvList" class="file-list"></ul>
            </div>
            <div class="actions full">
              <button type="button" id="btnGuardar" class="btn-primary">Guardar cambios</button>
              <button type="button" id="btnLogout" class="btn-secondary">Cerrar sesión</button>
            </div>
          </form>
        </div>
      </section>
    `;

    function input(id, label, type = "text") {
      return `
      <div class="field">
        <label class="label" for="${id}">${label}</label>
        <input class="input" id="${id}" ${type === "date" ? 'type="date"' : ""} placeholder="(vacío)" />
      </div>`;
    }

    // Hidratar desde DB
    await refreshProfileForm();

    // Listar documentos del usuario
    await listarDocumentos();

    // Subida de CV
    $("#cv")?.addEventListener("change", async (e) => {
      const files = [...(e.target.files || [])].filter((f) => f.type === "application/pdf");
      if (!files.length) return;
      for (const f of files) {
        const path = `cv/${myProfile.id}/${Date.now()}_${sanitizeFileName(f.name)}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, { upsert: false });
        if (upErr) {
          console.error(upErr);
          alert("Error subiendo CV: " + upErr.message);
          continue;
        }
        // Registrar en documentos
        const { error: docErr } = await supabase.from("documentos").insert({
          estudiante_id: myProfile.id,
          nombre_original: f.name,
          storage_path: path,
          tipo: "cv",
          size_bytes: f.size,
        });
        if (docErr) {
          console.error(docErr);
          alert("Subido a Storage, pero no se pudo registrar en DB.");
        }
      }
      e.target.value = "";
      await listarDocumentos();
    });

    // Guardar perfil
    $("#btnGuardar")?.addEventListener("click", async () => {
      const payload = {
        nombre: $("#p_nombre")?.value || null,
        cedula: $("#p_cedula")?.value || null,
        telefono: $("#p_telefono")?.value || null,
        ciudad: $("#p_ciudad")?.value || null,
        provincia: $("#p_provincia")?.value || null,
        direccion: $("#p_direccion")?.value || null,
        universidad: $("#p_universidad")?.value || null,
        facultad: $("#p_facultad")?.value || null,
        carrera: $("#p_carrera")?.value || null,
        nacimiento: $("#p_nacimiento")?.value || null,
        genero: $("#p_genero")?.value || null,
        updated_at: new Date().toISOString(),
      };

      // El correo proviene de auth
      const email = $("#p_correo")?.value?.trim();
      if (email && session?.user?.email && email !== session.user.email) {
        alert("El correo se gestiona desde Auth; no se cambia aquí.");
      }

      const { error } = await supabase.from("profiles").update(payload).eq("id", myProfile.id);
      if (error) return alert(error.message);
      alert("Perfil actualizado.");
      await refreshProfileForm(); // refrescar
    });

    $("#btnLogout")?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });

    async function refreshProfileForm() {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", myProfile.id).single();
      if (error) return console.error(error);
      myProfile = data;

      $("#avatar").src = DEFAULT_AVATAR;
      $("#p_nombre").value = myProfile.nombre || "";
      $("#p_cedula").value = myProfile.cedula || "";
      $("#p_telefono").value = myProfile.telefono || "";
      $("#p_direccion").value = myProfile.direccion || "";
      $("#p_ciudad").value = myProfile.ciudad || "";
      $("#p_provincia").value = myProfile.provincia || "";
      $("#p_universidad").value = myProfile.universidad || "";
      $("#p_facultad").value = myProfile.facultad || "";
      $("#p_carrera").value = myProfile.carrera || "";
      $("#p_genero").value = myProfile.genero || "";
      $("#p_nacimiento").value = (myProfile.nacimiento || "").slice(0, 10);
      $("#p_correo").value = session?.user?.email || "";
    }

    async function listarDocumentos() {
      const ul = $("#cvList");
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("estudiante_id", myProfile.id)
        .order("uploaded_at", { ascending: false });
      if (error) {
        ul.innerHTML = `<li class="error">${error.message}</li>`;
        return;
      }
      if (!data?.length) {
        ul.innerHTML = `<li class="muted">Aún no subes documentos.</li>`;
        return;
      }
      ul.innerHTML = "";
      for (const d of data) {
        // Obtener URL pública/firmada
        let url = null;
        // Si el bucket es público:
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(d.storage_path);
        url = pub?.publicUrl || "#";

        const li = document.createElement("li");
        li.className = "file ok";
        li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${escapeHtml(d.nombre_original)}</a>`;
        ul.appendChild(li);
      }
    }
  },
};

function applyActiveNav() {
  const hash = (window.location.hash || "#dashboard").slice(1);
  $$(".sidebar a[data-target]").forEach((a) => {
    const on = a.getAttribute("data-target") === hash;
    a.classList.toggle("active", on);
    a.setAttribute("aria-current", on ? "page" : "false");
  });
}
async function router() {
  const hash = (window.location.hash || "#dashboard").slice(1);
  if (!session) await ensureSessionAndProfile();
  const fn = routes[hash] || routes.dashboard;
  await fn();
  applyActiveNav();
}

// Eventos globales
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-target]");
  if (!a) return;
  e.preventDefault();
  const target = a.getAttribute("data-target");
  window.location.hash = target;
});
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", async () => {
  onAuth(async (s) => {
    session = s;
    if (!s) window.location.href = "index.html";
  });
  await router();
});
document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');

  const templates = {
    dashboard: `<section class="section"><h1 class="h1">Inicio</h1><p class="muted">Bienvenido(a) al panel del coordinador.</p></section>`,
    estudiantes: `<section class="section"><h1 class="h1">Estudiantes</h1><p class="muted">Listado por implementar.</p></section>`,
    empresas: `<section class="section"><h1 class="h1">Empresas</h1><p class="muted">Gestión de empresas.</p></section>`,
    ofertas: `<section class="section"><h1 class="h1">Ofertas</h1><p class="muted">Crea y edita ofertas de prácticas.</p></section>`,
    postulaciones: `<section class="section"><h1 class="h1">Postulaciones</h1><p class="muted">Revisa las postulaciones.</p></section>`
  };

  function render(section = 'dashboard') {
    content.innerHTML = templates[section] || templates.dashboard;
  }

  document.querySelectorAll('.menu .menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.menu .menu-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      render(item.dataset.section);
    });
  });

  render('dashboard');
});