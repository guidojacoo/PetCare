const DBURL = "http://localhost:3000";

function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario")) || JSON.parse(localStorage.getItem("petcare_user"));
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const u = getUsuario();
  if (!u || !u.id) return;

  const lista = document.getElementById("lista-mascotas");
  if (!lista) return;

  try {
    const r = await fetch(`${DBURL}/mascotas`);
    const data = await r.json();
    const mias = data.filter(m => m.usuario_id === u.id);
    if (mias.length === 0) {
      lista.innerHTML = "<li>No hay mascotas</li>";
      return;
    }
    lista.innerHTML = mias.map(m => `
      <li class="item">
        <span class="name">${m.nombre}</span>
        <a class="btn" href="estadisticas.html?id=${m.id}">Estadísticas</a>
      </li>
    `).join("");
  } catch (e) {
    lista.innerHTML = "<li>Error al cargar mascotas</li>";
  }
});
