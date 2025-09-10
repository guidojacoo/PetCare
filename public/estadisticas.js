const DBURL = "http://localhost:3000";

function getMascotaId() {
  const params = new URLSearchParams(location.search);
  return Number(params.get("id"));
}

async function cargarStats(id) {
  const r = await fetch(`${DBURL}/mascotas/${id}/stats`);
  if (!r.ok) throw new Error("No se pudieron obtener las estadísticas");
  return r.json();
}

function renderCharts(data) {
  const pesoLabels = data.pesos.map(p => p.fecha);
  const pesoData = data.pesos.map(p => p.peso_kg);
  new Chart(document.getElementById("pesoChart"), {
    type: "line",
    data: {
      labels: pesoLabels,
      datasets: [{
        label: "Peso (kg)",
        data: pesoData,
        borderColor: "#3b82f6",
        fill: false
      }]
    }
  });

  const comidaLabels = data.comidas.map(c => c.fecha);
  new Chart(document.getElementById("comidaChart"), {
    type: "bar",
    data: {
      labels: comidaLabels,
      datasets: [
        {
          label: "Planificadas",
          data: data.comidas.map(c => c.planificadas),
          backgroundColor: "rgba(255,99,132,0.5)"
        },
        {
          label: "Realizadas",
          data: data.comidas.map(c => c.realizadas),
          backgroundColor: "rgba(75,192,192,0.5)"
        }
      ]
    }
  });

  const aguaLabels = data.agua.map(a => a.fecha);
  new Chart(document.getElementById("aguaChart"), {
    type: "bar",
    data: {
      labels: aguaLabels,
      datasets: [{
        label: "Eventos de agua",
        data: data.agua.map(a => a.eventos),
        backgroundColor: "rgba(54,162,235,0.5)"
      }]
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = getMascotaId();
  if (!id) {
    alert("Mascota inválida");
    return;
  }
  try {
    const stats = await cargarStats(id);
    renderCharts(stats);
  } catch (e) {
    alert(e.message || "Error al cargar estadísticas");
  }
});
