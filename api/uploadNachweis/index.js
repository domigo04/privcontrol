const formidable = require("formidable");

module.exports = async function (context, req) {
  context.log("📥 Upload gestartet");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Nur POST erlaubt"
    };
    return;
  }

  const form = formidable({ multiples: true });

  await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        context.log("❌ Fehler beim Parsen:", err);
        context.res = {
          status: 500,
          headers: { "Content-Type": "text/plain" },
          body: "❌ Fehler beim Hochladen: " + err.message
        };
        return reject(err);
      }

      const uploadedCount = Object.values(files).flat().length;

      context.res = {
        status: 200,
        headers: { "Content-Type": "text/plain" },
        body: `✅ Upload erfolgreich: ${uploadedCount} Datei(en)`
      };
      resolve();
    });
  });
};
