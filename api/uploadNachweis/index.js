const formidable = require("formidable");

module.exports = async function (context, req) {
  context.log("📥 Upload gestartet");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Nur POST erlaubt",
    };
    return;
  }

  try {
    const form = formidable({ multiples: true });

    await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          context.log("❌ Fehler beim Parsen:", err);
          context.res = {
            status: 500,
            headers: { "Content-Type": "text/plain" },
            body: "❌ Fehler beim Parsen: " + err.message,
          };
          return reject(err);
        }

        const uploadedFiles = Object.values(files).flat();
        context.log(`✅ Upload erfolgreich – empfangen: ${uploadedFiles.length} Datei(en)`);

        context.res = {
          status: 200,
          headers: { "Content-Type": "text/plain" },
          body: `✅ Upload erfolgreich: ${uploadedFiles.length} Datei(en)`,
        };
        resolve();
      });
    });
  } catch (error) {
    context.log("❌ Unerwarteter Fehler:", error);
    context.res = {
      status: 500,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Unerwarteter Fehler: " + error.message,
    };
  }
};
