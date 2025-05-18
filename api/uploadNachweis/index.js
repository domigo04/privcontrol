const multiparty = require("multiparty");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Nur POST erlaubt",
    };
    return;
  }

  const form = new multiparty.Form();

  try {
    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    console.log("✅ Hochgeladene Felder:", data.fields);
    console.log("📁 Hochgeladene Dateien:", data.files);

    const uploadedCount = Object.keys(data.files).reduce(
      (sum, key) => sum + data.files[key].length,
      0
    );

    context.res = {
      status: 200,
      headers: { "Content-Type": "text/plain" },
      body: `✅ Upload erfolgreich. ${uploadedCount} Datei(en) empfangen.`,
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "text/plain" },
      body: "❌ Fehler beim Hochladen: " + err.message,
    };
  }
};
