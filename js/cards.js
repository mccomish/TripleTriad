/* ═══════════════════════════════════════════════════════════
   Card Database
   Each card: { id, name, level (1-10), values: [top, right, bottom, left] }
   Values range 1-10  (10 is displayed as 'A')
   ═══════════════════════════════════════════════════════════ */

window.TT = window.TT || {};

TT.CARDS = [
    // ── Level 1 ──────────────────────────────
    { id: 1,  name: "Moss Creeper",  level: 1,  values: [5, 3, 1, 1] },
    { id: 2,  name: "Stinger",       level: 1,  values: [1, 5, 3, 1] },
    { id: 3,  name: "Dusk Wing",     level: 1,  values: [6, 1, 1, 2] },
    { id: 4,  name: "Slime",         level: 1,  values: [2, 3, 4, 1] },

    // ── Level 2 ──────────────────────────────
    { id: 5,  name: "Wind Moth",     level: 2,  values: [2, 4, 1, 4] },
    { id: 6,  name: "Imp",           level: 2,  values: [1, 1, 5, 4] },
    { id: 7,  name: "Shade",         level: 2,  values: [2, 1, 6, 1] },
    { id: 8,  name: "Grub",          level: 2,  values: [4, 3, 2, 4] },

    // ── Level 3 ──────────────────────────────
    { id: 9,  name: "Basilisk",      level: 3,  values: [2, 6, 1, 2] },
    { id: 10, name: "Root Fiend",    level: 3,  values: [7, 1, 1, 3] },
    { id: 11, name: "Sprite",        level: 3,  values: [6, 3, 2, 2] },
    { id: 12, name: "Horn Beast",    level: 3,  values: [5, 4, 3, 3] },

    // ── Level 4 ──────────────────────────────
    { id: 13, name: "Frost Eye",     level: 4,  values: [6, 3, 1, 4] },
    { id: 14, name: "Hollow Knight", level: 4,  values: [3, 3, 4, 5] },
    { id: 15, name: "Sky Talon",     level: 4,  values: [5, 5, 3, 2] },
    { id: 16, name: "Viper",         level: 4,  values: [5, 5, 1, 3] },

    // ── Level 5 ──────────────────────────────
    { id: 17, name: "Shadow Creep",  level: 5,  values: [5, 2, 5, 2] },
    { id: 18, name: "Rock Drake",    level: 5,  values: [4, 2, 4, 5] },
    { id: 19, name: "Sea Jelly",     level: 5,  values: [3, 7, 2, 1] },
    { id: 20, name: "Mantis Lord",   level: 5,  values: [5, 3, 2, 5] },

    // ── Level 6 ──────────────────────────────
    { id: 21, name: "Cursed Armor",  level: 6,  values: [6, 2, 6, 3] },
    { id: 22, name: "Iron Shell",    level: 6,  values: [6, 6, 3, 1] },
    { id: 23, name: "Tri-Maw",       level: 6,  values: [3, 5, 5, 5] },
    { id: 24, name: "Sand Lurker",   level: 6,  values: [7, 3, 5, 1] },

    // ── Level 7 ──────────────────────────────
    { id: 25, name: "Ice Lion",      level: 7,  values: [7, 3, 1, 5] },
    { id: 26, name: "Thornwood",     level: 7,  values: [5, 3, 6, 3] },
    { id: 27, name: "Reaper Claw",   level: 7,  values: [4, 2, 4, 7] },
    { id: 28, name: "Colossus",      level: 7,  values: [6, 5, 5, 6] },

    // ── Level 8 ──────────────────────────────
    { id: 29, name: "Azure Dragon",  level: 8,  values: [6, 3, 2, 7] },
    { id: 30, name: "Pit Wyrm",      level: 8,  values: [7, 5, 2, 3] },
    { id: 31, name: "Chimera",       level: 8,  values: [7, 3, 6, 2] },
    { id: 32, name: "Crimson Drake", level: 8,  values: [7, 4, 2, 7] },

    // ── Level 9 ──────────────────────────────
    { id: 33, name: "Dire Beast",    level: 9,  values: [3, 6, 5, 7] },
    { id: 34, name: "Void Stalker",  level: 9,  values: [5, 6, 4, 7] },
    { id: 35, name: "Lantern King",  level: 9,  values: [4, 4, 6, 7] },
    { id: 36, name: "Twin Generals", level: 9,  values: [6, 7, 6, 2] },

    // ── Level 10 ─────────────────────────────
    { id: 37, name: "Storm Dragon",  level: 10, values: [10, 6, 8, 2] },
    { id: 38, name: "Shadow Lord",   level: 10, values: [5, 3, 10, 8] },
    { id: 39, name: "Flame Titan",   level: 10, values: [9, 8, 2, 6] },
    { id: 40, name: "Sea Witch",     level: 10, values: [8, 2, 9, 6] },

    // Level 1 (14 new)
    { id: 41,  name: "Mud Crawler",    level: 1, values: [3, 2, 3, 2] },
    { id: 42,  name: "Thorn Rat",      level: 1, values: [4, 1, 2, 3] },
    { id: 43,  name: "Cave Bat",       level: 1, values: [1, 4, 1, 4] },
    { id: 44,  name: "Pebble Golem",   level: 1, values: [3, 1, 5, 1] },
    { id: 45,  name: "Wisp",           level: 1, values: [2, 2, 2, 4] },
    { id: 46,  name: "Bog Toad",       level: 1, values: [1, 3, 2, 4] },
    { id: 47,  name: "Dust Mite",      level: 1, values: [4, 2, 1, 3] },
    { id: 48,  name: "Ember Ant",      level: 1, values: [2, 4, 3, 1] },
    { id: 49,  name: "Leaf Bug",       level: 1, values: [3, 3, 1, 3] },
    { id: 50,  name: "Soot Sprite",    level: 1, values: [1, 1, 4, 4] },
    { id: 51,  name: "Clay Worm",      level: 1, values: [5, 1, 3, 1] },
    { id: 52,  name: "Puddle Ooze",    level: 1, values: [2, 3, 1, 4] },
    { id: 53,  name: "Bark Beetle",    level: 1, values: [4, 1, 4, 1] },
    { id: 54,  name: "Rusty Nail",     level: 1, values: [1, 5, 1, 3] },

    // Level 2 (14 new)
    { id: 55,  name: "Swamp Leech",    level: 2, values: [3, 4, 2, 2] },
    { id: 56,  name: "Flame Wisp",     level: 2, values: [2, 1, 4, 5] },
    { id: 57,  name: "Tunnel Rat",     level: 2, values: [4, 2, 3, 2] },
    { id: 58,  name: "Marsh Frog",     level: 2, values: [1, 5, 2, 3] },
    { id: 59,  name: "Sand Crawler",   level: 2, values: [5, 1, 3, 3] },
    { id: 60,  name: "Night Moth",     level: 2, values: [2, 3, 5, 1] },
    { id: 61,  name: "Coral Crab",     level: 2, values: [3, 3, 3, 3] },
    { id: 62,  name: "Vine Snake",     level: 2, values: [4, 4, 1, 2] },
    { id: 63,  name: "Ash Beetle",     level: 2, values: [1, 2, 5, 3] },
    { id: 64,  name: "Frost Bat",      level: 2, values: [3, 1, 4, 4] },
    { id: 65,  name: "Iron Flea",      level: 2, values: [5, 2, 1, 4] },
    { id: 66,  name: "Muck Dweller",   level: 2, values: [2, 4, 4, 1] },
    { id: 67,  name: "Spark Bug",      level: 2, values: [3, 5, 1, 2] },
    { id: 68,  name: "Bone Rat",       level: 2, values: [4, 1, 2, 5] },

    // Level 3 (12 new)
    { id: 69,  name: "Stone Golem",    level: 3, values: [4, 4, 3, 2] },
    { id: 70,  name: "Dire Wolf",      level: 3, values: [5, 2, 4, 2] },
    { id: 71,  name: "Plague Rat",     level: 3, values: [3, 5, 2, 3] },
    { id: 72,  name: "Mire Serpent",   level: 3, values: [2, 3, 5, 4] },
    { id: 73,  name: "Crypt Shade",    level: 3, values: [6, 1, 3, 3] },
    { id: 74,  name: "Ember Fox",      level: 3, values: [4, 3, 2, 4] },
    { id: 75,  name: "Thorn Vine",     level: 3, values: [3, 4, 4, 2] },
    { id: 76,  name: "Gale Hawk",      level: 3, values: [5, 3, 1, 4] },
    { id: 77,  name: "Rust Knight",    level: 3, values: [2, 5, 3, 3] },
    { id: 78,  name: "Marsh Lurker",   level: 3, values: [4, 2, 5, 2] },
    { id: 79,  name: "Ember Toad",     level: 3, values: [3, 3, 3, 4] },
    { id: 80,  name: "Dust Wraith",    level: 3, values: [6, 2, 2, 3] },

    // Level 4 (12 new)
    { id: 81,  name: "Lava Hound",     level: 4, values: [5, 4, 2, 3] },
    { id: 82,  name: "Ghost Fang",     level: 4, values: [4, 3, 5, 3] },
    { id: 83,  name: "Storm Hawk",     level: 4, values: [3, 5, 2, 4] },
    { id: 84,  name: "Bone Golem",     level: 4, values: [6, 2, 4, 3] },
    { id: 85,  name: "Feral Cat",      level: 4, values: [4, 5, 3, 3] },
    { id: 86,  name: "Magma Slug",     level: 4, values: [5, 2, 4, 3] },
    { id: 87,  name: "Ice Wraith",     level: 4, values: [3, 4, 4, 4] },
    { id: 88,  name: "Dire Bat",       level: 4, values: [6, 3, 2, 4] },
    { id: 89,  name: "Thunder Eel",    level: 4, values: [2, 5, 3, 4] },
    { id: 90,  name: "Crystal Crab",   level: 4, values: [4, 4, 5, 2] },
    { id: 91,  name: "Plague Bearer",  level: 4, values: [4, 3, 3, 4] },
    { id: 92,  name: "Dark Imp",       level: 4, values: [3, 6, 3, 3] },

    // Level 5 (10 new)
    { id: 93,  name: "Blood Wolf",     level: 5, values: [5, 3, 2, 4] },
    { id: 94,  name: "Thorn Drake",    level: 5, values: [4, 3, 5, 3] },
    { id: 95,  name: "Rust Golem",     level: 5, values: [6, 2, 3, 3] },
    { id: 96,  name: "Night Stalker",  level: 5, values: [3, 5, 4, 3] },
    { id: 97,  name: "Flame Serpent",  level: 5, values: [5, 3, 4, 3] },
    { id: 98,  name: "Stone Warden",   level: 5, values: [3, 4, 4, 3] },
    { id: 99,  name: "Void Moth",      level: 5, values: [3, 6, 2, 4] },
    { id: 100, name: "Swamp Hydra",    level: 5, values: [5, 2, 4, 3] },
    { id: 101, name: "Iron Beetle",    level: 5, values: [4, 5, 3, 3] },
    { id: 102, name: "Ash Phoenix",    level: 5, values: [6, 1, 5, 3] },

    // Level 6 (10 new)
    { id: 103, name: "Magma Golem",    level: 6, values: [6, 4, 5, 2] },
    { id: 104, name: "Frost Serpent",  level: 6, values: [5, 3, 5, 5] },
    { id: 105, name: "Thunder Beast", level: 6, values: [7, 2, 4, 4] },
    { id: 106, name: "Shadow Wolf",   level: 6, values: [4, 5, 4, 5] },
    { id: 107, name: "Bone Dragon",   level: 6, values: [6, 3, 6, 2] },
    { id: 108, name: "Plague Lord",   level: 6, values: [5, 5, 3, 4] },
    { id: 109, name: "Crystal Wyrm",  level: 6, values: [4, 6, 4, 3] },
    { id: 110, name: "Dark Sentinel", level: 6, values: [7, 2, 5, 3] },
    { id: 111, name: "Storm Bear",    level: 6, values: [5, 4, 5, 4] },
    { id: 112, name: "Venom Queen",   level: 6, values: [3, 5, 6, 4] },

    // Level 7 (8 new)
    { id: 113, name: "Obsidian Knight",level: 7, values: [6, 4, 5, 4] },
    { id: 114, name: "Frost Giant",    level: 7, values: [7, 3, 4, 5] },
    { id: 115, name: "Hell Hound",    level: 7, values: [5, 6, 3, 5] },
    { id: 116, name: "Storm Titan",   level: 7, values: [6, 4, 6, 3] },
    { id: 117, name: "Ancient Golem", level: 7, values: [4, 5, 5, 5] },
    { id: 118, name: "Blood Drake",   level: 7, values: [7, 2, 5, 5] },
    { id: 119, name: "Iron Warden",   level: 7, values: [5, 5, 4, 5] },
    { id: 120, name: "Wraith Lord",   level: 7, values: [6, 3, 7, 3] },

    // Level 8 (8 new)
    { id: 121, name: "Abyssal Serpent",level: 8, values: [7, 4, 5, 4] },
    { id: 122, name: "Dragon Knight", level: 8, values: [6, 5, 4, 5] },
    { id: 123, name: "Storm Phoenix", level: 8, values: [5, 6, 5, 4] },
    { id: 124, name: "Dark Colossus", level: 8, values: [8, 3, 4, 5] },
    { id: 125, name: "Inferno Drake", level: 8, values: [6, 4, 6, 4] },
    { id: 126, name: "Frost Monarch", level: 8, values: [7, 5, 3, 5] },
    { id: 127, name: "Thunder God",   level: 8, values: [5, 6, 6, 3] },
    { id: 128, name: "Void Sentinel", level: 8, values: [7, 3, 5, 5] },

    // Level 9 (6 new)
    { id: 129, name: "Abyssal King",  level: 9, values: [7, 5, 5, 5] },
    { id: 130, name: "Celestial Dragon",level:9, values: [6, 7, 4, 5] },
    { id: 131, name: "Death Knight",  level: 9, values: [5, 6, 6, 5] },
    { id: 132, name: "Elder Phoenix", level: 9, values: [8, 4, 5, 5] },
    { id: 133, name: "Primordial Wyrm",level:9, values: [4, 7, 6, 5] },
    { id: 134, name: "World Serpent", level: 9, values: [7, 5, 6, 4] },

    // Level 10 (6 new)
    { id: 135, name: "Eternal Dragon", level: 10, values: [9, 7, 5, 5] },
    { id: 136, name: "Chaos Lord",     level: 10, values: [7, 5, 8, 6] },
    { id: 137, name: "Divine Beast",   level: 10, values: [8, 6, 6, 6] },
    { id: 138, name: "Omega Wyrm",     level: 10, values: [10, 4, 7, 5] },
    { id: 139, name: "Astral Phoenix", level: 10, values: [6, 8, 5, 7] },
    { id: 140, name: "Oblivion Knight",level: 10, values: [7, 7, 9, 3] },
];

/** Fisher-Yates shuffle (returns new array) */
TT.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a;
};

/** Deep-clone a single card object */
TT.cloneCard = function (c) {
    return { id: c.id, name: c.name, level: c.level, values: c.values.slice() };
};

/** Deal n unique cards from within a level range */
TT.deal = function (n, minLevel, maxLevel) {
    var pool = TT.CARDS.filter(function (c) {
        return c.level >= minLevel && c.level <= maxLevel;
    });
    return TT.shuffle(pool).slice(0, n).map(TT.cloneCard);
};

/** Display value: 10 → 'A', else the digit */
TT.formatValue = function (v) {
    return v === 10 ? 'A' : String(v);
};
