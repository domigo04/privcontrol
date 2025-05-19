const { BlobServiceClient } = require("@azure/storage-blob");

const formidable = require("formidable");
const fs = require("fs");

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

      const test = "test";
  try {
    const form = new formidable.IncomingForm({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const uploadedFile = files.file; // 'file' ist der Feldname im Upload-Formular
    test = "uploadedFile";
    const fileStream = fs.createReadStream(uploadedFile.filepath);
    test = "fileStream";
    const connectionString =
      "DefaultEndpointsProtocol=https;AccountName=privcontrolstorage;AccountKey=HMtqb4ae0Lm0a7/6kGmv+3nuSZRz0RZm4zjQINbUsMBdQsfc0V43xx3ud0EfNIb/SGze7AwxRw8f+ASt2NHA3w==;EndpointSuffix=core.windows.net";

    const containerName = "uploads";
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    test = "blobServiceClient";
    const containerClient = blobServiceClient.getContainerClient(containerName);
    test = "containerClient";
    const blockBlobClient = containerClient.getBlockBlobClient(uploadedFile.originalFilename);
    test = "blockBlobClient";
    await blockBlobClient.uploadStream(fileStream, undefined, undefined, {
      blobHTTPHeaders: { blobContentType: uploadedFile.mimetype },
    });
    test = "blockBlobClient";

    context.res = {
      status: 200,
      body: "✅ Datei erfolgreich hochgeladen.",
    };
  } catch (error) {
    context.log("❌ Fehler beim Upload:", error);
    context.res = {
      status: 500,
      body: test,
    };
  }
};