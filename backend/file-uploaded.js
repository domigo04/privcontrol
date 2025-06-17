const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  const { projektId, fileName, azureFileName, fileSize, fileType, uploadedAt } = req.body;

  if (!projektId || !fileName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Projekt-ID und Dateiname sind erforderlich' 
    });
  }

  console.log("📁 File-Upload-Benachrichtigung:", {
    projektId,
    fileName,
    azureFileName,
    fileSize,
    fileType
  });

    // NEU
    const projektJsonPfad = path.join(__dirname, '..', 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    // Projekt-JSON laden
    const data = await fs.readFile(projektJsonPfad, 'utf8');
    const projektDaten = JSON.parse(data);

    // Uploads-Array initialisieren falls nicht vorhanden
    if (!projektDaten.uploads) {
      projektDaten.uploads = [];
    }

    // Neue Upload-Info hinzufügen
    const uploadInfo = {
      fileName,
      azureFileName,
      fileSize,
      fileType,
      uploadedAt: uploadedAt || new Date().toISOString(),
      status: 'uploaded'
    };

    projektDaten.uploads.push(uploadInfo);
    projektDaten.lastUpdated = new Date().toISOString();

    // Status aktualisieren falls noch nicht dokumentiert
    if (projektDaten.status === 'offerte_generiert' || projektDaten.status === 'bestätigt') {
      projektDaten.status = 'dokumentiert';
    }

    // JSON-Datei überschreiben
    await fs.writeFile(projektJsonPfad, JSON.stringify(projektDaten, null, 2));

    console.log("✅ Upload-Info gespeichert für Projekt:", projektId);

    res.json({ 
      success: true, 
      message: 'Upload-Info gespeichert',
      uploadCount: projektDaten.uploads.length
    });

  } catch (err) {
    console.error('❌ Fehler beim Speichern der Upload-Info:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Upload-Info konnte nicht gespeichert werden: ' + err.message 
    });
  }
};