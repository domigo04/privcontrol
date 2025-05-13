// Preislogik
const basispreis = 1500;
const preisText = document.getElementById("preisText");
const wunschterminInput = document.getElementById("wunschtermin");

function berechnePreis() {
  const jetzt = new Date();
  const gewuenscht = new Date(wunschterminInput.value);
  let endpreis = basispreis;

  const differenzMS = gewuenscht - jetzt;
  const differenzH = differenzMS / (1000 * 60 * 60);

  if (differenzH < 24 && differenzH > 0) {
    endpreis *= 1.2;
  }

  preisText.textContent = `CHF ${Math.round(endpreis)}.–`;
}

if (wunschterminInput) {
  wunschterminInput.addEventListener("change", berechnePreis);
}

// Erfolgs-Popup
const button = document.querySelector("button.btn-primary");
if (button) {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Vielen Dank! Deine Anfrage wurde erfolgreich übermittelt. 🚀\nWir melden uns so schnell wie möglich.");
  });
}
