const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  const { projektId } = req.params;
  const { status, updatedAt } = req.body;

  if (!projektId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Projekt-ID fehlt' 
    });
  }

  if (!status) {
    return res.status(400).json({ 
      success: false, 
      message: 'Status ist erforderlich' 
    });
  }

  console.log("🔄 Status-Update für Projekt:", projektId, "Neuer Status:", status);

 // NEU
 const projektJsonPfad = path.join(__dirname, '..', 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    // Projekt-JSON laden
    const data = await fs.readFile(projektJsonPfad, 'utf8');
    const projektDaten = JSON.parse(data);

    // Status-History initialisieren falls nicht vorhanden
    if (!projektDaten.statusHistory) {
      projektDaten.statusHistory = [
        {
          status: projektDaten.status || 'unbekannt',
          timestamp: projektDaten.erstelltAm || new Date().toISOString()
        }
      ];
    }

    // Neuen Status hinzufügen
    projektDaten.status = status;
    projektDaten.lastUpdated = updatedAt || new Date().toISOString();
    
    projektDaten.statusHistory.push({
      status,
      timestamp: projektDaten.lastUpdated
    });

    // Spezielle Status-Timestamps
    if (status === 'bestätigt' && !projektDaten.bestaetigtAm) {
      projektDaten.bestaetigtAm = projektDaten.lastUpdated;
    }
    if (status === 'dokumentiert' && !projektDaten.dokumentiertAm) {
      projektDaten.dokumentiertAm = projektDaten.lastUpdated;
    }

    // JSON-Datei überschreiben
    await fs.writeFile(projektJsonPfad, JSON.stringify(projektDaten, null, 2));

    console.log("✅ Status aktualisiert für Projekt:", projektId, "->", status);

    res.json({ 
      success: true, 
      message: 'Status erfolgreich aktualisiert',
      oldStatus: projektDaten.statusHistory[projektDaten.statusHistory.length - 2]?.status,
      newStatus: status,
      timestamp: projektDaten.lastUpdated
    });

  } catch (err) {
    console.error('❌ Fehler beim Status-Update:', err);
    
    if (err.code === 'ENOENT') {
      res.status(404).json({ 
        success: false, 
        message: 'Projekt nicht gefunden' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Status konnte nicht aktualisiert werden: ' + err.message 
      });
    }
  }
};