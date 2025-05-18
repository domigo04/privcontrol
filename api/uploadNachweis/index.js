const formidable = require("formidable");

module.exports = async function (context, req) {
  context.log("📥 UPLOAD gestartet");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Nur POST erlaubt",
    };
    return;
  }

  const form = formidable({ multiples: true });

  // formidable erwartet einen Stream → Azure req.body ist Buffer bei dataType: binary
  const mockReq = require("streamifier").createReadStream(req.body);

  await new Promise((resolve, reject) => {
    form.parse(mockReq, (err, fields, files) => {
      if (err) {
        context.res = {
          status: 500,
          headers: { "Content-Type": "text/plain" },
          body: `❌ Fehler beim Hochladen: ${err.message}`,
        };
        reject(err);
        return;
      }

      const uploadedCount = Object.values(files).flat().length;

      context.res = {
        status: 200,
        headers: { "Content-Type": "text/plain" },
        body: `✅ Upload erfolgreich: ${uploadedCount} Datei(en) empfangen.`,
      };
      resolve();
    });
  });
};
