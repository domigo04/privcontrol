function initMail() {
  const mailBtn = document.getElementById("sendMailBtn");
  if (mailBtn) {
    mailBtn.addEventListener("click", () => {
      // Mail-Logik
    });
  }
}

// 📁 pruefcontrol-mail.js

function generateAndOpenMail(state) {
  const kundenmail = document.getElementById("kundenmail").value || "kundemail@example.com";

  const mailtext = `Sehr geehrtes PrivControl-Team,%0D%0A%0D%0Aich sende Ihnen die Übersicht der benötigten Pflichtunterlagen für das Projekt ${state.projektname}.%0D%0AWunschtermin: ${state.wunschtermin}%0D%0AMeine E-Mail: ${kundenmail}%0D%0A%0D%0ABitte beachten Sie die Offerte im Anhang und antworten Sie mit den weiteren Schritten.`;

  window.location.href = `mailto:info@privcontrol.ch?subject=Pflichtunterlagen zu ${state.projektname}&body=${mailtext}`;
}
