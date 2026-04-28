const personas = ["Gonza", "Gian", "Mario", "Alexander", "Manu", "Mati", "JP", "Juanito", "Fabi", "Tata"];

const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbx_uOlIFuV3QwTya9dGSTPzBF9kDFmSinrIFxXXgcLyVLGu49ytiGaSvAPvJ8nvzrjn/exec";

const detallesAseo = {
  "Living comedor y baño": "• Ordenar, barrer y trapear.<br>• Sacar cenizas.<br>• Limpiar baños completos con cloro.",
  "Sala estudio y baños": "• Ordenar sala.<br>• Barrer y trapear.<br>• Limpiar baños."
};

const base = {
  "Lunes": [{ nombre: "Living comedor y baño", responsable: "Gonza" }, { nombre: "Sala estudio y baños", responsable: "Mati" }],
  "Martes": [{ nombre: "Living comedor y baño", responsable: "Gian" }, { nombre: "Sala estudio y baños", responsable: "JP" }],
  "Miércoles": [{ nombre: "Living comedor y baño", responsable: "Mario" }, { nombre: "Sala estudio y baños", responsable: "Juanito" }],
  "Jueves": [{ nombre: "Living comedor y baño", responsable: "Alexander" }, { nombre: "Sala estudio y baños", responsable: "Fabi" }],
  "Viernes": [{ nombre: "Living comedor y baño", responsable: "Manu" }, { nombre: "Sala estudio y baños", responsable: "Tata" }]
};

let data = JSON.parse(localStorage.getItem("app")) || { tareas: {}, evidencias: [] };

function guardar() {
  localStorage.setItem("app", JSON.stringify(data));
}

/* MENU */
function toggleMenu() {
  document.getElementById("sidebar").classList.toggle("open");
}

/* DARK MODE */
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";

  if (isDark) {
    html.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
}

/* TOAST */
function toast(msg, color = "#2ecc71") {
  const t = document.createElement("div");
  t.innerText = msg;
  t.style = `
    position:fixed;
    bottom:30px;
    left:50%;
    transform:translateX(-50%);
    background:${color};
    color:white;
    padding:12px 18px;
    border-radius:10px;
    z-index:9999;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/* COMPRESION */
async function comprimirImagen(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const size = 500;
        canvas.width = size;
        canvas.height = (img.height * size) / img.width;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.6).split(",")[1]);
      };
    };
  });
}

/* PREVIEW */
function previewImagen(input, id) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById("preview_" + id);
    img.src = e.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
}

/* HOY */
function renderHoy() {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaNombre = dias[new Date().getDay()];
  const cont = document.getElementById("mainContent");

  document.getElementById("titulo").innerText = "Hoy (" + diaNombre + ")";
  cont.innerHTML = "";

  if (!base[diaNombre]) {
    cont.innerHTML = "<div class='card'>No hay tareas 😎</div>";
    return;
  }

  if (!data.tareas[diaNombre]) {
    data.tareas = {};
    data.tareas[diaNombre] = base[diaNombre].map(t => ({ ...t, estado: "pendiente" }));
    guardar();
  }

  data.tareas[diaNombre].forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "tarea";

    div.innerHTML = `
      <h3>${t.nombre}</h3>
      <div class="checklist">${detallesAseo[t.nombre]}</div>

      <select id="sel_${i}"></select>

      <input type="file" id="f_${i}" accept="image/*">
      <img id="preview_${i}" style="display:none"/>

      <button id="btn_${i}" class="btn-confirmar"></button>
    `;

    cont.appendChild(div);

    const select = document.getElementById("sel_" + i);
    personas.forEach(p => {
      const op = document.createElement("option");
      op.value = p;
      op.text = p;
      if (p === t.responsable) op.selected = true;
      select.appendChild(op);
    });

    const fileInput = document.getElementById("f_" + i);
    fileInput.onchange = () => previewImagen(fileInput, i);

    const btn = document.getElementById("btn_" + i);
    btn.innerText = t.estado === "hecho" ? "✅ Enviado" : "🚀 Enviar";

    btn.onclick = async () => {
      const file = fileInput.files[0];
      if (!file) return toast("Sube una imagen", "#e74c3c");

      btn.innerText = "⏳ Subiendo...";
      btn.disabled = true;

      try {
        const img64 = await comprimirImagen(file);

        const fd = new FormData();
        fd.append("dia", diaNombre);
        fd.append("tarea", t.nombre);
        fd.append("responsable", t.responsable);
        fd.append("img", img64);

        await fetch(GOOGLE_URL, {
          method: "POST",
          body: fd
        });

        t.estado = "hecho";

        data.evidencias.unshift({
          tarea: t.nombre,
          responsable: t.responsable,
          fecha: new Date().toLocaleString(),
          img: img64
        });

        guardar();

        btn.innerText = "✅ Enviado";
        toast("Subido 🚀");

        // RESET
        fileInput.value = "";
        const preview = document.getElementById("preview_" + i);
        preview.src = "";
        preview.style.display = "none";

        btn.disabled = false;
        btn.innerText = "📸 Subir otra";

      } catch {
        toast("Error al subir", "#e74c3c");
        btn.disabled = false;
      }
    };
  });
}

/* REGISTRO */
function renderRegistro() {
  const cont = document.getElementById("mainContent");
  document.getElementById("titulo").innerText = "Registro";
  cont.innerHTML = "";

  data.evidencias.forEach(e => {
    const d = document.createElement("div");
    d.className = "card";

    d.innerHTML = `
      <b>${e.tarea}</b><br>
      ${e.responsable}<br>
      <small>${e.fecha}</small>
      ${e.img ? `<img src="data:image/jpeg;base64,${e.img}" />` : ""}
    `;

    cont.appendChild(d);
  });
}

/* NAV */
function cargarVista(v, el) {
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  if (el) el.classList.add("active");

  if (v === "hoy") renderHoy();
  if (v === "evidencias") renderRegistro();

  document.getElementById("sidebar").classList.remove("open");
}

/* INIT */
window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  cargarVista("hoy");
};
