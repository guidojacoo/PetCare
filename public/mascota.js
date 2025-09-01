const API = "http://localhost:3000";

let datos = {
  usuario_id: null,
  nombre: null,
  sexo: null,
  peso_kg: null,
  raza: null,
  fecha_nacimiento: null,
  kcal_100g: null
};

async function post(url, body) {
  let r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    let txt = await r.text();
    throw new Error(txt || "error http");
  }
  return await r.json();
}
function showStep(n) {
  let steps = document.querySelectorAll(".step");
  let i = 0; while (i < steps.length) { steps[i].classList.remove("active"); i++; }
  let el = document.getElementById("step-" + n);
  if (el) el.classList.add("active");
}
function requireVal(cond, msg) {
  if (!cond) { alert(msg); return false; }
  return true;
}

(function initUser(){
  let user = localStorage.getItem("usuario");
  if (!user) { alert("inicia sesion"); location.href = "login.html"; return; }
  try {
    let u = JSON.parse(user);
    datos.usuario_id = u?.id || null;
  } catch(e) {}
  if (!datos.usuario_id) { alert("no se encontro el usuario"); location.href = "login.html"; return; }
  showStep(1);
})();

document.querySelector("#step-1 .next").addEventListener("click", () => {
  let nombre = (document.getElementById("nombre").value || "").trim();
  if (!requireVal(nombre.length >= 2, "ingresa un nombre valido")) return;
  datos.nombre = nombre;
  showStep(2);
});

let chipsSexo = document.querySelectorAll("#step-2 .chip");
let iS = 0; while (iS < chipsSexo.length) {
  chipsSexo[iS].addEventListener("click", function(){
    let v = this.getAttribute("data-sexo");
    datos.sexo = v;
    let j = 0; while (j < chipsSexo.length) { chipsSexo[j].classList.remove("active"); j++; }
    this.classList.add("active");
  });
  iS++;
}
document.querySelector("#step-2 .next").addEventListener("click", () => {
  if (!requireVal(!!datos.sexo, "elegi sexo")) return;
  showStep(3);
});

let chipsPeso = document.querySelectorAll("#step-3 .chip");
let iP = 0; while (iP < chipsPeso.length) {
  chipsPeso[iP].addEventListener("click", function(){
    let v = this.getAttribute("data-peso");
    datos.peso_kg = v ? parseFloat(v) : null;
    let j = 0; while (j < chipsPeso.length) { chipsPeso[j].classList.remove("active"); j++; }
    this.classList.add("active");
    let inp = document.getElementById("peso");
    if (inp) inp.value = datos.peso_kg || "";
  });
  iP++;
}
document.querySelector("#step-3 .next").addEventListener("click", () => {
  if (!datos.peso_kg) {
    let v = parseFloat(document.getElementById("peso").value || "0");
    if (v > 0) datos.peso_kg = v;
  }
  if (!requireVal(!!datos.peso_kg, "ingresa un peso valido")) return;
  showStep(4);
});

document.querySelector("#step-4 .next").addEventListener("click", () => {
  let raza = (document.getElementById("raza").value || "").trim();
  if (!requireVal(raza.length >= 2, "ingresa una raza")) return;
  datos.raza = raza;
  showStep(5);
});

const finish5Btn = document.querySelector("#step-5 .finish");
if (finish5Btn) finish5Btn.addEventListener("click", async () => {
  let fecha = (document.getElementById("fecha").value || "").trim();
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert("fecha invalida"); return; }
  datos.fecha_nacimiento = fecha || null;

  if (!requireVal(!!datos.usuario_id, "usuario no valido")) return;
  if (!requireVal(!!datos.nombre, "falta nombre")) return;
  if (!requireVal(!!datos.sexo, "falta sexo")) return;
  if (!requireVal(!!datos.peso_kg, "falta peso")) return;
  if (!requireVal(!!datos.raza, "falta raza")) return;

  try {
    let body = {
      usuario_id: datos.usuario_id,
      nombre: datos.nombre,
      sexo: datos.sexo,
      raza: datos.raza,
      peso_kg: datos.peso_kg,
      fecha_nacimiento: datos.fecha_nacimiento
    };
    let m = await post(`${API}/mascotas`, body);
    if (!m || !m.id) throw new Error("no se pudo crear la mascota");
    alert("mascota creada con exito");
    location.href = "principal.html";
  } catch (e) {
    alert("error al guardar: " + (e.message || "desconocido"));
  }
});

if (!("kcal_100g" in datos)) datos.kcal_100g = null;

(function wireStep6(){
  const step6 = document.getElementById("step-6");      // Debe existir en el HTML
  const kcalInput = document.getElementById("kcal");     // <input id="kcal">
  const finish5 = document.querySelector("#step-5 .finish");

  if (step6 && finish5) {
    finish5.addEventListener("click", function(e){
      let fecha = (document.getElementById("fecha").value || "").trim();
      if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert("fecha invalida"); e.stopImmediatePropagation(); e.preventDefault(); return; }
      datos.fecha_nacimiento = fecha || null;

      if (!requireVal(!!datos.usuario_id, "usuario no valido")) { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.nombre, "falta nombre"))         { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.sexo, "falta sexo"))             { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.peso_kg, "falta peso"))          { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.raza, "falta raza"))             { e.stopImmediatePropagation(); e.preventDefault(); return; }

      if (!datos.kcal_100g && kcalInput) {
        e.stopImmediatePropagation();
        e.preventDefault();
        showStep(6);
      }
    }, true); // capture=true para interceptar antes del listener existente
  }

  const finish6 = document.querySelector("#step-6 .finish");
  if (step6 && finish6) {
    finish6.addEventListener("click", async function(){
      const kcalStr = (document.getElementById("kcal")?.value || "").trim();
      const kcal = parseInt(kcalStr, 10);
      if (!requireVal(!isNaN(kcal), "ingresa calorias por 100g")) return;
      if (!requireVal(kcal >= 200 && kcal <= 600, "calorias fuera de rango (200-600)")) return;
      datos.kcal_100g = kcal;

      // Re-asegurar datos requeridos
      if (!requireVal(!!datos.usuario_id, "usuario no valido")) return;
      if (!requireVal(!!datos.nombre, "falta nombre")) return;
      if (!requireVal(!!datos.sexo, "falta sexo")) return;
      if (!requireVal(!!datos.peso_kg, "falta peso")) return;
      if (!requireVal(!!datos.raza, "falta raza")) return;
      if (!datos.fecha_nacimiento) {
        const fecha = (document.getElementById("fecha")?.value || "").trim();
        datos.fecha_nacimiento = fecha || null;
      }

      try {
        const body = {
          usuario_id: datos.usuario_id,
          nombre: datos.nombre,
          sexo: datos.sexo,
          raza: datos.raza,
          peso_kg: datos.peso_kg,
          fecha_nacimiento: datos.fecha_nacimiento,
          kcal_100g: datos.kcal_100g
        };
        const m = await post(`${API}/mascotas`, body);
        if (!m || !m.id) throw new Error("no se pudo crear la mascota");
        alert("mascota creada con exito");
        location.href = "principal.html";
      } catch (e) {
        alert("error al guardar: " + (e.message || "desconocido"));
      }
    });
  }
})();

// ---- Paso 5: botón "Siguiente" hacia el Paso 6 ----
const next5Btn = document.querySelector("#step-5 .next");
if (next5Btn) next5Btn.addEventListener("click", () => {
  const fecha = (document.getElementById("fecha").value || "").trim();

  // Validación básica de fecha
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    alert("fecha invalida");
    return;
  }
  datos.fecha_nacimiento = fecha || null;

  // Requisitos previos ya cargados en pasos anteriores
  if (!requireVal(!!datos.usuario_id, "usuario no valido")) return;
  if (!requireVal(!!datos.nombre, "falta nombre")) return;
  if (!requireVal(!!datos.sexo, "falta sexo")) return;
  if (!requireVal(!!datos.peso_kg, "falta peso")) return;
  if (!requireVal(!!datos.raza, "falta raza")) return;

  // Ir al Paso 6 (kcal/100g)
  showStep(6);
});
