/* ================================
  DRAGONKAEL RESEARCH LAB CONFIG
  ================================

  /* config/lab-config.js
  --------------------
  EDITABLE: Cambia username/repo o agrega secciones.
  Añadir una nueva sección:
  1) crear carpeta (ej. "papers/")
  2) agregar objeto en sections: { name:"Papers", folder:"papers", elementId:"papers-list" }
  3) añadir <div class="section"> con <ul id="papers-list"></ul> en index.html

  TODO LO EDITABLE PARA ESCALAR
  se encuentra aquí.
*/

const LAB_CONFIG = {

  // ⚙️ Cambiar si el repo cambia
  githubUser: "DragonKael",           // <- EDITABLE: tu usuario GitHub
  githubRepo: "DragonKael.github.io", // <- EDITABLE: repo (normalmente username.github.io)
  maxItemsPerSection: 100,            // <- limite visual por sección
    // 📂 Secciones del laboratorio
    sections: [

        {
            name: "Research",
            folder: "research",
            elementId: "research-list"
        },

        {
            name: "Projects",
            folder: "projects",
            elementId: "projects-list"
        },

        {
            name: "Experiments",
            folder: "experiments",
            elementId: "experiments-list"
        },

        {
            name: "Notes",
            folder: "notes",
            elementId: "notes-list"
      },
      {
        name: "Infographics",
        folder: "infographics",
        elementId: "infographics-list"
      },
      { name: "Papers", folder: "papers", elementId: "papers-list" }
    ],

    // Opciones UI
      showFeaturedFirst: true,            // mostrar primero los items featured
      enableSearch: true,
      enableFilters: true
}

/*
PARA CREAR UNA NUEVA SECCIÓN FUTURA

1️⃣ Crear carpeta en el repo
ejemplo:

papers/

2️⃣ agregar al config

{
   name: "Papers",
   folder: "papers",
   elementId: "papers-list"
}

3️⃣ agregar div en index.html
*/