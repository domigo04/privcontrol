console.log("🟢 server.js wird ausgeführt");

const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const { generateOffertePDF } = require('./backend/pruefcontrol-pdf');
const { sendProjektMail } = require('./backend/pruefcontrol-mail');

dotenv.config();

// NEU: Upload-Konfiguration
const SAVE_LOCAL_COPIES = process.env.SAVE_LOCAL_COPIES === 'true';
const DEBUG_MODE = process.env.NODE_ENV === 'development';

console.log('🔧 Upload-Konfiguration:');
console.log(`   ☁️ Azure Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? '✅ Konfiguriert' : '❌ Fehlt'}`);
console.log(`   💾 Lokale Kopien: ${SAVE_LOCAL_COPIES ? '✅ Aktiviert' : '❌ Deaktiviert'}`);
console.log(`   🔍 Debug Modus: ${DEBUG_MODE ? '✅ An' : '❌ Aus'}`);

const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer: Datei im Speicher behalten
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/** 🔽 Upload-Route mit flexibler Projekt-ID Behandlung **/
app.post('/upload', upload.single('datei'), async (req, res) => {
  console.log("📥 Upload-Endpoint erreicht");
  console.log("📁 empfangene Datei:", req.file?.originalname || "keine Datei");
  console.log("🆔 Projekt-ID:", req.body.projektId || "nicht übermittelt");
  console.log("📋 Body keys:", Object.keys(req.body));

  let projektId = req.body.projektId;
  
  if (!req.file) {
    console.error("❌ Keine Datei empfangen");
    return res.status(400).json({ 
      success: false,
      error: 'Keine Datei empfangen.' 
    });
  }
  
  // Falls keine Projekt-ID, erstelle eine temporäre
  if (!projektId) {
    projektId = `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    console.log("🆔 Temporäre Projekt-ID erstellt:", projektId);
  }

  try {
    // Azure Blob Storage Setup
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('Azure Storage Connection String nicht konfiguriert');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads';
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Container erstellen falls nicht vorhanden
    try {
      await containerClient.createIfNotExists({
        access: 'blob'
      });
      console.log("📦 Container bereit:", containerName);
    } catch (containerError) {
      console.log("📦 Container bereits vorhanden oder Fehler:", containerError.message);
    }

    // Blob Name mit Timestamp und Original-Dateiname
    const timestamp = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const baseName = path.basename(req.file.originalname, fileExtension);
    // Sicherheitsprüfung für Dateinamen
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const blobName = `${projektId}/${timestamp}-${safeName}${fileExtension}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Content-Type setzen basierend auf Dateiendung
    const contentType = getContentType(fileExtension);
    
    console.log("📤 Starte Upload:", blobName);
    
    // Upload mit Metadaten
    await blockBlobClient.upload(req.file.buffer, req.file.buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      metadata: {
        originalName: req.file.originalname,
        projektId: projektId,
        uploadDate: new Date().toISOString(),
        fileSize: req.file.size.toString()
      }
    });

    console.log("✅ Upload erfolgreich:", blobName);
    
    // GEÄNDERT: Lokale Kopie nur wenn aktiviert
    if (SAVE_LOCAL_COPIES) {
      await saveLocalCopy(projektId, req.file);
    } else {
      console.log("💾 Lokale Kopie übersprungen (nur Azure Storage)");
    }
    
    res.json({ 
      success: true, 
      message: `Datei erfolgreich hochgeladen: ${req.file.originalname}`,
      blobName: blobName,
      projektId: projektId,
      fileSize: req.file.size,
      contentType: contentType
    });

  } catch (err) {
    console.error("❌ Fehler beim Upload:", err);
    res.status(500).json({ 
      success: false, 
      error: 'Upload fehlgeschlagen', 
      details: err.message 
    });
  }
});

// Verbesserte Projektanlage mit besserer Validierung
app.post('/projekt-anlegen', async (req, res) => {
  const daten = req.body;
  console.log("📨 Projekt-Anlegen POST erhalten:", daten);

  // Bessere Validierung der Pflichtfelder
  const requiredFields = ['kundenmail', 'projektname'];
  const missingFields = requiredFields.filter(field => !daten[field] || daten[field].trim() === '');
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Folgende Pflichtfelder fehlen: ${missingFields.join(', ')}`,
      missingFields: missingFields
    });
  }

  // Email Validierung
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(daten.kundenmail)) {
    return res.status(400).json({
      success: false,
      message: 'Ungültige E-Mail-Adresse'
    });
  }

  const projektId = generateProjektIdJahrZahl();
  const interneId = generateProjektId(daten);

  // ✅ KORRIGIERT: Pfad mit 'public'
  const projektOrdner = path.join(__dirname, 'public', 'datenbank', 'projekte', projektId);
  const uploadsOrdner = path.join(projektOrdner, 'uploads');

  try {
    // NEU: Uploads-Ordner nur erstellen wenn lokale Kopien aktiviert
    if (SAVE_LOCAL_COPIES) {
      await fsp.mkdir(uploadsOrdner, { recursive: true });
      console.log("📁 Uploads-Ordner erstellt (lokale Kopien aktiviert)");
    } else {
      await fsp.mkdir(projektOrdner, { recursive: true });
      console.log("📁 Projekt-Ordner erstellt (nur Azure Storage)");
    }

    const projektDaten = {
      ...daten,
      projektId,
      interneId,
      status: 'offerte_generiert',
      erstelltAm: new Date().toISOString(),
      letzteAenderung: new Date().toISOString()
    };

    const projektJsonPath = path.join(projektOrdner, 'projekt.json');
    await fsp.writeFile(projektJsonPath, JSON.stringify(projektDaten, null, 2));

    // PDF nur generieren wenn Funktion verfügbar
    try {
      if (typeof generateOffertePDF === 'function') {
        const pdfPath = path.join(projektOrdner, 'offerte.pdf');
        await generateOffertePDF(projektDaten, pdfPath);
        console.log("📄 PDF generiert:", pdfPath);
      }
    } catch (pdfError) {
      console.warn("⚠️ PDF konnte nicht generiert werden:", pdfError.message);
    }

    // Mail nur senden wenn Funktion verfügbar
    try {
      if (typeof sendProjektMail === 'function') {
        const uploadLink = `https://privcontrol.ch/nachweis-upload.html?projekt=${encodeURIComponent(projektId)}`;
        const pdfPath = path.join(projektOrdner, 'offerte.pdf');
        await sendProjektMail(daten.kundenmail, projektId, pdfPath, uploadLink);
        console.log("📧 Mail gesendet an:", daten.kundenmail);
      }
    } catch (mailError) {
      console.warn("⚠️ Mail konnte nicht gesendet werden:", mailError.message);
    }

    console.log("✅ Projekt erfolgreich erstellt:", projektId);
    res.json({ 
      success: true, 
      projektId: projektId,
      interneId: interneId,
      message: 'Projekt erfolgreich erstellt'
    });

  } catch (err) {
    console.error('❌ Fehler beim Projekt-Anlegen:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Projekt konnte nicht erstellt werden.', 
      error: err.message 
    });
  }
});

/** 🔽 Projektdaten abrufen **/
app.get('/projekt/:id', async (req, res) => {
  const projektId = req.params.id;
  // ✅ KORRIGIERT: Pfad mit 'public'
  const projektPfad = path.join(__dirname, 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    const json = await fsp.readFile(projektPfad, 'utf-8');
    const projektData = JSON.parse(json);
    res.json(projektData);
  } catch (err) {
    console.error('❌ Projekt nicht gefunden:', projektId, err.message);
    res.status(404).json({ 
      error: 'Projekt nicht gefunden',
      projektId: projektId
    });
  }
});

/** 🔽 Neue Route für Upload-Seite **/
app.get('/projekt-daten/:projektId', async (req, res) => {
  const { projektId } = req.params;

  if (!projektId) {
    return res.status(400).json({ success: false, message: 'Projekt-ID fehlt' });
  }

  // ✅ KORRIGIERT: Pfad mit 'public'
  const projektJsonPfad = path.join(__dirname, 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    const data = await fsp.readFile(projektJsonPfad, 'utf8');
    const projektDaten = JSON.parse(data);
    
    console.log("📊 Projekt-Daten gefunden für:", projektId);
    res.json({ 
      success: true, 
      data: projektDaten 
    });
  } catch (err) {
    console.error('❌ Projekt nicht gefunden:', projektId, err.message);
    res.status(404).json({ 
      success: false, 
      message: 'Projekt nicht gefunden' 
    });
  }
});

/** 🔽 Projekt-Status aktualisieren **/
app.put('/projekt/:id', async (req, res) => {
  const projektId = req.params.id;
  const updates = req.body;

  // ✅ KORRIGIERT: Pfad mit 'public'
  const projektJsonPfad = path.join(__dirname, 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    // Projekt-JSON laden
    const data = await fsp.readFile(projektJsonPfad, 'utf8');
    const projektDaten = JSON.parse(data);

    // Updates anwenden
    Object.keys(updates).forEach(key => {
      projektDaten[key] = updates[key];
    });

    projektDaten.letzteAenderung = new Date().toISOString();

    // JSON-Datei überschreiben
    await fsp.writeFile(projektJsonPfad, JSON.stringify(projektDaten, null, 2));

    console.log("✅ Projekt aktualisiert:", projektId, updates);

    res.json({ 
      success: true, 
      message: 'Projekt erfolgreich aktualisiert',
      updates: updates
    });

  } catch (err) {
    console.error('❌ Fehler beim Projekt-Update:', err);
    res.status(404).json({ 
      success: false, 
      message: 'Projekt nicht gefunden oder Update fehlgeschlagen' 
    });
  }
});

/** 🔽 Upload-Status abrufen **/
app.get('/projekt/:id/uploads', async (req, res) => {
  const projektId = req.params.id;
  
  try {
    // Azure Blob Storage prüfen
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads');
    
    const uploads = [];
    const prefix = `${projektId}/`;
    
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      
      uploads.push({
        name: blob.name,
        originalName: properties.metadata?.originalName || 'Unbekannt',
        size: blob.properties.contentLength,
        uploadDate: properties.metadata?.uploadDate || blob.properties.lastModified,
        contentType: blob.properties.contentType
      });
    }
    
    res.json({
      success: true,
      projektId: projektId,
      uploads: uploads,
      count: uploads.length
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Uploads:', error);
    res.status(500).json({
      success: false,
      error: 'Uploads konnten nicht abgerufen werden'
    });
  }
});

// =============================================================================
// HELPER FUNKTIONEN
// =============================================================================

// Lokale Kopie speichern (optional) - VERBESSERT
async function saveLocalCopy(projektId, file) {
  try {
    const projektOrdner = path.join(__dirname, 'public', 'datenbank', 'projekte', projektId, 'uploads');
    await fsp.mkdir(projektOrdner, { recursive: true });
    
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(projektOrdner, fileName);
    
    await fsp.writeFile(filePath, file.buffer);
    console.log("💾 Lokale Kopie gespeichert:", filePath);
    
    return {
      success: true,
      localPath: filePath,
      fileName: fileName
    };
  } catch (error) {
    console.warn("⚠️ Lokale Kopie konnte nicht gespeichert werden:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Content-Type Helper
function getContentType(extension) {
  const types = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain',
    '.doc': 'application/msword'
  };
  return types[extension.toLowerCase()] || 'application/octet-stream';
}

/** 🔽 Projekt-ID generieren nach Jahr + Zähler **/
function generateProjektIdJahrZahl() {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  // ✅ KORRIGIERT: Pfad mit 'public'
  const basisPfad = path.join(__dirname, 'public', 'datenbank', 'projekte');

  let maxNummer = 0;
  if (fs.existsSync(basisPfad)) {
    try {
      const ordner = fs.readdirSync(basisPfad).filter(name => 
        name.startsWith(yearShort) && !name.startsWith('TEMP_')
      );
      ordner.forEach(name => {
        const nummer = parseInt(name.slice(2));
        if (!isNaN(nummer) && nummer > maxNummer) {
          maxNummer = nummer;
        }
      });
    } catch (error) {
      console.warn("⚠️ Fehler beim Lesen der Projektordner:", error.message);
    }
  }

  const neueNummer = (maxNummer + 1).toString().padStart(3, '0');
  return `${yearShort}${neueNummer}`;
}

/** 🔽 Interne lesbare Projekt-ID **/
function generateProjektId(daten) {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const ort = (daten.gemeinde || 'Ort').replace(/\s+/g, '').substring(0, 10);
  const art = (daten.art_des_gebaeudes || 'Projekt').replace(/\s+/g, '').substring(0, 10);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${date}_${art}_${ort}_${rand}`;
}

// Error Handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Interner Serverfehler',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Kontaktieren Sie den Support'
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    azure: process.env.AZURE_STORAGE_CONNECTION_STRING ? 'Konfiguriert' : 'Nicht konfiguriert',
    localCopies: SAVE_LOCAL_COPIES ? 'Aktiviert' : 'Deaktiviert'
  });
});

// Starte Server
app.listen(port, () => {
  console.log(`🚀 Server läuft unter http://localhost:${port}`);
  console.log(`📁 Azure Container: ${process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads'}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`💾 Lokale Kopien: ${SAVE_LOCAL_COPIES ? 'Aktiviert' : 'Deaktiviert'}`);
  console.log(`☁️ Azure Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? 'Konfiguriert ✅' : 'Nicht konfiguriert ❌'}`);
});