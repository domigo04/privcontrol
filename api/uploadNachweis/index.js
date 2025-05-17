const { BlobServiceClient } = require('@azure/storage-blob');
const multiparty = require('multiparty');
const fs = require('fs');

module.exports = async function (context, req) {
  context.log('Upload-Funktion wurde aufgerufen.');

  // Storage-Zugangsdaten aus Umgebungsvariable
  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = 'uploads'; // muss mit deinem Container übereinstimmen

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    context.res = {
      status: 500,
      body: "Azure Storage-Verbindung fehlt",
    };
    return;
  }

  // Datei + Felder aus dem Request extrahieren
  const form = new multiparty.Form();

  await new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const file = files.nachweisDatei?.[0];
      const lieferdatum = fields.lieferdatum?.[0];

      if (!file) {
        context.res = {
          status: 400,
          body: "Energienachweis fehlt!",
        };
        resolve();
        return;
      }

      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const blobName = `${new Date().toISOString()}_${file.originalFilename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const uploadResponse = await blockBlobClient.uploadFile(file.path);

        context.res = {
          status: 200,
          body: {
            message: "Upload erfolgreich!",
            filename: blobName,
            lieferdatum: lieferdatum || "Kein Datum angegeben",
          },
        };
        resolve();
      } catch (uploadErr) {
        context.res = {
          status: 500,
          body: "Upload fehlgeschlagen: " + uploadErr.message,
        };
        reject(uploadErr);
      }
    });
  });
};
