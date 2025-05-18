const multiparty = require("multiparty");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Nur POST erlaubt.",
    };
    return;
  }

  const form = new multiparty.Form();

  try {
    await new Promise((resolve, reject) => {
      // multiparty erwartet req.on – darum geben wir Azure Functions "raw" weiter
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          // Beispiel-Ausgabe: Anzahl hochgeladener Dateien
          const uploadedCount = Object.values(files).reduce(
            (sum, arr) => sum + arr.length,
            0
          );

          context.res = {
            status: 200,
            headers: { "Content-Type": "text/plain" },
            body: `✅ Upload erfolgreich: ${uploadedCount} Datei(en) empfangen.`,
          };
          resolve();
        }
      });
    });
  } catch (error) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "text/plain" },
      body: `❌ Fehler beim Hochladen: ${error.message}`,
    };
  }
};
