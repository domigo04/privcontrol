const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  const { projektId } = req.params;

  if (!projektId) {
    return res.status(400).json({ success: false, message: 'Projekt-ID fehlt' });
  }

  // NEU
  const projektJsonPfad = path.join(__dirname, '..', 'public', 'datenbank', 'projekte', projektId, 'projekt.json');

  try {
    const data = await fs.readFile(projektJsonPfad, 'utf8');
    const projektDaten = JSON.parse(data);
    
    res.json({ 
      success: true, 
      data: projektDaten 
    });
  } catch (err) {
    console.error('❌ Projekt nicht gefunden:', err);
    res.status(404).json({ 
      success: false, 
      message: 'Projekt nicht gefunden' 
    });
  }
};