const formidable = require("formidable");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { "Content-Type": "text/plain" },
      body: "Nur POST erlaubt",
    };
    return;
  }

  const form = formidable({ multiples: true });

  await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
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
