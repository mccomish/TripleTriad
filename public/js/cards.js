/* ═══════════════════════════════════════════════════════════
   Card Catalog (client-side copy – same data as server)
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.CARDS = [
    { id: 1,  name: "Moss Creeper",  level: 1,  values: [5, 3, 1, 1] },
    { id: 2,  name: "Stinger",       level: 1,  values: [1, 5, 3, 1] },
    { id: 3,  name: "Dusk Wing",     level: 1,  values: [6, 1, 1, 2] },
    { id: 4,  name: "Slime",         level: 1,  values: [2, 3, 4, 1] },
    { id: 5,  name: "Wind Moth",     level: 2,  values: [2, 4, 1, 4] },
    { id: 6,  name: "Imp",           level: 2,  values: [1, 1, 5, 4] },
    { id: 7,  name: "Shade",         level: 2,  values: [2, 1, 6, 1] },
    { id: 8,  name: "Grub",          level: 2,  values: [4, 3, 2, 4] },
    { id: 9,  name: "Basilisk",      level: 3,  values: [2, 6, 1, 2] },
    { id: 10, name: "Root Fiend",    level: 3,  values: [7, 1, 1, 3] },
    { id: 11, name: "Sprite",        level: 3,  values: [6, 3, 2, 2] },
    { id: 12, name: "Horn Beast",    level: 3,  values: [5, 4, 3, 3] },
    { id: 13, name: "Frost Eye",     level: 4,  values: [6, 3, 1, 4] },
    { id: 14, name: "Hollow Knight", level: 4,  values: [3, 3, 4, 5] },
    { id: 15, name: "Sky Talon",     level: 4,  values: [5, 5, 3, 2] },
    { id: 16, name: "Viper",         level: 4,  values: [5, 5, 1, 3] },
    { id: 17, name: "Shadow Creep",  level: 5,  values: [5, 2, 5, 2] },
    { id: 18, name: "Rock Drake",    level: 5,  values: [4, 2, 4, 5] },
    { id: 19, name: "Sea Jelly",     level: 5,  values: [3, 7, 2, 1] },
    { id: 20, name: "Mantis Lord",   level: 5,  values: [5, 3, 2, 5] },
    { id: 21, name: "Cursed Armor",  level: 6,  values: [6, 2, 6, 3] },
    { id: 22, name: "Iron Shell",    level: 6,  values: [6, 6, 3, 1] },
    { id: 23, name: "Tri-Maw",       level: 6,  values: [3, 5, 5, 5] },
    { id: 24, name: "Sand Lurker",   level: 6,  values: [7, 3, 5, 1] },
    { id: 25, name: "Ice Lion",      level: 7,  values: [7, 3, 1, 5] },
    { id: 26, name: "Thornwood",     level: 7,  values: [5, 3, 6, 3] },
    { id: 27, name: "Reaper Claw",   level: 7,  values: [4, 2, 4, 7] },
    { id: 28, name: "Colossus",      level: 7,  values: [6, 5, 5, 6] },
    { id: 29, name: "Azure Dragon",  level: 8,  values: [6, 3, 2, 7] },
    { id: 30, name: "Pit Wyrm",      level: 8,  values: [7, 5, 2, 3] },
    { id: 31, name: "Chimera",       level: 8,  values: [7, 3, 6, 2] },
    { id: 32, name: "Crimson Drake", level: 8,  values: [7, 4, 2, 7] },
    { id: 33, name: "Dire Beast",    level: 9,  values: [3, 6, 5, 7] },
    { id: 34, name: "Void Stalker",  level: 9,  values: [5, 6, 4, 7] },
    { id: 35, name: "Lantern King",  level: 9,  values: [4, 4, 6, 7] },
    { id: 36, name: "Twin Generals", level: 9,  values: [6, 7, 6, 2] },
    { id: 37, name: "Storm Dragon",  level: 10, values: [10, 6, 8, 2] },
    { id: 38, name: "Shadow Lord",   level: 10, values: [5, 3, 10, 8] },
    { id: 39, name: "Flame Titan",   level: 10, values: [9, 8, 2, 6] },
    { id: 40, name: "Sea Witch",     level: 10, values: [8, 2, 9, 6] },
];

TT.CARD_MAP = {};
TT.CARDS.forEach(function (c) { TT.CARD_MAP[c.id] = c; });

TT.formatValue = function (v) {
    return v === 10 ? 'A' : String(v);
};

/* Rarity by level */
TT.RARITIES = {
    1: { name: 'Common',    css: 'rarity-common' },
    2: { name: 'Common',    css: 'rarity-common' },
    3: { name: 'Uncommon',  css: 'rarity-uncommon' },
    4: { name: 'Uncommon',  css: 'rarity-uncommon' },
    5: { name: 'Rare',      css: 'rarity-rare' },
    6: { name: 'Rare',      css: 'rarity-rare' },
    7: { name: 'Epic',      css: 'rarity-epic' },
    8: { name: 'Epic',      css: 'rarity-epic' },
    9: { name: 'Legendary', css: 'rarity-legendary' },
    10:{ name: 'Legendary', css: 'rarity-legendary' },
};

TT.getRarity = function (level) {
    return TT.RARITIES[level] || TT.RARITIES[1];
};
