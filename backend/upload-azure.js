// =============================================================================
// AZURE BLOB STORAGE UPLOAD ROUTE
// Datei: backend/upload-azure.js
// =============================================================================

const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs');

// Azure Blob Storage Konfiguration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || 
  'DefaultEndpointsProtocol=https;AccountName=YourStorageAccount;AccountKey=YourKey;EndpointSuffix=core.windows.net';

const CONTAINER_NAME = 'projekt-uploads';

// Blob Service Client initialisieren
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

// =============================================================================
// MULTER KONFIGURATION (TEMPORÄRE LOKALE SPEICHERUNG)
// =============================================================================

// Temporärer Upload-Ordner (wird automatisch geleert)
const tempUploadDir = path.join(__dirname, '../temp-uploads');

// Stelle sicher dass temp Ordner existiert
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    // Eindeutiger Dateiname mit Timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: function (req, file, cb) {
    // Erlaubte Dateitypen
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/zip',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Dateityp nicht erlaubt: ${file.mimetype}`));
    }
  }
});

// =============================================================================
// AZURE BLOB STORAGE FUNKTIONEN
// =============================================================================

async function uploadToAzureBlob(localFilePath, blobName, projektId) {
  try {
    console.log(`☁️ Lade Datei zu Azure Blob hoch: ${blobName}`);
    
    // Container Client holen
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Stelle sicher dass Container existiert
    await containerClient.createIfNotExists({
      access: 'blob'
    });
    
    // Blob-Name mit Projekt-ID Prefix
    const fullBlobName = `${projektId}/${blobName}`;
    
    // Block Blob Client holen
    const blockBlobClient = containerClient.getBlockBlobClient(fullBlobName);
    
    // Datei zu Azure hochladen
    const uploadBlobResponse = await blockBlobClient.uploadFile(localFilePath);
    
    console.log(`✅ Azure Upload erfolgreich: ${fullBlobName}`);
    console.log(`📊 Request ID: ${uploadBlobResponse.requestId}`);
    
    // Blob URL zurückgeben
    const blobUrl = blockBlobClient.url;
    
    return {
      success: true,
      blobName: fullBlobName,
      blobUrl: blobUrl,
      azureRequestId: uploadBlobResponse.requestId
    };
    
  } catch (error) {
    console.error('❌ Azure Blob Upload Fehler:', error);
    throw error;
  }
}

async function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Temporäre Datei gelöscht: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Löschen der temporären Datei:', error);
  }
}

// =============================================================================
// HAUPT-UPLOAD ROUTE
// =============================================================================

async function handleFileUpload(req, res) {
  console.log('📤 File Upload Route aufgerufen');
  
  try {
    // Prüfe ob Datei hochgeladen wurde
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Keine Datei empfangen'
      });
    }
    
    // Prüfe ob Projekt-ID vorhanden
    const projektId = req.body.projektId;
    if (!projektId) {
      // Cleanup bei Fehler
      await cleanupTempFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Projekt-ID fehlt'
      });
    }
    
    console.log(`📁 Upload für Projekt ${projektId}: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Generiere eindeutigen Blob-Namen
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, fileExtension)
                         .replace(/[^a-zA-Z0-9\-_]/g, '_');
    const blobName = `${timestamp}_${baseName}${fileExtension}`;
    
    // Upload zu Azure Blob Storage
    const azureResult = await uploadToAzureBlob(req.file.path, blobName, projektId);
    
    if (!azureResult.success) {
      throw new Error('Azure Upload fehlgeschlagen');
    }
    
    // Upload-Info für Projekt-JSON vorbereiten
    const uploadInfo = {
      fileName: req.file.originalname,
      azureFileName: azureResult.blobName,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      azureUrl: azureResult.blobUrl
    };
    
    // Projekt-JSON aktualisieren (durch file-uploaded.js)
    try {
      const fileUploadedHandler = require('./file-uploaded.js');
      
      // Simuliere Request für file-uploaded.js
      const mockReq = {
        body: {
          projektId: projektId,
          fileName: uploadInfo.fileName,
          azureFileName: uploadInfo.azureFileName,
          fileSize: uploadInfo.fileSize,
          fileType: uploadInfo.fileType,
          uploadedAt: uploadInfo.uploadedAt
        }
      };
      
      const mockRes = {
        json: (data) => console.log('📝 Projekt-JSON aktualisiert:', data),
        status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
      };
      
      await fileUploadedHandler(mockReq, mockRes);
      
    } catch (projectUpdateError) {
      console.warn('⚠️ Projekt-JSON Update fehlgeschlagen:', projectUpdateError);
      // Nicht kritisch - Azure Upload war erfolgreich
    }
    
    // Temporäre Datei löschen
    await cleanupTempFile(req.file.path);
    
    // Erfolgreiche Antwort
    res.status(200).json({
      success: true,
      message: 'Datei erfolgreich zu Azure Blob Storage hochgeladen',
      fileName: req.file.originalname,
      blobName: azureResult.blobName,
      fileSize: req.file.size,
      azureUrl: azureResult.blobUrl,
      projektId: projektId
    });
    
    console.log(`✅ Upload komplett: ${req.file.originalname} → Azure Blob Storage`);
    
  } catch (error) {
    console.error('❌ Upload-Fehler:', error);
    
    // Cleanup bei Fehler
    if (req.file && req.file.path) {
      await cleanupTempFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Upload fehlgeschlagen',
      details: error.message
    });
  }
}

// =============================================================================
// CLEANUP FUNKTIONEN
// =============================================================================

// Alte temporäre Dateien löschen (älter als 1 Stunde)
async function cleanupOldTempFiles() {
  try {
    const files = fs.readdirSync(tempUploadDir);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 Stunde in Millisekunden
    
    for (const file of files) {
      const filePath = path.join(tempUploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Alte temporäre Datei gelöscht: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Cleanup Fehler:', error);
  }
}

// Cleanup alle 30 Minuten ausführen
setInterval(cleanupOldTempFiles, 30 * 60 * 1000);

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  upload: upload.single('datei'), // Multer Middleware
  handleFileUpload,
  cleanupOldTempFiles
};