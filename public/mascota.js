const API = "http://localhost:3000";
let mascotaId = null;
let datos = {};

// Helpers
async function post(url, body) {
  let r = await fetch(url, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  return await r.json();
}
async function put(url, body) {
  let r = await fetch(url, {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  return await r.json();
}
function showStep(n) {
  document.querySelectorAll(".step").forEach(s=> s.classList.remove("active"));
  document.getElementById("step-"+n).classList.add("active");
}

// Paso 1
document.querySelector("#step-1 .next").addEventListener("click", async ()=>{
  let nombre = document.getElementById("nombre").value.trim();
  if(!nombre) return alert("Ingresá un nombre");
  let u = JSON.parse(localStorage.getItem("usuario"));
  let m = await post(`${API}/mascotas`, { usuario_id:u.id, nombre });
  mascotaId = m.id;
  showStep(2);
});

// Paso 2
document.querySelectorAll("#step-2 .chip").forEach(ch=>{
  ch.addEventListener("click", ()=> {
    datos.sexo = ch.dataset.sexo;
    document.querySelectorAll("#step-2 .chip").forEach(c=>c.classList.remove("active"));
    ch.classList.add("active");
  });
});
document.querySelector("#step-2 .next").addEventListener("click", async ()=>{
  if(!datos.sexo) return alert("Elegí sexo");
  await put(`${API}/mascotas/${mascotaId}`, { sexo: datos.sexo });
  showStep(3);
});

// Paso 3
document.querySelectorAll("#step-3 .chip").forEach(ch=>{
  ch.addEventListener("click", ()=>{
    datos.peso = ch.dataset.peso;
    document.querySelectorAll("#step-3 .chip").forEach(c=>c.classList.remove("active"));
    ch.classList.add("active");
  });
});
document.querySelector("#step-3 .next").addEventListener("click", async ()=>{
  if(!datos.peso){
    datos.peso = document.getElementById("peso").value;
  }
  if(!datos.peso) return alert("Ingresá un peso");
  await put(`${API}/mascotas/${mascotaId}`, { peso_kg: datos.peso });
  showStep(4);
});

// Paso 4
document.querySelector("#step-4 .next").addEventListener("click", async ()=>{
  let raza = document.getElementById("raza").value.trim();
  if(!raza) return alert("Ingresá raza");
  await put(`${API}/mascotas/${mascotaId}`, { raza });
  showStep(5);
});

// Paso 5
document.querySelector("#step-5 .finish").addEventListener("click", async ()=>{
  let fecha = document.getElementById("fecha").value;
  await put(`${API}/mascotas/${mascotaId}`, { fecha_nacimiento: fecha });
  alert("Mascota creada con éxito");
  location.href="principal.html";
});
