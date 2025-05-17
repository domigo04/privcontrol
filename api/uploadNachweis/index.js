const multiparty = require("multiparty");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Nur POST erlaubt"
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

    context.res = {
      status: 200,
      body: `✅ Upload erhalten! ${Object.keys(data.files).length} Datei(en)`
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: "❌ Fehler beim Parsen: " + err.message
    };
  }
};
