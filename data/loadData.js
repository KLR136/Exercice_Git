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
            
            
            // METHODE 2: Recherche dans les structures connues
            if (catalogue.sharedSelectionEntries && catalogue.sharedSelectionEntries[0]) {
                const sharedEntries = catalogue.sharedSelectionEntries[0].selectionEntry || [];
                sharedEntries.forEach(entry => {
                    if (entry.$ && (entry.$.type === 'model' || entry.$.type === 'unit')) {
                        units.push(entry);
                    }
                });
            }

            
            // Affichez les noms des unités trouvées
            if (units.length > 0) {
                units.slice(0, 10).forEach(unit => {
                    console.log(`   - ${unit.$.name} (${unit.$.type || 'no type'})`);
                });
            } else {
                console.log('❌ Aucune unité trouvée avec les méthodes standards');
                console.log('🔍 Exploration de la structure...');
                
                // Exploration pour comprendre la structure
                if (catalogue.selectionEntries) {
                    console.log('📁 selectionEntries trouvé:', catalogue.selectionEntries.length);
                }
                if (catalogue.entryLinks) {
                    console.log('📁 entryLinks trouvé:', catalogue.entryLinks.length);
                }
                if (catalogue.sharedRules) {
                    console.log('📁 sharedRules trouvé:', catalogue.sharedRules.length);
                }
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
        
        // 1. Parcourir les entryLinks directs
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
        
        // 2. Parcourir les selectionEntryGroups
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
        
        // 3. Récupérer les profils d'armes depuis les IDs collectés
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
                const entries = catalogue.sharedSelectionEntries[0].selectionEntry || [];
                
                weaponIds.forEach(weaponId => {
                    const weaponEntry = entries.find(entry => entry.$ && entry.$.id === weaponId);
                    
                    if (weaponEntry && weaponEntry.profiles) {
                        // Extraire les profils d'arme de cette entrée
                        weaponEntry.profiles.forEach(profileGroup => {
                            if (profileGroup.profile) {
                                profileGroup.profile.forEach(profile => {
                                    if (profile.$ && profile.$.typeName) {
                                        // Vérifier si c'est une arme par le typeName
                                        const typeName = profile.$.typeName.toLowerCase();
                                        if (typeName.includes('weapon')) {
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
                    }
                });
            }
            
            return weapons;
        } catch (error) {
            console.error('Erreur getWeaponProfilesFromIds:', error);
            return [];
        }
    }

    // Méthode pour obtenir les unités avec leurs armes
    getUnitsWithWeapons() {
        const units = this.getUnits();
        
        return units.map(unit => {
            return {
                unit: {
                    id: unit.$.id,
                    name: unit.$.name,
                    type: unit.$.type,
                    points: this.getUnitPoints(unit)
                },
                weapons: this.getWeaponsForUnit(unit)
            };
        });
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
}

module.exports = new BattlescribeData();