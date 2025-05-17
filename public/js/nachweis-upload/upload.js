const button = document.getElementById('auftragAbsendenBtn');
    const statusDiv = document.getElementById('status');

    button.addEventListener('click', async () => {
      const nachweisDatei = document.getElementById('nachweisDatei').files[0];
      const zusatzDateien = document.getElementById('zusatzDateien').files;
      const lieferdatum = document.getElementById('lieferdatum').value;

      if (!nachweisDatei) {
        alert('Bitte lade zuerst den Energienachweis hoch.');
        return;
      }

      const formData = new FormData();
      formData.append('dateien', nachweisDatei);
      for (const file of zusatzDateien) {
        formData.append('dateien', file);
      }
      formData.append('lieferdatum', lieferdatum);

      statusDiv.innerHTML = '<div class="spinner-border" role="status"></div> Upload läuft...';

      try {
        const res = await fetch('https://<DEINE-FUNCTION-URL>.azurewebsites.net/api/<FUNCTION-NAME>', {
          method: 'POST',
          body: formData
        });

        const result = await res.text();
        statusDiv.innerHTML = `<div class="alert alert-success mt-3">✅ Erfolgreich hochgeladen: <br>${result}</div>`;
      } catch (err) {
        statusDiv.innerHTML = '<div class="alert alert-danger mt-3">❌ Fehler beim Hochladen</div>';
        console.error(err);
      }
    });