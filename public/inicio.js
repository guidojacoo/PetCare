// inicio.js
const DBURL = "http://localhost:3000";

// ===== Helpers de sesión (unificados) =====
function getUserUnified() {
  let u=null,p=null;
  try { u = JSON.parse(localStorage.getItem("usuario")); } catch {}
  try { p = JSON.parse(localStorage.getItem("petcare_user")); } catch {}
  return (u && u.id) ? u : (p && p.id ? p : null);
}
function setUserUnified(user) {
  // Guarda en ambas por compatibilidad con páginas viejas
  localStorage.setItem("usuario", JSON.stringify(user));
  localStorage.setItem("petcare_user", JSON.stringify(user));
}
function clearUserUnified() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("petcare_user");
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mostrarMensajeOk(texto) {
  let mensaje = document.getElementById("mensaje-exito");
  if (!mensaje) {
    mensaje = document.createElement("div");
    mensaje.id = "mensaje-exito";
    mensaje.style.marginTop = "8px";
    mensaje.style.color = "green";
    const contenedor = document.querySelector(".content") || document.body;
    contenedor.appendChild(mensaje);
  }
  mensaje.textContent = texto;
}

function mostrarError(input, texto) {
  if (input?.classList) input.classList.add("input-error");
  let error = document.createElement("div");
  error.className = "error";
  error.style.color = "red";
  error.style.marginTop = "6px";
  error.textContent = texto;
  (input?.insertAdjacentElement ? input.insertAdjacentElement("afterend", error) : document.body.appendChild(error));
}

function limpiarErrores() {
  document.querySelectorAll(".error").forEach(e => e.remove());
  document.querySelectorAll(".input").forEach(i => i.classList.remove("input-error"));
  let mensaje = document.getElementById("mensaje-exito");
  if (mensaje) mensaje.textContent = "";
}

// Detectar sesión y sugerir continuar (solo en login/registro)
async function buscarLogin() {
  const u = getUserUnified();
  if (u && u.id) {
    const banner = document.createElement("div");
    banner.className = "banner";
    banner.textContent = `Sesión detectada, bienvenido ${u.nombre || "usuario"}`;
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.remove();
      irSegunMascotas();
    }, 1200);
  }
}

// ------- REGISTRO -------
async function registrarUsuario() {
  limpiarErrores();
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("contrasena");
  const confirmarInput = document.getElementById("confirmar");

  const nombre = (nombreInput?.value || "").trim();
  const email = (emailInput?.value || "").trim();
  const pass = passInput?.value || "";
  const confirmar = confirmarInput?.value || "";

  let valido = true;
  if (!nombre) { mostrarError(nombreInput, "Completá tu nombre"); valido = false; }
  if (!email) { mostrarError(emailInput, "Completá tu email"); valido = false; }
  else if (!validarEmail(email)) { mostrarError(emailInput, "Email inválido"); valido = false; }
  if (!pass) { mostrarError(passInput, "Ingresá una contraseña"); valido = false; }
  else if (pass.length < 6) { mostrarError(passInput, "Mínimo 6 caracteres"); valido = false; }
  if (!confirmar) { mostrarError(confirmarInput, "Repetí tu contraseña"); valido = false; }
  else if (confirmar !== pass) { mostrarError(confirmarInput, "No coinciden"); valido = false; }
  if (!valido) return;

  try {
    const r = await fetch(`${DBURL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password: pass, rol: "usuario" })
    });
    const datos = await r.json();

    if (!r.ok) {
      mostrarError(emailInput, datos?.error || "No se pudo registrar");
      return;
    }

    // Auto-login: guardo usuario y voy directo a mascota.html
    setUserUnified({ id: datos.id, nombre: datos.nombre, email: datos.email, rol: datos.rol });
    mostrarMensajeOk("¡Cuenta creada! Vamos a crear tu mascota…");
    setTimeout(() => { location.href = "mascota.html"; }, 800);
  } catch (e) {
    mostrarError(emailInput, "Error de red");
  }
}

function prepararRegistro() {
  const boton = document.getElementById("btn-registro");
  if (!boton) return;
  boton.addEventListener("click", (e) => {
    e.preventDefault();
    registrarUsuario();
  });
}

// ------- LOGIN -------
function prepararLogin() {
  const emailInput = document.querySelectorAll(".input")[0];
  const passInput  = document.querySelectorAll(".input")[1];
  const boton      = document.getElementById("btn-login");
  if (!boton || !emailInput || !passInput) return;

  boton.addEventListener("click", async (e) => {
    e.preventDefault();
    document.querySelectorAll(".error").forEach(n=>n.remove());
    emailInput.classList.remove("input-error");
    passInput.classList.remove("input-error");

    const email = emailInput.value.trim();
    const pass  = passInput.value;

    let valido = true;
    if (!email || !validarEmail(email)) { mostrarError(emailInput, "Ingresá un email válido"); valido = false; }
    if (!pass) { mostrarError(passInput, "Ingresá tu contraseña"); valido = false; }
    if (!valido) return;

    try {
      const r = await fetch(`${DBURL}/login`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, password: pass })
      });
      const d = await r.json();

      if (r.ok) {
        setUserUnified(d);
        await irSegunMascotas();
      } else {
        mostrarError(passInput,"Usuario o contraseña incorrectos");
      }
    } catch {
      mostrarError(passInput, "Error de red");
    }
  });
}

// ------- Ruteo post-login -------
async function tieneMascotas(userId) {
  try {
    // si tenés el endpoint /usuarios/:id/mascotas úsalo, si no, filtra cliente:
    const r = await fetch(`${DBURL}/usuarios/${userId}/mascotas`);
    if (r.ok) {
      const data = await r.json();
      return Array.isArray(data) && data.length > 0;
    }
    // fallback
    const r2 = await fetch(`${DBURL}/mascotas`);
    const all = await r2.json();
    return Array.isArray(all) && all.some(m => Number(m.usuario_id) === Number(userId));
  } catch {
    return false;
  }
}

async function irSegunMascotas() {
  const u = getUserUnified();
  if (!u || !u.id) { location.href = "login.html"; return; }
  const hay = await tieneMascotas(u.id);
  location.href = hay ? "principal.html" : "mascota.html";
}

// ------- Boot -------
document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname || "").toLowerCase();
  if (path.endsWith("registro.html")) prepararRegistro();
  if (path.endsWith("login.html")) prepararLogin();
  if (path.endsWith("login.html") || path.endsWith("registro.html")) buscarLogin();
});

// Export opcional por si lo usa index.html
window.irSegunMascotas = irSegunMascotas;
