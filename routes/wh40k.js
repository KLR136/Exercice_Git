const express = require('express');
const router = express.Router();
const battlescribeData = require('./../data/loadData');



// GET /api/wh40k/units - Toutes les unités
router.get('/units', (req, res) => {
    try {
        const units = battlescribeData.getUnits();
        res.json({
            success: true,
            data: units,
            count: units.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/wh40k/units/:name - Une unité spécifique
router.get('/units/:name', (req, res) => {
    try {
        const unit = battlescribeData.findUnitByName(req.params.name);
        if (unit) {
            res.json({ success: true, data: unit });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Unité non trouvée' 
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/wh40k/units-with-weapons - Unités avec leurs armes
router.get('/units-with-weapons', function(req, res, next) {
  try {
    const unitsWithWeapons = battlescribeData.getUnitsWithWeapons();
    
    res.json({
      success: true,
      data: unitsWithWeapons,
      count: unitsWithWeapons.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/wh40k/units/:id/weapons - Armes d'une unité spécifique
router.get('/units/:id/weapons', function(req, res, next) {
  try {
    const units = battlescribeData.getUnits();
    const unit = units.find(u => u.$.id === req.params.id);
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unité non trouvée'
      });
    }
    
    const weapons = battlescribeData.getWeaponsForUnit(unit);
    
    res.json({
      success: true,
      unit: {
        id: unit.$.id,
        name: unit.$.name
      },
      weapons: weapons,
      count: weapons.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;