const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class BattlescribeData {
    constructor() {
        this.data = null;
        // Correction du chemin - le fichier est dans data/wh40k/Chaos/
        this.dataPath = path.join(__dirname, 'wh40k', 'Chaos', 'Thousand_Sons.cat');
    }

    async loadData() {
        try {
            if (!fs.existsSync(this.dataPath)) {
                throw new Error(`Fichier non trouvé: ${this.dataPath}`);
            }
            
            const xmlData = fs.readFileSync(this.dataPath, 'utf8');
            const parser = new xml2js.Parser();
            this.data = await parser.parseStringPromise(xmlData);
            console.log('✅ Données Thousand Sons chargées depuis:', this.dataPath);
            return this.data;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    getUnits() {
        if (!this.data || !this.data.catalogue) return [];
        
        try {
            const catalogue = this.data.catalogue;
            return catalogue.entries?.[0]?.selectionEntry || [];
        } catch (error) {
            console.error('Erreur getUnits:', error);
            return [];
        }
    }

    getWeapons() {
        if (!this.data || !this.data.catalogue) return [];
        
        try {
            const catalogue = this.data.catalogue;
            return catalogue.sharedSelectionEntries?.[0]?.selectionEntry || [];
        } catch (error) {
            console.error('Erreur getWeapons:', error);
            return [];
        }
    }

    findUnitByName(unitName) {
        const units = this.getUnits();
        return units.find(unit => 
            unit.$ && unit.$.name && 
            unit.$.name.toLowerCase().includes(unitName.toLowerCase())
        );
    }
}

module.exports = new BattlescribeData();