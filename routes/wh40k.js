const express = require('express');
const router = express.Router();
const battlescribeData = require('./../data/loadData');

console.log('✅ Routeur WH40k chargé');


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

// GET /api/wh40k/weapons - Toutes les armes
router.get('/weapons', (req, res) => {
    try {
        const weapons = battlescribeData.getWeapons();
        res.json({
            success: true,
            data: weapons,
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