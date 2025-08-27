const API = "http://localhost:3000";

// estado en memoria (se va completando por pasos)
let datos = {
  usuario_id: null,
  nombre: null,
  sexo: null,
  peso_kg: null,
  raza: null,
  fecha_nacimiento: null
};

// helpers simples
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

// init usuario
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

// paso 1: nombre
document.querySelector("#step-1 .next").addEventListener("click", () => {
  let nombre = (document.getElementById("nombre").value || "").trim();
  if (!requireVal(nombre.length >= 2, "ingresa un nombre valido")) return;
  datos.nombre = nombre;
  showStep(2);
});

// paso 2: sexo (chips .chip[data-sexo])
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

// paso 3: peso (chips o input)
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
  // si no uso chip, leer del input
  if (!datos.peso_kg) {
    let v = parseFloat(document.getElementById("peso").value || "0");
    if (v > 0) datos.peso_kg = v;
  }
  if (!requireVal(!!datos.peso_kg, "ingresa un peso valido")) return;
  showStep(4);
});

// paso 4: raza
document.querySelector("#step-4 .next").addEventListener("click", () => {
  let raza = (document.getElementById("raza").value || "").trim();
  if (!requireVal(raza.length >= 2, "ingresa una raza")) return;
  datos.raza = raza;
  showStep(5);
});

// paso 5: fecha + enviar todo junto
document.querySelector("#step-5 .finish").addEventListener("click", async () => {
  let fecha = (document.getElementById("fecha").value || "").trim();
  // validacion basica yyyy-mm-dd (si no hay, se permite null)
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert("fecha invalida"); return; }
  datos.fecha_nacimiento = fecha || null;

  // validaciones finales
  if (!requireVal(!!datos.usuario_id, "usuario no valido")) return;
  if (!requireVal(!!datos.nombre, "falta nombre")) return;
  if (!requireVal(!!datos.sexo, "falta sexo")) return;
  if (!requireVal(!!datos.peso_kg, "falta peso")) return;
  if (!requireVal(!!datos.raza, "falta raza")) return;

  // un unico POST con todo
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
