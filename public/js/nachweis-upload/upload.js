document.getElementById('auftragAbsendenBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const nachweisDatei = document.getElementById('nachweisDatei').files[0];
  const zusatzDateien = document.getElementById('zusatzDateien').files;
  const lieferdatum = document.getElementById('lieferdatum').value;

  if (!nachweisDatei) {
    status.textContent = "Bitte den Energienachweis hochladen.";
    return;
  }

  const formData = new FormData();
  formData.append("nachweis", nachweisDatei);
  for (const file of zusatzDateien) {
    formData.append("zusatz", file);
  }
  formData.append("lieferdatum", lieferdatum);

  try {
    status.textContent = "⏳ Hochladen läuft...";
    
  const response = await fetch("/api/uploadNachweis", {
  method: "POST",
  body: formData
});

    const result = await response.text();
    status.textContent = result;
    
} catch (err) {
  console.error("❌ Fehler beim Upload:", err);
  status.textContent = "❌ Fehler beim Upload: " + err.message;
}

});
