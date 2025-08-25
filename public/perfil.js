const DBURL = "http://localhost:3000";

function getUsuario() {
  try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; }
}

document.addEventListener("DOMContentLoaded", async () => {
  const u = getUsuario();
  if (!u || !u.id) { location.href = "login.html"; return; }

  await cargarUsuario(u.id);

  await cargarMascotas(u.id);

  wireEditarPerfil(u.id);

  wireEditorMascota(u.id);
});

async function cargarUsuario(userId) {
  try {
    const r = await fetch(`${DBURL}/usuarios/${userId}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Error");

    document.getElementById("user-nombre").textContent = d.nombre || "";
    document.getElementById("user-email").textContent  = d.email  || "";
    const inEmail = document.getElementById("edit-email");
    if (inEmail) inEmail.value = d.email || "";
  } catch (e) {
    alert("No se pudo cargar el usuario");
  }
}

function wireEditarPerfil(userId) {
  const btnToggle = document.getElementById("btn-toggle-editar");
  const form = document.getElementById("form-editar");

  if (btnToggle && form) {
    btnToggle.addEventListener("click", () => {
      form.classList.toggle("hidden");
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = (document.getElementById("edit-email").value || "").trim();
      const pass1 = document.getElementById("edit-pass").value || "";
      const pass2 = document.getElementById("edit-pass2").value || "";

      if (!email) { alert("Ingresá un email válido"); return; }
      if ((pass1 && !pass2) || (!pass1 && pass2)) { alert("Completá ambas contraseñas"); return; }
      if (pass1 && pass2 && pass1 !== pass2) { alert("Las contraseñas no coinciden"); return; }

      const body = { email };
      if (pass1) body.password = pass1;

      try {
        const r = await fetch(`${DBURL}/usuarios/${userId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Error");

        document.getElementById("user-email").textContent = d.email || email;
        const u = getUsuario();
        localStorage.setItem("usuario", JSON.stringify({ ...u, email: d.email || email }));
        alert("Perfil actualizado");
        form.classList.add("hidden");
        document.getElementById("edit-pass").value = "";
        document.getElementById("edit-pass2").value = "";
      } catch (e) {
        alert("No se pudo actualizar el perfil");
      }
    });
  }
}

async function cargarMascotas(userId) {
  const ul = document.getElementById("lista-mascotas");
  ul.innerHTML = "<li class='item'><span class='meta'>Cargando...</span></li>";

  try {
    const r = await fetch(`${DBURL}/mascotas`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Error");

    const mias = d.filter(m => m.usuario_id === userId);
    if (mias.length === 0) {
      ul.innerHTML = "<li class='item'><span class='meta'>No tenés mascotas.</span></li>";
      return;
    }

    ul.innerHTML = mias.map(m => {
      const meta = [
        m.sexo ? m.sexo : null,
        m.raza ? m.raza : null,
        m.peso_kg ? `${m.peso_kg} kg` : null
      ].filter(Boolean).join(" • ");

      return `
        <li class="item" data-id="${m.id}">
          <div>
            <div class="name">${m.nombre || ""}</div>
            <div class="meta">${meta}</div>
          </div>
          <div class="actions">
            <button class="btn btn-ghost btn-editar" type="button">✎ Editar</button>
          </div>
        </li>
      `;
    }).join("");

    ul.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", () => {
        const li = btn.closest(".item");
        const id = Number(li.dataset.id);
        const mascota = mias.find(x => x.id === id);
        abrirEditor(mascota);
      });
    });
  } catch (e) {
    alert("No se pudieron cargar las mascotas");
  }
}

function abrirEditor(m) {
  document.getElementById("editor-mascota").classList.remove("hidden");
  document.getElementById("mascota-id").value = m.id;
  document.getElementById("m-nombre").value = m.nombre || "";
  document.getElementById("m-sexo").value = m.sexo || "";
  document.getElementById("m-raza").value = m.raza || "";
  document.getElementById("m-peso").value = m.peso_kg || "";
  document.getElementById("m-fecha").value = m.fecha_nacimiento ? String(m.fecha_nacimiento).slice(0,10) : "";
}

function wireEditorMascota(userId) {
  const editor = document.getElementById("editor-mascota");
  if (!editor) return;

  const btnCerrar = document.getElementById("btn-cerrar-editor");
  if (btnCerrar) btnCerrar.addEventListener("click", () => editor.classList.add("hidden"));

  const form = document.getElementById("form-mascota");
  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const id = Number(document.getElementById("mascota-id").value);
      const body = {
        nombre: (document.getElementById("m-nombre").value || "").trim() || null,
        sexo: document.getElementById("m-sexo").value || null,
        raza: (document.getElementById("m-raza").value || "").trim() || null,
        peso_kg: document.getElementById("m-peso").value ? Number(document.getElementById("m-peso").value) : null,
        fecha_nacimiento: document.getElementById("m-fecha").value || null
      };

      try {
        const r = await fetch(`${DBURL}/mascotas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Error");

        alert("Mascota actualizada");
        await cargarMascotas(userId);
      } catch (e) {
        alert("No se pudo actualizar la mascota");
      }
    });
  }

  const btnBorrar = document.getElementById("btn-borrar-mascota");
  if (btnBorrar) {
    btnBorrar.addEventListener("click", async () => {
      const id = Number(document.getElementById("mascota-id").value);
      if (!id) return;
      if (!confirm("¿Seguro que querés borrar esta mascota?")) return;

      try {
        const r = await fetch(`${DBURL}/mascotas/${id}`, { method: "DELETE" });
        if (!r.ok && r.status !== 204) {
          const d = await r.json().catch(()=> ({}));
          throw new Error(d.error || "Error");
        }
        alert("Mascota eliminada");
        editor.classList.add("hidden");
        await cargarMascotas(userId);
      } catch (e) {
        alert("No se pudo borrar la mascota");
      }
    });
  }
}
