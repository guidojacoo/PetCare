// mascota.js
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

function showMessage(msg) {
  let overlay = document.getElementById("msg-overlay");
  let txt = document.getElementById("msg-text");
  let btn = document.getElementById("msg-close");

  txt.textContent = msg;
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");

  btn.onclick = () => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  };
}

function requireVal(cond, msg) {
  if (!cond) { showMessage(msg); return false; }
  return true;
}

(function initUser(){
  let user = localStorage.getItem("petcare_user");
  if (!user) { showMessage("inicia sesion"); location.href = "login.html"; return; }
  try {
    let u = JSON.parse(user);
    datos.usuario_id = u?.id || null;
  } catch(e) {}
  if (!datos.usuario_id) { showMessage("no se encontro el usuario"); location.href = "login.html"; return; }
  showStep(1);
})();

// Paso 1: nombre
document.querySelector("#step-1 .next").addEventListener("click", () => {
  let nombre = (document.getElementById("nombre").value || "").trim();
  if (!requireVal(nombre.length >= 2, "Ingresa un nombre valido")) return;
  datos.nombre = nombre;
  showStep(2);
});

// Paso 2: sexo
const chipsSexo = document.querySelectorAll("#step-2 .chip");
const sexoCards = document.querySelectorAll("#step-2 .sexo-card");

function selectSexo(v){
  datos.sexo = v;

  // Toggle visual en chips
  chipsSexo.forEach(c => {
    const is = c.getAttribute("data-sexo") === v;
    c.classList.toggle("active", is);
  });

  // Toggle visual en cards (marco iluminado)
  sexoCards.forEach(c => {
    const is = c.getAttribute("data-sexo") === v;
    c.classList.toggle("active", is);
  });
}

// Click en chips
chipsSexo.forEach(chip => {
  chip.addEventListener("click", () => selectSexo(chip.getAttribute("data-sexo")));
});

// Click/teclado en cards (accesible con Enter/Espacio)
sexoCards.forEach(card => {
  const v = card.getAttribute("data-sexo");
  card.addEventListener("click", () => selectSexo(v));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectSexo(v);
    }
  });
});

document.querySelector("#step-2 .next").addEventListener("click", () => {
  if (!requireVal(!!datos.sexo, "Elegi un sexo")) return;
  showStep(3);
});


// Paso 3: peso
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
  if (!requireVal(!!datos.peso_kg, "Ingresa un peso valido")) return;
  showStep(4);
});

// Paso 4: raza
document.querySelector("#step-4 .next").addEventListener("click", () => {
  let raza = (document.getElementById("raza").value || "").trim();
  if (!requireVal(raza.length >= 2, "Ingresa una raza")) return;
  datos.raza = raza;
  showStep(5);
});

// Paso 5 → finalizar o ir a Paso 6 (kcal)
const finish5Btn = document.querySelector("#step-5 .finish");
if (finish5Btn) finish5Btn.addEventListener("click", async () => {
  let fecha = (document.getElementById("fecha").value || "").trim();
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { showMessage("fecha invalida"); return; }
  datos.fecha_nacimiento = fecha || null;

  if (!requireVal(!!datos.usuario_id, "Usuario no valido")) return;
  if (!requireVal(!!datos.nombre, "Falta un nombre")) return;
  if (!requireVal(!!datos.sexo, "Falta un sexo")) return;
  if (!requireVal(!!datos.peso_kg, "Falta un peso")) return;
  if (!requireVal(!!datos.raza, "Falta una raza")) return;

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
    if (!m || !m.id) throw new Error("No se pudo crear la mascota");
    showMessage("Mascota creada con exito");
    location.href = "principal.html";
  } catch (e) {
    showMessage("Error al guardar: " + (e.message || "desconocido"));
  }
});

// Estado kcal
if (!("kcal_100g" in datos)) datos.kcal_100g = null;

(function wireStep6(){
  const step6 = document.getElementById("step-6");
  const kcalInput = document.getElementById("kcal");
  const finish5 = document.querySelector("#step-5 .finish");

  if (step6 && finish5) {
    finish5.addEventListener("click", function(e){
      let fecha = (document.getElementById("fecha").value || "").trim();
      if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { showMessage("La fecha es invalida"); e.stopImmediatePropagation(); e.preventDefault(); return; }
      datos.fecha_nacimiento = fecha || null;

      if (!requireVal(!!datos.usuario_id, "Usuario no valido")) { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.nombre, "Falta un nombre"))         { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.sexo, "Falta un sexo"))             { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.peso_kg, "Falta un peso"))          { e.stopImmediatePropagation(); e.preventDefault(); return; }
      if (!requireVal(!!datos.raza, "Falta una raza"))             { e.stopImmediatePropagation(); e.preventDefault(); return; }

      if (!datos.kcal_100g && kcalInput) {
        e.stopImmediatePropagation();
        e.preventDefault();
        showStep(6);
      }
    }, true);
  }

  const finish6 = document.querySelector("#step-6 .finish");
  if (step6 && finish6) {
    finish6.addEventListener("click", async function(){
      const kcalStr = (document.getElementById("kcal")?.value || "").trim();
      const kcal = parseInt(kcalStr, 10);
      if (!requireVal(!isNaN(kcal), "ingresa calorias por 100g")) return;
      if (!requireVal(kcal >= 200 && kcal <= 600, "Calorias fuera de rango (200-600)")) return;
      datos.kcal_100g = kcal;

      if (!requireVal(!!datos.usuario_id, "Usuario no valido")) return;
      if (!requireVal(!!datos.nombre, "Falta un nombre")) return;
      if (!requireVal(!!datos.sexo, "Falta un sexo")) return;
      if (!requireVal(!!datos.peso_kg, "Falta un peso")) return;
      if (!requireVal(!!datos.raza, "Falta una raza")) return;
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
        if (!m || !m.id) throw new Error("No se pudo crear la mascota");
        showMessage("Mascota creada con exito");
        location.href = "principal.html";
      } catch (e) {
        showMessage("error al guardar: " + (e.message || "desconocido"));
      }
    });
  }
})();

// Botón "Siguiente" de Paso 5 -> Paso 6
const next5Btn = document.querySelector("#step-5 .next");
if (next5Btn) next5Btn.addEventListener("click", () => {
  const fecha = (document.getElementById("fecha").value || "").trim();
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    showMessage("Fecha invalida");
    return;
  }
  datos.fecha_nacimiento = fecha || null;

  if (!requireVal(!!datos.usuario_id, "Usuario no valido")) return;
  if (!requireVal(!!datos.nombre, "Falta un nombre")) return;
  if (!requireVal(!!datos.sexo, "Falta un sexo")) return;
  if (!requireVal(!!datos.peso_kg, "Falta un peso")) return;
  if (!requireVal(!!datos.raza, "Falta una raza")) return;

  showStep(6);
});
