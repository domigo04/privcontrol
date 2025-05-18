const multiparty = require("multiparty");
const { Readable } = require("stream");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "Nur POST erlaubt",
    };
    return;
  }

  // 🔧 Azure Functions "req" ist kein richtiger Stream – wir brauchen einen!
  const stream = new Readable();
  stream.push(req.body);
  stream.push(null);
  req.pipe = stream.pipe.bind(stream); // ← Workaround, damit multiparty es „frisst“

  const form = new multiparty.Form();

  try {
    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

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
