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
            if (!fs.existsSync(this.dataPath)) {
                throw new Error(`Fichier non trouvé: ${this.dataPath}`);
            }
            
            const xmlData = fs.readFileSync(this.dataPath, 'utf8');
            const parser = new xml2js.Parser();
            this.data = await parser.parseStringPromise(xmlData);
            
            return this.data;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    getUnits() {
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
            let units = [];
            
            // METHODE: Recherche dans les structures connues
            if (catalogue.sharedSelectionEntries && catalogue.sharedSelectionEntries[0]) {
                const sharedEntries = catalogue.sharedSelectionEntries[0].selectionEntry || [];
                sharedEntries.forEach(entry => {
                    if (entry.$ && (entry.$.type === 'model' || entry.$.type === 'unit')) {
                        units.push(entry);
                    }
                });
            }

            console.log(`✅ ${units.length} unités trouvées`);
            
            // Affichez les noms des unités trouvées
            if (units.length > 0) {
                console.log('📋 Exemples d\'unités:');
                units.slice(0, 5).forEach(unit => {
                    console.log(`   - ${unit.$.name} (${unit.$.type})`);
                });
            }
            
            return units;
        } catch (error) {
            console.error('❌ Erreur dans getUnits:', error);
            return [];
        }
    }

    getWeaponsForUnit(unit) {
        if (!unit || !unit.$) return [];
        
        try {
            let weapons = [];
            const weaponEntries = new Set();
            
            // 1. Parcourir les selectionEntries DIRECTS (armes intégrées)
            if (unit.selectionEntries) {
                unit.selectionEntries.forEach(entryGroup => {
                    if (entryGroup.selectionEntry) {
                        entryGroup.selectionEntry.forEach(entry => {
                            if (entry.$) {
                                weaponEntries.add(entry.$.id);
                            }
                        });
                    }
                });
            }
            
            // 2. Parcourir les entryLinks directs
            if (unit.entryLinks) {
                unit.entryLinks.forEach(linkGroup => {
                    if (linkGroup.entryLink) {
                        linkGroup.entryLink.forEach(link => {
                            if (link.$ && link.$.targetId) {
                                weaponEntries.add(link.$.targetId);
                            }
                        });
                    }
                });
            }
            
            // 3. Parcourir les selectionEntryGroups
            if (unit.selectionEntryGroups) {
                unit.selectionEntryGroups.forEach(group => {
                    // EntryLinks dans les groupes
                    if (group.entryLinks) {
                        group.entryLinks.forEach(linkGroup => {
                            if (linkGroup.entryLink) {
                                linkGroup.entryLink.forEach(link => {
                                    if (link.$ && link.$.targetId) {
                                        weaponEntries.add(link.$.targetId);
                                    }
                                });
                            }
                        });
                    }
                    
                    // SelectionEntryGroups imbriqués
                    if (group.selectionEntryGroup) {
                        group.selectionEntryGroup.forEach(subGroup => {
                            if (subGroup.entryLinks) {
                                subGroup.entryLinks.forEach(linkGroup => {
                                    if (linkGroup.entryLink) {
                                        linkGroup.entryLink.forEach(link => {
                                            if (link.$ && link.$.targetId) {
                                                weaponEntries.add(link.$.targetId);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
            // 4. Récupérer les profils d'armes depuis les IDs collectés
            weapons = this.getWeaponProfilesFromIds(Array.from(weaponEntries));
            
            console.log(`🔫 ${weapons.length} armes trouvées pour ${unit.$.name}`);
            
            return weapons;
        } catch (error) {
            console.error('Erreur getWeaponsForUnit:', error);
            return [];
        }
    }

    getWeaponProfilesFromIds(weaponIds) {
        if (!this.data || !this.data.catalogue || !weaponIds.length) return [];
        
        try {
            let weapons = [];
            const catalogue = this.data.catalogue;
            
            // Parcourir sharedSelectionEntries pour trouver les armes par ID
            if (catalogue.sharedSelectionEntries && catalogue.sharedSelectionEntries[0]) {
                const sharedEntries = catalogue.sharedSelectionEntries[0].selectionEntry || [];
                
                weaponIds.forEach(weaponId => {
                    let weaponEntry = sharedEntries.find(entry => entry.$ && entry.$.id === weaponId);
                    
                    // Si pas trouvé dans shared, chercher dans les entries directes de l'unité
                    if (!weaponEntry) {
                        weaponEntry = this.findWeaponEntryById(weaponId);
                    }
                    
                    if (weaponEntry) {
                        const weaponProfiles = this.extractWeaponProfiles(weaponEntry);
                        weapons = weapons.concat(weaponProfiles);
                    }
                });
            }
            
            return weapons;
        } catch (error) {
            console.error('Erreur getWeaponProfilesFromIds:', error);
            return [];
        }
    }

    // Méthode pour trouver une entrée d'arme par ID (recherche récursive)
    findWeaponEntryById(weaponId, searchIn = null) {
        if (!searchIn) {
            searchIn = this.data.catalogue;
        }
        
        if (!searchIn || typeof searchIn !== 'object') return null;
        
        // Si c'est l'entrée qu'on cherche
        if (searchIn.$ && searchIn.$.id === weaponId) {
            return searchIn;
        }
        
        // Recherche récursive
        for (const key in searchIn) {
            if (Array.isArray(searchIn[key])) {
                for (const item of searchIn[key]) {
                    const found = this.findWeaponEntryById(weaponId, item);
                    if (found) return found;
                }
            } else if (typeof searchIn[key] === 'object') {
                const found = this.findWeaponEntryById(weaponId, searchIn[key]);
                if (found) return found;
            }
        }
        
        return null;
    }

    // Méthode pour extraire les profils d'arme d'une entrée
    extractWeaponProfiles(weaponEntry) {
        const weapons = [];
        
        if (!weaponEntry.profiles) return weapons;
        
        weaponEntry.profiles.forEach(profileGroup => {
            if (profileGroup.profile) {
                profileGroup.profile.forEach(profile => {
                    if (profile.$ && profile.$.typeName) {
                        const typeName = profile.$.typeName.toLowerCase();
                        // Vérifier si c'est une arme par le typeName
                        if (typeName.includes('ranged weapons') || typeName.includes('melee weapons')) {
                            const characteristics = {};
                            if (profile.characteristics && profile.characteristics[0]) {
                                profile.characteristics[0].characteristic.forEach(char => {
                                    characteristics[char.$.name] = char._;
                                });
                            }
                            
                            weapons.push({
                                id: profile.$.id,
                                name: profile.$.name,
                                type: profile.$.typeName,
                                characteristics: characteristics,
                                parentWeapon: {
                                    id: weaponEntry.$.id,
                                    name: weaponEntry.$.name,
                                    type: weaponEntry.$.type
                                }
                            });
                        }
                    }
                });
            }
        });
        
        return weapons;
    }

    // MÉTHODE MANQUANTE - Unités avec leurs armes
    getUnitsWithWeapons() {
        try {
            const units = this.getUnits();
            console.log(`🔍 Recherche des armes pour ${units.length} unités...`);
            
            const unitsWithWeapons = units.map(unit => {
                const weapons = this.getWeaponsForUnit(unit);
                
                return {
                    unit: {
                        id: unit.$.id,
                        name: unit.$.name,
                        type: unit.$.type,
                        points: this.getUnitPoints(unit)
                    },
                    weapons: weapons
                };
            });
            
            console.log(`✅ ${unitsWithWeapons.length} unités avec armes préparées`);
            return unitsWithWeapons;
        } catch (error) {
            console.error('❌ Erreur dans getUnitsWithWeapons:', error);
            return [];
        }
    }

    getUnitPoints(unit) {
        if (unit.costs && unit.costs[0]) {
            const ptsCost = unit.costs[0].cost.find(cost => cost.$.name === 'pts');
            return ptsCost ? ptsCost.$.value : '0';
        }
        return '0';
    }

    findUnitByName(unitName) {
        const units = this.getUnits();
        return units.find(unit => 
            unit.$ && unit.$.name && 
            unit.$.name.toLowerCase().includes(unitName.toLowerCase())
        );
    }

    // Méthode pour obtenir toutes les armes
    getWeapons() {
        if (!this.data || !this.data.catalogue) return [];
        
        try {
            const catalogue = this.data.catalogue;
            let weapons = [];
            
            if (catalogue.sharedSelectionEntries && catalogue.sharedSelectionEntries[0]) {
                const entries = catalogue.sharedSelectionEntries[0].selectionEntry || [];
                entries.forEach(entry => {
                    if (entry.$ && entry.profiles) {
                        const weaponProfiles = this.extractWeaponProfiles(entry);
                        weapons = weapons.concat(weaponProfiles);
                    }
                });
            }
            
            console.log(`🔫 ${weapons.length} armes trouvées au total`);
            return weapons;
        } catch (error) {
            console.error('Erreur getWeapons:', error);
            return [];
        }
    }
}

module.exports = new BattlescribeData();