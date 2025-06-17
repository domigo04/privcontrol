const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

module.exports = async (req, res) => {
  const daten = req.body;
  
  console.log("📥 Neue Projekt-Anfrage erhalten:", daten);

  if (!daten.kundenmail || !daten.projektname) {
    return res.status(400).json({ 
      success: false, 
      message: 'Fehlende Pflichtfelder: kundenmail und projektname sind erforderlich.' 
    });
  }

  // NEU: Async ID-Generierung
  const projektId = daten.projektId || await generateProjektId();

  // NEU: Pfade mit 'public'
  const projektOrdner = path.join(__dirname, '..', 'public', 'datenbank', 'projekte', projektId);
  const uploadsOrdner = path.join(projektOrdner, 'uploads');
  const projektJsonPfad = path.join(projektOrdner, 'projekt.json');

  try {
    // Ordner erstellen
    await fsp.mkdir(uploadsOrdner, { recursive: true });

    // Projektdaten strukturieren
    const projektDaten = {
      projektId,
      projektname: daten.projektname,
      kundenmail: daten.kundenmail,
      adresse: daten.adresse,
      gemeinde: daten.gemeinde,
      parzellennummer: daten.parzellennummer,
      gebaeudenummer: daten.gebaeudenummer,
      art_des_gebaeudes: daten.art_des_gebaeudes,
      wunschtermin: daten.wunschtermin,
      ausgewaehlteGewerke: daten.ausgewaehlteGewerke || [],
      status: 'offerte_generiert',
      erstelltAm: new Date().toISOString(),
      bestaetigtAm: null,
      preise: {
        grundbetrag: 1000,
        services: daten.ausgewaehlteGewerke ? 
          daten.ausgewaehlteGewerke.reduce((sum, g) => sum + (g.preis || 0), 0) : 0,
        expressZuschlag: 0,
        gesamtpreis: calculateGesamtpreis(daten)
      }
    };

    // JSON-Datei speichern
    await fsp.writeFile(projektJsonPfad, JSON.stringify(projektDaten, null, 2));
    
    console.log("✅ Projekt gespeichert:", projektJsonPfad);

    // Erfolgreiche Antwort
    res.json({ 
      success: true, 
      projektId,
      message: 'Projekt erfolgreich erstellt',
      data: projektDaten
    });

  } catch (err) {
    console.error('❌ Fehler beim Projekt-Anlegen:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Projekt konnte nicht erstellt werden: ' + err.message 
    });
  }
};

// NEU: 25XXX Format ID-Generierung
async function generateProjektId() {
  const jahr = new Date().getFullYear().toString().slice(-2); // 2025 → "25"
  const projekteOrdner = path.join(__dirname, '..', 'public', 'datenbank', 'projekte');
  
  try {
    // Prüfe ob Projekte-Ordner existiert
    await fsp.mkdir(projekteOrdner, { recursive: true });
    
    // Lese alle vorhandenen Projekt-IDs
    const files = await fsp.readdir(projekteOrdner);
    
    // Filtere nur Ordner die mit dem aktuellen Jahr beginnen (25XXX)
    const aktuelleJahrProjekte = files.filter(file => 
      file.startsWith(jahr) && /^\d+$/.test(file)
    );
    
    // Finde die höchste Nummer
    let hoechsteNummer = 0;
    for (const projektId of aktuelleJahrProjekte) {
      const nummer = parseInt(projektId);
      if (nummer > hoechsteNummer) {
        hoechsteNummer = nummer;
      }
    }
    
    // Neue ID = höchste + 1
    const neueNummer = hoechsteNummer + 1;
    const neueId = neueNummer.toString();
    
    console.log(`📊 Neue Projekt-ID generiert: ${neueId} (Vorherige: ${hoechsteNummer})`);
    
    return neueId;
    
  } catch (error) {
    console.error('❌ Fehler beim Generieren der Projekt-ID:', error);
    // Fallback: Jahr + Timestamp
    const fallbackId = jahr + Date.now().toString().slice(-3);
    console.log(`🔄 Fallback-ID: ${fallbackId}`);
    return fallbackId;
  }
}

// Gesamtpreis berechnen
function calculateGesamtpreis(daten) {
  let total = 1000; // Grundbetrag
  
  if (daten.ausgewaehlteGewerke) {
    total += daten.ausgewaehlteGewerke.reduce((sum, g) => sum + (g.preis || 0), 0);
  }
  
  // Express-Zuschlag prüfen
  if (daten.wunschtermin) {
    const heute = new Date();
    const termin = new Date(daten.wunschtermin);
    const diffStunden = (termin - heute) / (1000 * 60 * 60);
    
    if (diffStunden < 48) {
      total += total * 0.2; // 20% Expresszuschlag
    }
  }
  
  return total;
}