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

/* ── Card Lore / Flavor Text ─────────────────── */

TT.CARD_LORE = {
    1:  "A shambling mass of moss and vine that lurks in damp caverns. Its roots drink from the stone itself.",
    2:  "Lightning-quick insect with a barbed tail. Swarms of Stingers have been known to down creatures ten times their size.",
    3:  "A bat-like predator that hunts at twilight. Its shriek can shatter glass at close range.",
    4:  "An amorphous blob of acidic gel. Surprisingly resilient — cutting one only produces two.",
    5:  "A delicate moth that rides desert thermals. Its wing-dust causes vivid hallucinations.",
    6:  "A mischievous lesser demon fond of stealing shiny objects. Mostly harmless — mostly.",
    7:  "A wraith born from a dying person's last regret. It passes through walls as easily as air.",
    8:  "A fat, armored larva found in rotting wood. Alchemists prize its silk for potion filters.",
    9:  "Its gaze turns flesh to calcium. Veterans know to fight it by watching its shadow instead.",
    10: "A tree-shaped fiend that uproots itself to hunt. The sound of cracking wood precedes its attacks.",
    11: "A tiny elemental spirit made of pure light. Playful but volatile — one sneeze can start a fire.",
    12: "A rhinoceros-like beast with three spiraling horns. Charges first, thinks never.",
    13: "A floating eyeball encased in ice. It watches everything and forgets nothing.",
    14: "An empty suit of cursed plate armor. Whatever once wore it has long since rotted away.",
    15: "A raptor that nests above the clouds. Its talons can pierce dragon scale.",
    16: "Deceptively fast serpent with twin hinged fangs. One bite delivers enough venom to fell an ox.",
    17: "A living shadow that detaches from its host at midnight. It feeds on fear.",
    18: "A drake with stone-hard scales. Miners sometimes mistake a sleeping one for a boulder — once.",
    19: "A translucent jellyfish that floats through ocean currents. Its tentacles trail for thirty feet.",
    20: "An insectoid warrior that leads swarms with clicking mandible-code. Ruthlessly tactical.",
    21: "A haunted breastplate that compels its wearer to seek battle. Many heroes have worn it. None retired.",
    22: "A tortoise-like golem forged in a dwarven foundry. Its iron shell can withstand cannon fire.",
    23: "A three-jawed predator from the deep trenches. Each mouth has its own primitive brain.",
    24: "It waits beneath the dunes with infinite patience. Only a faint ripple in the sand betrays it.",
    25: "A majestic lion with a mane of crystallized frost. Its roar brings blizzards.",
    26: "An ancient tree awakened by wild magic. It remembers every season since the world was young.",
    27: "A skeletal claw that rises from battlefields. Scholars debate whether it's undead or something worse.",
    28: "A towering stone giant from the old world. Earthquakes mark its footsteps.",
    29: "An eastern dragon cloaked in storm clouds. Legends say it guards the gate between worlds.",
    30: "A blind serpent that navigates by heat. It coils around volcanic vents for centuries at a time.",
    31: "Lion, goat, and serpent fused by forgotten sorcery. Each head argues with the others constantly.",
    32: "A scarlet-scaled drake whose breath melts steel. Only three have ever been seen — and survived.",
    33: "A massive beast of raw muscle and fury. Even apex predators give it a wide berth.",
    34: "A hunter from the space between planes. It stalks prey across dimensions.",
    35: "A benevolent giant that carries a lantern of living flame. Travelers follow its light to safety.",
    36: "Two legendary commanders fused by a dying curse. They share one body but still bicker over strategy.",
    37: "The storm given form. Lightning dances along its wingspan and thunder follows its every move.",
    38: "A tyrant who traded his soul for dominion over darkness. His kingdom exists only in shadow.",
    39: "A titan of living magma. Where it walks, the earth melts and new mountains are born.",
    40: "An ancient sorceress who merged with the ocean. She commands tides and speaks in the crash of waves.",
};
