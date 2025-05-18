const formidable = require("formidable");
const streamifier = require("streamifier");

module.exports = async function (context, req) {
  context.log("📥 Upload gestartet");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "❌ Nur POST erlaubt"
    };
    return;
  }

  try {
    const form = formidable({ multiples: true });

    const stream = streamifier.createReadStream(req.body);

    await new Promise((resolve, reject) => {
      form.parse(stream, (err, fields, files) => {
        if (err) {
          context.log("❌ Fehler:", err);
          context.res = {
            status: 500,
            body: "❌ Fehler beim Hochladen: " + err.message
          };
          reject(err);
          return;
        }

        const uploadedCount = Object.values(files).flat().length;

        context.res = {
          status: 200,
          body: `✅ Upload erfolgreich: ${uploadedCount} Datei(en)`
        };
        resolve();
      });
    });
  } catch (err) {
    context.log("❌ Unerwarteter Fehler:", err);
    context.res = {
      status: 500,
      body: "❌ Unerwarteter Fehler: " + err.message
    };
  }
};
