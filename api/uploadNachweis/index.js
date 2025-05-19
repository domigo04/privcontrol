import { BlobServiceClient } from "@azure/storage-blob";
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
    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const uploadedFile = files.file; // 'file' = Feldname im Upload-Formular
    const fileStream = uploadedFile.filepath
      ? require("fs").createReadStream(uploadedFile.filepath)
      : null;

    if (!fileStream) throw new Error("📄 Datei konnte nicht gelesen werden");

    const sasUrl = "https://<your-account>.blob.core.windows.net?<SAS-token>";
    const containerName = "my-container";

    const blobServiceClient = new BlobServiceClient(sasUrl);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(uploadedFile.originalFilename);

    await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
      blobHTTPHeaders: { blobContentType: uploadedFile.mimetype },
    });

    context.res = {
      status: 200,
      body: "✅ Upload erfolgreich",
    };
  } catch (error) {
    context.log("❌ Fehler:", error);
    context.res = {
      status: 500,
      body: "❌ Upload fehlgeschlagen: " + error.message,
    };
  }
};