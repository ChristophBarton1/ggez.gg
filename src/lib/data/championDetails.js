// Champion Build Details (Runes, Skills, Matchups)
// This serves as a static snapshot of meta data for builds.
// In a real app, this would come from an API like Riot Match API or scraped data.

// Rune Tree IDs
const RUNES = {
    PRECISION: 8000,
    DOMINATION: 8100,
    SORCERY: 8200,
    RESOLVE: 8400,
    INSPIRATION: 8300
};

// Common Rune Setups by Role
const ROLE_RUNES = {
    Fighter: {
        primary: RUNES.PRECISION,
        secondary: RUNES.RESOLVE,
        keystone: 8010, // Conqueror
        primaryRunes: [9111, 9104, 8299], // Triumph, Legend: Alacrity, Last Stand
        secondaryRunes: [8444, 8451], // Second Wind, Overgrowth
        shards: [5005, 5008, 5002] // Attack Speed, Adaptive, Armor
    },
    Mage: {
        primary: RUNES.SORCERY,
        secondary: RUNES.INSPIRATION,
        keystone: 8229, // Arcane Comet
        primaryRunes: [8226, 8210, 8237], // Manaflow, Transcendance, Scorch
        secondaryRunes: [8304, 8345], // Boots, Cosmic Insight
        shards: [5008, 5008, 5002]
    },
    Marksman: {
        primary: RUNES.PRECISION,
        secondary: RUNES.DOMINATION,
        keystone: 8008, // Lethal Tempo (or PTA)
        primaryRunes: [9111, 9104, 8014], // Triumph, Alacrity, Coup de Grace
        secondaryRunes: [8139, 8106], // Taste of Blood, Ultimate Hunter
        shards: [5005, 5008, 5002]
    },
    Tank: {
        primary: RUNES.RESOLVE,
        secondary: RUNES.INSPIRATION,
        keystone: 8437, // Grasp
        primaryRunes: [8446, 8429, 8451], // Demolish, Conditioning, Overgrowth
        secondaryRunes: [8304, 8410], // Boots, Approach Velocity
        shards: [5007, 5002, 5002] // Haste, Armor, Armor
    },
    Assassin: {
        primary: RUNES.DOMINATION,
        secondary: RUNES.PRECISION,
        keystone: 8112, // Electrocute
        primaryRunes: [8143, 8138, 8106], // Sudden Impact, Eyeball, Ultimate Hunter
        secondaryRunes: [9111, 8014], // Triumph, Coup de Grace
        shards: [5008, 5008, 5002]
    },
    Support: {
        primary: RUNES.SORCERY,
        secondary: RUNES.INSPIRATION,
        keystone: 8214, // Aery
        primaryRunes: [8226, 8210, 8237], // Manaflow, Transcendance, Scorch
        secondaryRunes: [8304, 8345], // Boots, Cosmic Insight
        shards: [5007, 5008, 5002]
    }
};

// Skill Orders
const SKILL_ORDERS = {
    Mage: { order: ['Q', 'E', 'W'], path: [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3, 4, 3, 3] }, // Q max
    Marksman: { order: ['Q', 'W', 'E'], path: [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3, 4, 3, 3] }, // Q max
    Fighter: { order: ['Q', 'E', 'W'], path: [1, 3, 2, 1, 1, 4, 1, 3, 1, 3, 4, 3, 3, 2, 2, 4, 2, 2] }, // Q max
    Tank: { order: ['W', 'Q', 'E'], path: [2, 1, 3, 2, 2, 4, 2, 1, 2, 1, 4, 1, 1, 3, 3, 4, 3, 3] }, // W max
    Assassin: { order: ['Q', 'W', 'E'], path: [1, 2, 3, 1, 1, 4, 1, 2, 1, 2, 4, 2, 2, 3, 3, 4, 3, 3] }, // Q max
    Support: { order: ['E', 'W', 'Q'], path: [3, 2, 1, 3, 3, 4, 3, 2, 3, 2, 4, 2, 2, 1, 1, 4, 1, 1] }  // E max
};

// Summoner Spells
const SUMMONERS = {
    Flash: 4,
    Ignite: 14,
    Teleport: 12,
    Smite: 11,
    Heal: 7,
    Ghost: 6,
    Exhaust: 3,
    Barrier: 21,
    Cleanse: 1
};

export function getChampionBuildDetails(championId, role, championName) {
    // Default to Fighter if role not found
    const roleKey = ROLE_RUNES[role] ? role : 'Fighter';
    const runes = ROLE_RUNES[roleKey];
    
    // Determine Summoners
    let spells = [SUMMONERS.Flash, SUMMONERS.Ignite]; // Default
    if (role === 'Jungle' || role === 'Fighter' && championName === 'Rek\'Sai') spells = [SUMMONERS.Flash, SUMMONERS.Smite];
    if (role === 'Top' || role === 'Tank') spells = [SUMMONERS.Flash, SUMMONERS.Teleport];
    if (role === 'Marksman') spells = [SUMMONERS.Flash, SUMMONERS.Heal];
    if (role === 'Support') spells = [SUMMONERS.Flash, SUMMONERS.Exhaust];
    if (role === 'Mid' || role === 'Mage') spells = [SUMMONERS.Flash, SUMMONERS.Ignite]; // Or TP

    // Skill Path
    const skillData = SKILL_ORDERS[roleKey] || SKILL_ORDERS.Fighter;
    
    // Fake Matchups (randomized slightly based on ID for consistency)
    const seed = parseInt(championId) || 100;
    const matchups = generateMatchups(seed);

    return {
        runes,
        summoners: spells,
        skillPriority: skillData.order,
        skillPath: skillData.path, // Array of 18 integers (1=Q, 2=W, 3=E, 4=R)
        matchups: matchups
    };
}

function generateMatchups(seed) {
    // List of some champion IDs for matchups
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Just placeholders, UI will fetch names
    // In a real app, this would be actual counter data
    return [
        { championId: (seed * 2) % 150 + 1, winRate: (45 + (seed % 5)).toFixed(1), matches: 100 + (seed % 50) },
        { championId: (seed * 3) % 150 + 1, winRate: (46 + (seed % 5)).toFixed(1), matches: 200 + (seed % 50) },
        { championId: (seed * 4) % 150 + 1, winRate: (47 + (seed % 5)).toFixed(1), matches: 150 + (seed % 50) },
        { championId: (seed * 5) % 150 + 1, winRate: (48 + (seed % 5)).toFixed(1), matches: 300 + (seed % 50) },
        { championId: (seed * 6) % 150 + 1, winRate: (49 + (seed % 5)).toFixed(1), matches: 250 + (seed % 50) },
    ];
}
