const personas = ["Gonza","Gian","Mario","Alexander","Manu","Mati","JP","Juanito","Fabi","Tata"];
const GOOGLE_URL = "https://script.google.com/macros/s/AKfycby-Cg7XVD7v3e4UfSRcKTo7GhaFf5skMnVN2G3qKK-GtxbiAjYGQqy4FPqUYt5vznxP/exec";

const base = {
  "Lunes":[{"nombre":"Living comedor y baño","responsable":"Gonza"},{"nombre":"Sala estudio y baños","responsable":"Mati"}],
  "Martes":[{"nombre":"Living comedor y baño","responsable":"Gian"},{"nombre":"Sala estudio y baños","responsable":"JP"}],
  "Miércoles":[{"nombre":"Living comedor y baño","responsable":"Mario"},{"nombre":"Sala estudio y baños","responsable":"Juanito"}],
  "Jueves":[{"nombre":"Living comedor y baño","responsable":"Alexander"},{"nombre":"Sala estudio y baños","responsable":"Fabi"}],
  "Viernes":[{"nombre":"Living comedor y baño","responsable":"Manu"},{"nombre":"Sala estudio y baños","responsable":"Tata"}]
};

let data = JSON.parse(localStorage.getItem("app")) || {
  tareas:{},
  evidencias:[]
};

function guardar(){
  try {
    localStorage.setItem("app", JSON.stringify(data));
  } catch (e) {
    data.evidencias = data.evidencias.slice(0, 5);
    localStorage.setItem("app", JSON.stringify(data));
  }
}

function getDia(){
  return ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date().getDay()];
}

function initDia(){
  const dia = getDia();
  if(!base[dia]) return;
  if(!data.tareas[dia]){
    data.tareas[dia] = base[dia].map(t => ({
      nombre: t.nombre,
      responsable: t.responsable,
      responsableOriginal: t.responsable,
      estado:"pendiente",
      aviso:false
    }));
    guardar();
  }
}

function setActive(el){
  document.querySelectorAll(".menu-item").forEach(i=>i.classList.remove("active"));
  el.classList.add("active");
}

function cargarVista(v, el){
  if(el) setActive(el);
  if(v==="hoy") renderHoy();
  if(v==="evidencias") renderEvidencias();
  if(v==="personas") renderPersonas();
}

function renderHoy(){
  initDia();
  const cont = document.getElementById("mainContent");
  cont.innerHTML = "";
  const dia = getDia();
  const tareas = data.tareas[dia];

  if(!tareas){
    cont.innerHTML = "<h2>No hay aseo hoy 😎</h2>";
    return;
  }

  const hora = new Date().getHours();

  tareas.forEach(t => {
    const div = document.createElement("div");
    div.className = "tarea";
    const left = document.createElement("div");

    const select = document.createElement("select");
    personas.forEach(p=>{
      const op=document.createElement("option");
      op.value=p; op.text=p;
      if(p===t.responsable) op.selected=true;
      select.appendChild(op);
    });
    select.onchange=()=>{ t.responsable = select.value; guardar(); };

    let estado = t.estado === "hecho" ? "✅ Hecho" : (t.aviso ? "⚠ Avisó retraso" : "⏳ Pendiente");
    const estadoDiv=document.createElement("div");
    estadoDiv.className="estado";
    estadoDiv.innerText=estado;

    // --- SISTEMA DE FOTO ---
    const input=document.createElement("input");
    input.type="file";
    input.accept="image/*";
    input.style.marginTop = "10px";

    const btnConfirmar = document.createElement("button");
    btnConfirmar.innerText = "🚀 Confirmar Envío";
    btnConfirmar.className = "btn-confirmar";
    btnConfirmar.style.display = "none";

    input.onchange = (e) => {
        if(e.target.files.length > 0) btnConfirmar.style.display = "block";
    };

    btnConfirmar.onclick = () => {
      const file = input.files[0];
      const reader = new FileReader();
      btnConfirmar.innerText = "Enviando...";
      btnConfirmar.disabled = true;

      reader.onload=()=>{
        const base64Data = reader.result.split(",")[1];
        fetch(GOOGLE_URL, {
          method: "POST",
          mode: 'no-cors', 
          body: JSON.stringify({ tarea: t.nombre, responsable: t.responsable, img: base64Data })
        })
        .then(() => {
            alert("📸 ¡Enviado a Google!");
            t.estado = "hecho";
            data.evidencias.unshift({
                tarea: t.nombre,
                responsableActual: t.responsable,
                img: "https://via.placeholder.com/120?text=Subida", 
                fecha: new Date().toLocaleString()
            });
            guardar();
            renderHoy();
        });
      };
      reader.readAsDataURL(file);
    };

    left.innerHTML="<b>"+t.nombre+"</b><br>";
    left.appendChild(select);
    left.appendChild(estadoDiv);
    left.appendChild(input);
    left.appendChild(btnConfirmar);

    const right=document.createElement("div");
    if(t.estado !== "hecho"){
      const btnH=document.createElement("button");
      btnH.innerText="✔ Hecho";
      btnH.className="btn hecho";
      btnH.onclick=()=>{ t.estado="hecho"; guardar(); renderHoy(); };
      right.appendChild(btnH);
    }

    div.appendChild(left);
    div.appendChild(right);
    cont.appendChild(div);
  });
}

function renderEvidencias(){
  const cont = document.getElementById("mainContent");
  cont.innerHTML = "<h2>📸 Registro</h2>";
  data.evidencias.forEach(e=>{
    const div = document.createElement("div");
    div.className="card";
    div.innerHTML=`<b>${e.tarea}</b><br>${e.responsableActual}<br><small>${e.fecha}</small>`;
    cont.appendChild(div);
  });
}

function renderPersonas(){
  const cont = document.getElementById("mainContent");
  cont.innerHTML="<h2>👥 Integrantes</h2>";
  personas.forEach(p=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerText=p;
    cont.appendChild(div);
  });
}

cargarVista("hoy");
