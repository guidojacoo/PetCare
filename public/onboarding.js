const DBURL = "http://localhost:3000";

function getUser() {
  try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; }
}
function getMascotaId() {
  const v = localStorage.getItem("mascota_actual_id");
  return v ? Number(v) : null;
}
function setMascotaId(id) {
  localStorage.setItem("mascota_actual_id", String(id));
}
function clearErrors() {
  document.querySelectorAll(".error").forEach(e => e.remove());
  document.querySelectorAll("input,button,.chip").forEach(i => i.classList?.remove("input-error","active"));
}
function errUnder(input, msg) {
  if (!input) return;
  input.classList.add("input-error");
  const e = document.createElement("div");
  e.className = "error";
  e.style.color = "red";
  e.style.marginTop = "6px";
  e.textContent = msg;
  input.insertAdjacentElement("afterend", e);
}
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  const d = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(d.error || "Error");
  return d;
}
async function putJSON(url, body) {
  const r = await fetch(url, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  const d = await r.json().catch(()=> ({}));
  if (!r.ok) throw new Error(d.error || "Error");
  return d;
}

/* Paso 1: Nombre (mascota.html) */
function bootPasoNombre() {
  const btn = document.getElementById("btn-mascota-next");
  const nombreEl = document.getElementById("nombre-mascota");
  if (!btn || !nombreEl) return;

  btn.addEventListener("click", async (ev)=>{
    ev.preventDefault();
    clearErrors();
    const u = getUser();
    if (!u || !u.id) { location.href = "login.html"; return; }
    const nombre = (nombreEl.value || "").trim();
    if (!nombre) { errUnder(nombreEl, "Ingresá un nombre"); return; }

    try {
      const m = await postJSON(`${DBURL}/mascotas`, { usuario_id: u.id, nombre });
      setMascotaId(m.id);
      location.href = "sexo.html";
    } catch(e) {
      errUnder(nombreEl, e.message || "No se pudo crear la mascota");
    }
  });
}

/* Paso 2: Sexo (sexo.html) */
function bootPasoSexo() {
  const macho = document.getElementById("btn-sexo-macho");
  const hembra = document.getElementById("btn-sexo-hembra");
  const next = document.getElementById("btn-sexo-next");
  if (!macho || !hembra || !next) return;

  let seleccionado = null;
  const select = (val, btn)=>{
    seleccionado = val;
    [macho, hembra].forEach(b=> b.classList.remove("active"));
    btn.classList.add("active");
  };
  macho.addEventListener("click", ()=> select("Macho", macho));
  hembra.addEventListener("click", ()=> select("Hembra", hembra));

  next.addEventListener("click", async (ev)=>{
    ev.preventDefault();
    clearErrors();
    const id = getMascotaId();
    if (!id) { location.href = "mascota.html"; return; }
    if (!seleccionado) { errUnder(next, "Elegí una opción"); return; }
    try {
      await putJSON(`${DBURL}/mascotas/${id}`, { sexo: seleccionado });
      location.href = "peso.html";
    } catch(e) {
      errUnder(next, e.message || "No se pudo guardar");
    }
  });
}

/* Paso 3: Peso (peso.html) */
function bootPasoPeso() {
  const chips = document.getElementById("peso-chips");
  const custom = document.getElementById("peso-custom");
  const next = document.getElementById("btn-peso-next");
  if (!next || !chips) return;

  let pesoSel = null;
  chips.querySelectorAll(".chip").forEach(ch=>{
    ch.addEventListener("click", ()=>{
      pesoSel = Number(ch.getAttribute("data-peso"));
      chips.querySelectorAll(".chip").forEach(c=> c.classList.remove("active"));
      ch.classList.add("active");
      if (custom) custom.value = "";
    });
  });

  next.addEventListener("click", async (ev)=>{
    ev.preventDefault();
    clearErrors();
    const id = getMascotaId();
    if (!id) { location.href = "mascota.html"; return; }
    let peso = pesoSel;
    if ((!peso || isNaN(peso)) && custom && custom.value !== "") {
      peso = Number(custom.value);
    }
    if (!peso || isNaN(peso) || peso < 0) { errUnder(custom || next, "Ingresá un peso válido"); return; }

    try {
      await putJSON(`${DBURL}/mascotas/${id}`, { peso_kg: peso });
      location.href = "raza.html";
    } catch(e) {
      errUnder(next, e.message || "No se pudo guardar");
    }
  });
}

/* Paso 4: Raza (raza.html) */
function bootPasoRaza() {
  const input = document.getElementById("raza-buscar");
  const lista = document.getElementById("raza-lista");
  const next = document.getElementById("btn-raza-next");
  if (!next || !input || !lista) return;

  let valor = "";
  lista.querySelectorAll("li").forEach(li=>{
    li.style.cursor = "pointer";
    li.addEventListener("click", ()=>{
      valor = li.textContent.trim();
      lista.querySelectorAll("li").forEach(x=> x.style.outline="none");
      li.style.outline = "2px solid #02c6cc";
      input.value = valor;
    });
  });

  next.addEventListener("click", async (ev)=>{
    ev.preventDefault();
    clearErrors();
    const id = getMascotaId();
    if (!id) { location.href = "mascota.html"; return; }
    const raza = (input.value || "").trim();
    if (!raza) { errUnder(input, "Elegí o escribí una raza"); return; }

    try {
      await putJSON(`${DBURL}/mascotas/${id}`, { raza });
      location.href = "edad.html";
    } catch(e) {
      errUnder(next, e.message || "No se pudo guardar");
    }
  });
}

/* Paso 5: Cumpleaños (edad.html) */
function bootPasoFecha() {
  const fecha = document.getElementById("fecha-nacimiento");
  const next = document.getElementById("btn-fecha-finalizar");
  if (!next || !fecha) return;

  next.addEventListener("click", async (ev)=>{
    ev.preventDefault();
    clearErrors();
    const id = getMascotaId();
    if (!id) { location.href = "mascota.html"; return; }
    const f = fecha.value || null;

    try {
      await putJSON(`${DBURL}/mascotas/${id}`, { fecha_nacimiento: f });
      localStorage.removeItem("mascota_actual_id");
      location.href = "principal.html";
    } catch(e) {
      errUnder(next, e.message || "No se pudo guardar");
    }
  });
}

/* Boot por página */
document.addEventListener("DOMContentLoaded", ()=>{
  const path = (location.pathname || "").toLowerCase();
  if (path.endsWith("mascota.html")) bootPasoNombre();
  if (path.endsWith("sexo.html"))    bootPasoSexo();
  if (path.endsWith("peso.html"))    bootPasoPeso();
  if (path.endsWith("raza.html"))    bootPasoRaza();
  if (path.endsWith("edad.html"))    bootPasoFecha();
});
