const DBURL = "http://localhost:3000";

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
    const contenedor = document.querySelector(".content");
    if (contenedor) contenedor.appendChild(mensaje);
  }
  mensaje.textContent = texto;
}

function mostrarError(input, texto) {
  input.classList.add("input-error");
  let error = document.createElement("div");
  error.className = "error";
  error.style.color = "red";
  error.style.marginTop = "6px";
  error.textContent = texto;
  input.insertAdjacentElement("afterend", error);
}

function limpiarErrores() {
  document.querySelectorAll(".error").forEach(e => e.remove());
  document.querySelectorAll(".input").forEach(i => i.classList.remove("input-error"));
  let mensaje = document.getElementById("mensaje-exito");
  if (mensaje) mensaje.textContent = "";
}

async function buscarLogin() {
  let loginActual = null;
  try { 
    loginActual = JSON.parse(localStorage.getItem("usuario")); 
  } catch {}

  if (loginActual && loginActual.id) {
    const banner = document.createElement("div");
    banner.className = "banner";
    banner.textContent = `Se detectó una sesión, bienvenido ${loginActual.nombre || "usuario"}`;
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
      location.href = "principal.html";
    }, 2000);
  }
}
  async function registrarUsuario() {
  limpiarErrores();
  const nombreInput = document.getElementById("nombre");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("contrasena");
  const confirmarInput = document.getElementById("confirmar");

  const nombre = nombreInput.value.trim();
  const email = emailInput.value.trim();
  const pass = passInput.value;
  const confirmar = confirmarInput.value;

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
    const respuesta = await fetch(`${DBURL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password: pass, rol: "usuario" })
    });
    const datos = await respuesta.json();
    if (respuesta.ok) {
      nombreInput.value = "";
      emailInput.value = "";
      passInput.value = "";
      confirmarInput.value = "";
      mostrarMensajeOk("¡Cuenta registrada con éxito! Iniciá sesión.");
      setTimeout(() => { location.href = "login.html"; }, 900);
    } else {
      mostrarError(emailInput, datos.error || "No se pudo registrar");
    }
  } catch (e) {
    mostrarError(emailInput, "Error de red");
  }
}

function prepararRegistro() {
  const boton = document.querySelector(".btn.btn-orange.full");
  if (!boton) return;
  boton.addEventListener("click", (e) => {
    e.preventDefault();
    registrarUsuario();
  });
}

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
        localStorage.setItem("usuario", JSON.stringify(d));
        await irSegunMascotas();
      } else {
        mostrarError(passInput,"El usuario o contraseña son incorrectos");
      }      
    } catch {
      mostrarError(passInput, "Error de red");
    }
  });
}

async function tieneMascotas(userId) {
  try {
    const r = await fetch(`${DBURL}/mascotas`);
    const data = await r.json();
    if (!Array.isArray(data)) return false;
    return data.some(m => m.usuario_id === userId);
  } catch {
    return false;
  }
}

async function irSegunMascotas() {
  let u = null;
  try { u = JSON.parse(localStorage.getItem("usuario")); } catch {}
  if (!u || !u.id) { location.href = "login.html"; return; }
  const hay = await tieneMascotas(u.id);
  location.href = hay ? "principal.html" : "mascota.html";
}


document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname || "").toLowerCase();
  if (path.endsWith("registro.html")) prepararRegistro();
  if (path.endsWith("login.html")) prepararLogin();
  if(path.endsWith("login.html") || path.endsWith("registro.html")) buscarLogin();
})
