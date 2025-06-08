// pruefcontrol-formulare.js
function initFormularanzeige() {
  console.log("initFormularanzeige wurde ausgeführt");

  const gewerke = [
    { id: "heizung", label: "Heizung", icon: "fa-fire", nachweise: [
      "EN-103: Heizungs- und Warmwasseranlagen",
      "EN-120: Erneuerbare Wärme beim Wärmeerzeugerersatz"
    ] },
    { id: "lueftung", label: "Lüftung", icon: "fa-wind", nachweise: [
      "EN-105: Lüftungstechnische Anlagen",
      "EN-136: Lüftung/Klimatisierung bei Umbauten"
    ] },
    { id: "klima", label: "Klima", icon: "fa-snowflake", nachweise: [
      "EN-110: Kühlung/Befeuchtung",
      "EN-136: Lüftung/Klimatisierung bei Umbauten"
    ] },
    { id: "waermedaemmung", label: "Wärmedämmung", icon: "fa-border-top-left", nachweise: [
      "EN-102a: Einzelbauteilnachweis",
      "EN-102b: Systemnachweis"
    ] }
  ];

  const container = document.getElementById("dynamischerBereich");
  container.innerHTML = "";

  const row = document.createElement("div");
  row.classList.add("row", "gy-3", "gx-3");

  gewerke.forEach(gw => {
    const col = document.createElement("div");
    col.classList.add("col-12", "col-sm-6", "col-md-3");

    const wrapper = document.createElement("div");
    wrapper.classList.add("mb-3");

    const button = document.createElement("button");
    button.classList.add("btn", "btn-outline-dark", "w-100", "text-start", "d-flex", "align-items-center", "justify-content-between");
    button.setAttribute("type", "button");
    button.setAttribute("data-bs-toggle", "collapse");
    button.setAttribute("data-bs-target", `#collapse-${gw.id}`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `collapse-${gw.id}`);

    button.innerHTML = `<div><i class="fa ${gw.icon} me-2"></i>${gw.label}</div><i class="fa fa-chevron-down"></i>`;

    const collapse = document.createElement("div");
    collapse.classList.add("collapse", "mt-2");
    collapse.id = `collapse-${gw.id}`;

    const ul = document.createElement("ul");
    ul.classList.add("list-group", "list-group-flush");

    gw.nachweise.forEach(nachweis => {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center", "flex-wrap");

      const title = document.createElement("span");
      title.textContent = nachweis;

      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("btn-group", "btn-group-sm");
      buttonGroup.setAttribute("role", "group");

      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-outline-secondary mini-btn";
      addBtn.innerText = "+";

      let pkBtn, akBtn, removeBtn;

      addBtn.addEventListener("click", () => {
        addBtn.style.display = "none";

        pkBtn = document.createElement("button");
        pkBtn.className = "btn btn-outline-primary mini-btn";
        pkBtn.innerText = "PK";

        akBtn = document.createElement("button");
        akBtn.className = "btn btn-outline-primary mini-btn";
        akBtn.innerText = "AK";

        removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-outline-danger mini-btn";
        removeBtn.innerText = "–";

        const select = (btn) => {
          // Beide Buttons zurücksetzen
          pkBtn.classList.remove("btn-primary");
          akBtn.classList.remove("btn-primary");

          // Markiere den gedrückten Button
          btn.classList.add("btn-primary");
        };

        pkBtn.addEventListener("click", () => select(pkBtn));
        akBtn.addEventListener("click", () => select(akBtn));

        removeBtn.addEventListener("click", () => {
          pkBtn.remove();
          akBtn.remove();
          removeBtn.remove();
          addBtn.style.display = "inline-block";
        });

        buttonGroup.appendChild(pkBtn);
        buttonGroup.appendChild(akBtn);
        buttonGroup.appendChild(removeBtn);
      });

      buttonGroup.appendChild(addBtn);
      li.appendChild(title);
      li.appendChild(buttonGroup);
      ul.appendChild(li);
    });

    collapse.appendChild(ul);
    wrapper.appendChild(button);
    wrapper.appendChild(collapse);
    col.appendChild(wrapper);
    row.appendChild(col);
  });

  container.appendChild(row);
}
