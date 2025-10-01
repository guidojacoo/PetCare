// perfil.js
const DBURL = "http://localhost:3000";

/* ========= Modal unificado (inyectado por JS, no requiere tocar HTML) ========= */
(function ensureModal(){
  if (document.getElementById("pc-overlay")) return;
  const tpl = `
    <div id="pc-overlay" class="pc-overlay" aria-hidden="true">
      <div class="pc-modal" role="dialog" aria-modal="true">
        <p class="pc-msg" id="pc-msg"></p>
        <div class="pc-actions" id="pc-actions">
          <button class="pc-btn pc-btn-primary" id="pc-ok">Aceptar</button>
        </div>
      </div>
    </div>`;
  document.addEventListener("DOMContentLoaded", ()=> {
    document.body.insertAdjacentHTML("beforeend", tpl);
  });
})();

function showMessage(msg){
  const overlay = document.getElementById("pc-overlay");
  const txt = document.getElementById("pc-msg");
  const actions = document.getElementById("pc-actions");
  const ok = document.getElementById("pc-ok");
  if(!overlay || !txt || !actions || !ok) return alert(msg); // fallback

  txt.textContent = msg;
  // reset acciones a sólo “Aceptar”
  actions.innerHTML = "";
  actions.appendChild(ok);
  ok.textContent = "Cerrar";
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden","false");

  const close = ()=> {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden","true");
    ok.removeEventListener("click", close);
  };
  ok.addEventListener("click", close);
}

function showConfirm(msg){
  return new Promise(resolve=>{
    const overlay = document.getElementById("pc-overlay");
    const txt = document.getElementById("pc-msg");
    const actions = document.getElementById("pc-actions");
    if(!overlay || !txt || !actions) { resolve(confirm(msg)); return; } // fallback

    txt.textContent = msg;

    actions.innerHTML = `
      <button class="pc-btn pc-btn-ghost"  id="pc-cancel">Cancelar</button>
      <button class="pc-btn pc-btn-danger" id="pc-yes">Eliminar</button>
    `;
    const btnYes = document.getElementById("pc-yes");
    const btnCancel = document.getElementById("pc-cancel");

    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden","false");

    const cleanup = (val)=>{
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden","true");
      btnYes.removeEventListener("click", onYes);
      btnCancel.removeEventListener("click", onCancel);
      resolve(val);
    };
    const onYes = ()=> cleanup(true);
    const onCancel = ()=> cleanup(false);

    btnYes.addEventListener("click", onYes);
    btnCancel.addEventListener("click", onCancel);
  });
}

/* ====== Sesión unificada + migración (usuario -> petcare_user) ====== */
(function migrateSessionKey(){
  try {
    const NEW_KEY = "petcare_user";
    const OLD_KEY = "usuario";
    const newVal = localStorage.getItem(NEW_KEY);
    const oldVal = localStorage.getItem(OLD_KEY);
    if (!newVal && oldVal) {
      localStorage.setItem(NEW_KEY, oldVal);
      localStorage.removeItem(OLD_KEY);
    }
  } catch(e) {}
})();

function getUser() {
  try { return JSON.parse(localStorage.getItem("petcare_user")); } catch { return null; }
}
function setUser(u) {
  localStorage.setItem("petcare_user", JSON.stringify(u));
}

/* ====== Boot ====== */
document.addEventListener("DOMContentLoaded", async () => {
  const u = getUser();
  if (!u || !u.id) { location.href = "login.html"; return; }

  await cargarUsuario(u.id);
  await cargarMascotas(u.id);
  wireEditarPerfil(u.id);
  wireEditorMascota(u.id);
  enhanceSelect(document.getElementById('m-sexo'));
});

/* ====== Usuario ====== */
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
    showMessage("No se pudo cargar el usuario");
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

      if (!email) { showMessage("Ingresá un email válido"); return; }
      if ((pass1 && !pass2) || (!pass1 && pass2)) { showMessage("Completá ambas contraseñas"); return; }
      if (pass1 && pass2 && pass1 !== pass2) { showMessage("Las contraseñas no coinciden"); return; }

      const body = { email };
      if (pass1) body.password = pass1;

      try {
        const r = await fetch(`${DBURL}/usuarios/${userId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Error");

        // Refresco UI + sesión unificada
        document.getElementById("user-email").textContent = d.email || email;
        const u = getUser();
        setUser({ ...u, email: d.email || email });

        showMessage("Perfil actualizado");
        form.classList.add("hidden");
        document.getElementById("edit-pass").value = "";
        document.getElementById("edit-pass2").value = "";
      } catch (e) {
        showMessage("No se pudo actualizar el perfil");
      }
    });
  }
}

/* ====== Mascotas ====== */
async function cargarMascotas(userId) {
  const ul = document.getElementById("lista-mascotas");
  ul.innerHTML = "<li class='item'><span class='meta'>Cargando...</span></li>";

  try {
    // Endpoint correcto por usuario (evita bajar todas)
    const r = await fetch(`${DBURL}/usuarios/${userId}/mascotas`);
    const mias = await r.json();
    if (!r.ok) throw new Error(mias.error || "Error");

    if (!Array.isArray(mias) || mias.length === 0) {
      ul.innerHTML = `
        <li class="item">
          <span class="meta">No tenés mascotas.</span><br>
          <button id="btn-crear-mascota"
                  style="margin-top:10px; padding:10px 16px; border:none; border-radius:8px; background:#22c55e; color:#fff; font-weight:bold; cursor:pointer;">
            Crear Mascota
          </button>
        </li>
      `;
      document.getElementById("btn-crear-mascota")?.addEventListener("click", () => {
        location.href = "mascota.html";
      });
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
    showMessage("No se pudieron cargar las mascotas");
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

  // Actualizar el “select lindo” si ya está activo
  refreshNiceSelectLabel(document.getElementById('m-sexo'));
}

function wireEditorMascota(userId) {
  const editor = document.getElementById("editor-mascota");
  if (!editor) return;

  const btnCerrar = document.getElementById("btn-cerrar-editor");
  btnCerrar?.addEventListener("click", () => editor.classList.add("hidden"));

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

        showMessage("Mascota actualizada");
        await cargarMascotas(userId);
      } catch (e) {
        showMessage("No se pudo actualizar la mascota");
      }
    });
  }

  const btnBorrar = document.getElementById("btn-borrar-mascota");
  if (btnBorrar) {
    btnBorrar.addEventListener("click", async () => {
      const id = Number(document.getElementById("mascota-id").value);
      if (!id) return;
      const ok = await showConfirm("¿Seguro que querés borrar esta mascota?");
      if (!ok) return;

      try {
        const r = await fetch(`${DBURL}/mascotas/${id}`, { method: "DELETE" });
        if (!r.ok && r.status !== 204) {
          const d = await r.json().catch(()=> ({}));
          throw new Error(d.error || "Error");
        }
        
        editor.classList.add("hidden");
        await cargarMascotas(userId);
      } catch (e) {
        
      }
    });
  }
}

/* ====== "Select lindo" para #m-sexo ====== */
function enhanceSelect(native){
  if(!native || native.__nice) return;
  native.classList.add('sr-only');    // oculto visual pero accesible
  native.__nice = true;

  const wrap = document.createElement('div');
  wrap.className = 'nice-select';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nice-select__button';
  btn.setAttribute('aria-haspopup','listbox');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = native.options[native.selectedIndex]?.text || 'Seleccionar';

  const menu = document.createElement('ul');
  menu.className = 'nice-select__menu';
  menu.setAttribute('role','listbox');

  [...native.options].forEach(opt=>{
    const li = document.createElement('li');
    li.className = 'nice-select__option';
    li.setAttribute('role','option');
    li.dataset.value = opt.value;
    li.textContent = opt.textContent;
    if(opt.selected) li.setAttribute('aria-selected','true');
    li.addEventListener('click', ()=>{
      native.value = opt.value;
      native.dispatchEvent(new Event('change', {bubbles:true}));
      btn.textContent = opt.textContent;
      menu.querySelectorAll('[aria-selected="true"]').forEach(n=>n.removeAttribute('aria-selected'));
      li.setAttribute('aria-selected','true');
      wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false');
    });
    menu.appendChild(li);
  });

  btn.addEventListener('click', ()=>{
    const open = wrap.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e)=>{
    if(!wrap.contains(e.target)){
      wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false');
    }
  });

  // teclado básico
  btn.addEventListener('keydown', (e)=>{
    const opts = [...menu.querySelectorAll('.nice-select__option')];
    const iSel = opts.findIndex(o=>o.getAttribute('aria-selected')==='true');
    if(e.key==='Escape'){ wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    if(e.key==='ArrowDown' || e.key==='ArrowUp'){
      e.preventDefault();
      let i = iSel >= 0 ? iSel : 0;
      if(e.key==='ArrowDown') i = Math.min(opts.length-1, i + 1);
      if(e.key==='ArrowUp')   i = Math.max(0, i - 1);
      opts[i]?.click();
      wrap.classList.add('open'); btn.setAttribute('aria-expanded','true');
    }
    if(e.key==='Enter' && wrap.classList.contains('open')){
      wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false');
    }
  });

  native.parentNode.insertBefore(wrap, native);
  wrap.appendChild(btn);
  wrap.appendChild(menu);

  // Guardamos referencias para refrescar label luego
  native.__niceWrap = wrap;
  native.__niceBtn  = btn;
}

function refreshNiceSelectLabel(native){
  if (!native || !native.__niceBtn) return;
  const txt = native.options[native.selectedIndex]?.text || 'Seleccionar';
  native.__niceBtn.textContent = txt;
}

/* Logout: limpia sesión y te lleva a login */
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
  btnLogout.addEventListener("click", () => {
    try {
      localStorage.removeItem("petcare_user");
      localStorage.removeItem("usuario"); // <-- eliminar también la clave antigua
    } catch {}
    // Ir a login (desde ahí podés iniciar con otra cuenta o ir a registro)
    location.href = "login.html";
  });
}

/* ------ Mostrar / ocultar contraseña (un ojo controla ambos) ------ */
function setupPasswordToggle(btn) {
  const targets = (btn.dataset.target || "").split(",");
  const inputs = targets.map(id => document.getElementById(id)).filter(Boolean);

  if (!inputs.length) return;

  btn.addEventListener('click', () => {
    // animación blink
    btn.classList.add('blink');
    setTimeout(() => btn.classList.remove('blink'), 160);

    const isOff = btn.classList.contains('off');
    if (isOff) {
      // Mostrar
      inputs.forEach(inp => inp.type = 'text');
      btn.classList.remove('off');
      btn.setAttribute('aria-label','Ocultar contraseña');
    } else {
      // Ocultar
      inputs.forEach(inp => inp.type = 'password');
      btn.classList.add('off');
      btn.setAttribute('aria-label','Mostrar contraseña');
    }
  });
}

document.querySelectorAll('.toggle-pass').forEach(setupPasswordToggle);
