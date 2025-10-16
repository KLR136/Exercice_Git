const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js'); // Vous devrez l'installer

class BattlescribeData {
    constructor() {
        this.data = null;
        this.dataPath = path.join(__dirname, 'wh40k', 'Chaos - Thousand Sons.cat');
    }

    async loadData() {
        try {
            const xmlData = fs.readFileSync(this.dataPath, 'utf8');
            const parser = new xml2js.Parser();
            this.data = await parser.parseStringPromise(xmlData);
            console.log('✅ Données Thousand Sons chargées avec succès');
            return this.data;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    getUnits() {
        if (!this.data) return [];
        
        const catalogue = this.data.catalogue;
        return catalogue.entries[0].selectionEntry || [];
    }

    getWeapons() {
        if (!this.data) return [];
        
        const catalogue = this.data.catalogue;
        return catalogue.sharedSelectionEntries[0].selectionEntry || [];
    }

    // Rechercher une unité par nom
    findUnitByName(unitName) {
        const units = this.getUnits();
        return units.find(unit => 
            unit.$.name.toLowerCase().includes(unitName.toLowerCase())
        );
    }
}

module.exports = new BattlescribeData();