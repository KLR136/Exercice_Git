const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

class BattlescribeData {
    constructor() {
        this.data = null;
        this.dataPath = path.join(__dirname, 'wh40k', 'Chaos', 'Thousand_Sons.cat');
    }

    async loadData() {
        try {
            console.log('🔄 Début du chargement des données...');
            console.log('📁 Chemin du fichier:', this.dataPath);
            
            if (!fs.existsSync(this.dataPath)) {
                throw new Error(`Fichier non trouvé: ${this.dataPath}`);
            }
            
            console.log('✅ Fichier trouvé, lecture...');
            const xmlData = fs.readFileSync(this.dataPath, 'utf8');
            console.log('📄 Taille du fichier:', xmlData.length, 'caractères');
            console.log('🔍 Premières 200 caractères:', xmlData.substring(0, 200));
            
            const parser = new xml2js.Parser();
            this.data = await parser.parseStringPromise(xmlData);
            
            console.log('✅ Données XML parsées avec succès');
            console.log('📊 Structure des données:', Object.keys(this.data));
            
            return this.data;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    getUnits() {
        console.log('🔍 Appel à getUnits()');
        
        if (!this.data) {
            console.log('❌ Aucune donnée chargée');
            return [];
        }
        
        if (!this.data.catalogue) {
            console.log('❌ Pas de catalogue dans les données');
            return [];
        }
        
        try {
            const catalogue = this.data.catalogue;
            console.log('📦 Clés du catalogue:', Object.keys(catalogue));
            
            // Essayez différentes structures possibles
            let units = [];
            
            if (catalogue.entries && catalogue.entries[0] && catalogue.entries[0].selectionEntry) {
                units = catalogue.entries[0].selectionEntry;
                console.log(`✅ Unités trouvées via entries[0]: ${units.length}`);
            } 
            else if (catalogue.selectionEntries && catalogue.selectionEntries[0]) {
                units = catalogue.selectionEntries[0].selectionEntry || [];
                console.log(`✅ Unités trouvées via selectionEntries: ${units.length}`);
            }
            else {
                console.log('❌ Aucune structure d unités reconnue');
                // Affichez toute la structure pour debug
                console.log('🔍 Structure complète:', JSON.stringify(catalogue, null, 2).substring(0, 500));
            }
            
            // Affichez les noms des premières unités
            if (units.length > 0) {
                console.log('📋 Premières unités:');
                units.slice(0, 3).forEach(unit => {
                    console.log(`   - ${unit.$.name} (${unit.$.type})`);
                });
            }
            
            return units;
        } catch (error) {
            console.error('❌ Erreur dans getUnits:', error);
            return [];
        }
    }

    getWeapons() {
        if (!this.data || !this.data.catalogue) return [];
        
        try {
            const catalogue = this.data.catalogue;
            let weapons = [];
            
            if (catalogue.sharedSelectionEntries && catalogue.sharedSelectionEntries[0]) {
                weapons = catalogue.sharedSelectionEntries[0].selectionEntry || [];
            }
            
            console.log(`🔫 Armes trouvées: ${weapons.length}`);
            return weapons;
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