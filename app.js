const personas = ["Gonza","Gian","Mario","Alexander","Manu","Mati","JP","Juanito","Fabi","Tata"];
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycby-Cg7XVD7v3e4UfSRcKTo7GhaFf5skMnVN2G3qKK-GtxbiAjYGQqy4FPqUYt5vznxP/exec";

const base = {
  "Lunes":[{"nombre":"Living comedor y baño","responsable":"Gonza"},{"nombre":"Sala estudio y baños","responsable":"Mati"}],
  "Martes":[{"nombre":"Living comedor y baño","responsable":"Gian"},{"nombre":"Sala estudio y baños","responsable":"JP"}],
  "Miércoles":[{"nombre":"Living comedor y baño","responsable":"Mario"},{"nombre":"Sala estudio y baños","responsable":"Juanito"}],
  "Jueves":[{"nombre":"Living comedor y baño","responsable":"Alexander"},{"nombre":"Sala estudio y baños","responsable":"Fabi"}],
  "Viernes":[{"nombre":"Living comedor y baño","responsable":"Manu"},{"nombre":"Sala estudio y baños","responsable":"Tata"}]
};

let data = JSON.parse(localStorage.getItem("app")) || { tareas:{}, evidencias:[] };

function guardar(){
  try { localStorage.setItem("app", JSON.stringify(data)); } 
  catch (e) { data.evidencias = data.evidencias.slice(0, 5); localStorage.setItem("app", JSON.stringify(data)); }
}

function getDia(){ return ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()]; }

function initDia(){
  const dia = getDia();
  if(!base[dia]) return;
  if(!data.tareas[dia]){
    data.tareas[dia] = base[dia].map(t => ({ nombre: t.nombre, responsable: t.responsable, estado:"pendiente" }));
    guardar();
  }
}

function cargarVista(v, el){
  if(el){
    document.querySelectorAll(".menu-item").forEach(i=>i.classList.remove("active"));
    el.classList.add("active");
  }
  v === "hoy" ? renderHoy() : (v === "evidencias" ? renderEvidencias() : renderPersonas());
}

function renderHoy(){
  initDia();
  const cont = document.getElementById("mainContent");
  cont.innerHTML = "";
  const tareas = data.tareas[getDia()];
  if(!tareas){ cont.innerHTML = "<h2>No hay aseo hoy 😎</h2>"; return; }

  tareas.forEach(t => {
    const div = document.createElement("div");
    div.className = "tarea";
    const left = document.createElement("div");
    left.innerHTML = `<b>${t.nombre}</b><br>`;

    const select = document.createElement("select");
    personas.forEach(p => {
      const op = document.createElement("option");
      op.value = p; op.text = p;
      if(p === t.responsable) op.selected = true;
      select.appendChild(op);
    });
    select.onchange = () => { t.responsable = select.value; guardar(); };

    const estadoDiv = document.createElement("div");
    estadoDiv.className = "estado";
    estadoDiv.innerText = t.estado === "hecho" ? "✅ Hecho" : "⏳ Pendiente";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    const btnConf = document.createElement("button");
    btnConf.innerText = "🚀 Confirmar Envío";
    btnConf.className = "btn-confirmar";
    btnConf.style.display = "none";

    input.onchange = (e) => { if(e.target.files.length > 0) btnConf.style.display = "block"; };

    btnConf.onclick = () => {
      const reader = new FileReader();
      btnConf.innerText = "Enviando...";
      btnConf.disabled = true;
      reader.onload = () => {
        fetch(GOOGLE_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({ tarea: t.nombre, responsable: t.responsable, img: reader.result.split(",")[1] }) })
        .then(() => {
          alert("¡Enviado!"); t.estado = "hecho";
          data.evidencias.unshift({ tarea: t.nombre, responsable: t.responsable, img: "https://via.placeholder.com/120?text=Subida", fecha: new Date().toLocaleString() });
          guardar(); renderHoy();
        });
      };
      reader.readAsDataURL(input.files[0]);
    };

    left.append(select, estadoDiv, input, btnConf);
    div.append(left);
    cont.append(div);
  });
}

function renderEvidencias(){
  const cont = document.getElementById("mainContent");
  cont.innerHTML = "<h2>📸 Registro</h2>";
  data.evidencias.forEach(e => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<b>${e.tarea}</b><br>${e.responsable}<br><small>${e.fecha}</small>`;
    cont.append(div);
  });
}

function renderPersonas(){
  const cont = document.getElementById("mainContent");
  cont.innerHTML = "<h2>👥 Integrantes</h2>";
  personas.forEach(p => {
    const div = document.createElement("div");
    div.className = "card"; div.innerText = p;
    cont.append(div);
  });
}
cargarVista("hoy");
