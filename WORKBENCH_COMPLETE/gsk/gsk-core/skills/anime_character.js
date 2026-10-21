'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST = {
    name: 'anime_character',
    description: 'Create and manage anime character profiles with visual consistency for OpenMontage production. Generates character sheets, reference prompts, and style guides.',
    version: '1.0.0',
    inputs: {
        name: { type: 'string', required: true, description: 'Character name' },
        role: { type: 'string', description: 'Character role (protagonist, antagonist, supporting, etc.)' },
        description: { type: 'string', description: 'Physical description and personality' },
        age: { type: 'integer', description: 'Character age' },
        gender: { type: 'string', description: 'Character gender' },
        outfit: { type: 'string', description: 'Default outfit description' },
        hairColor: { type: 'string', description: 'Hair color' },
        eyeColor: { type: 'string', description: 'Eye color' },
        action: { type: 'string', default: 'create', description: 'create | list | get | prompt' },
        characterId: { type: 'string', description: 'Existing character ID to retrieve' },
    },
    output: { schema: 'character_profile | character_list | image_prompt' }
};

const PLT_AFFINITY = { profit: 0.3, love: 0.6, tax: 0.1 };

const CHARACTERS_DIR = path.join(__dirname, '..', '..', 'data', 'gsk', 'anime_characters');

function _ensureDir() {
    if (!fs.existsSync(CHARACTERS_DIR)) {
        fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
    }
}

function _generateImagePrompt(character) {
    const styleRefs = [
        'Studio Ghibli aesthetic',
        'cel-shaded anime style',
        'vibrant key visual composition',
        'clean line art, soft shading',
        'expressive eyes, detailed background',
    ].join(', ');

    const basePrompt = [
        `Anime-style character portrait: ${character.name}`,
        `Age: ${character.age || 'unknown'}, Gender: ${character.gender || 'unknown'}`,
        `Role: ${character.role || 'supporting character'}`,
        `Appearance: ${character.description || 'distinctive anime-style features'}`,
        `Hair: ${character.hairColor || 'varied color'}, Eyes: ${character.eyeColor || 'expressive eyes'}`,
        `Outfit: ${character.outfit || 'standard anime school uniform / casual wear'}`,
        `Art style: ${styleRefs}`,
        `Same character in all scenes — character lock: skin tone, hair color, eye color, outfit must remain consistent.`,
        `16:9 aspect ratio, high quality digital anime cel art`,
    ].filter(s => s && !s.includes('undefined') && !s.includes('unknown')).join('. ');

    return basePrompt;
}

function _generateCharacterSheet(character) {
    return {
        id: character.id,
        name: character.name,
        role: character.role,
        age: character.age,
        gender: character.gender,
        description: character.description,
        hairColor: character.hairColor,
        eyeColor: character.eyeColor,
        outfit: character.outfit,
        imagePrompt: _generateImagePrompt(character),
        createdAt: character.createdAt,
    };
}

async function skill_anime_character(params) {
    const input = typeof params === 'string' ? { action: 'create', description: params } : (params || {});
    const action = input.action || 'create';
    _ensureDir();

    if (action === 'list') {
        const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.json'));
        const characters = files.map(f => {
            const data = JSON.parse(fs.readFileSync(path.join(CHARACTERS_DIR, f), 'utf8'));
            return { id: data.id, name: data.name, role: data.role, createdAt: data.createdAt };
        });
        return {
            skill: 'anime_character',
            plt_affinity: PLT_AFFINITY,
            action: 'list',
            count: characters.length,
            characters,
            timestamp: Date.now(),
        };
    }

    if (action === 'get') {
        const charId = input.characterId || input.id;
        if (!charId) {
            return {
                skill: 'anime_character',
                plt_affinity: PLT_AFFINITY,
                error: 'characterId or id is required for get action',
                timestamp: Date.now(),
            };
        }
        const charPath = path.join(CHARACTERS_DIR, `${charId}.json`);
        if (!fs.existsSync(charPath)) {
            return {
                skill: 'anime_character',
                plt_affinity: PLT_AFFINITY,
                error: `Character not found: ${charId}`,
                timestamp: Date.now(),
            };
        }
        const data = JSON.parse(fs.readFileSync(charPath, 'utf8'));
        return {
            skill: 'anime_character',
            plt_affinity: PLT_AFFINITY,
            action: 'get',
            character: _generateCharacterSheet(data),
            timestamp: Date.now(),
        };
    }

    if (action === 'prompt') {
        const charId = input.characterId || input.id;
        if (!charId) {
            return {
                skill: 'anime_character',
                plt_affinity: PLT_AFFINITY,
                error: 'characterId or id is required for prompt action',
                timestamp: Date.now(),
            };
        }
        const charPath = path.join(CHARACTERS_DIR, `${charId}.json`);
        if (!fs.existsSync(charPath)) {
            return {
                skill: 'anime_character',
                plt_affinity: PLT_AFFINITY,
                error: `Character not found: ${charId}`,
                timestamp: Date.now(),
            };
        }
        const data = JSON.parse(fs.readFileSync(charPath, 'utf8'));
        return {
            skill: 'anime_character',
            plt_affinity: PLT_AFFINITY,
            action: 'prompt',
            characterId: charId,
            characterName: data.name,
            imagePrompt: _generateImagePrompt(data),
            characterLock: _generateCharacterSheet(data),
            timestamp: Date.now(),
        };
    }

    // Default: create
    if (!input.name) {
        return {
            skill: 'anime_character',
            plt_affinity: PLT_AFFINITY,
            error: 'name is required to create a character',
            timestamp: Date.now(),
        };
    }

    const crypto = require('crypto');
    const character = {
        id: crypto.randomUUID(),
        name: input.name,
        role: input.role || 'supporting character',
        age: input.age,
        gender: input.gender,
        description: input.description || '',
        hairColor: input.hairColor || '',
        eyeColor: input.eyeColor || '',
        outfit: input.outfit || '',
        createdAt: Date.now(),
    };

    const charPath = path.join(CHARACTERS_DIR, `${character.id}.json`);
    fs.writeFileSync(charPath, JSON.stringify(character, null, 2), 'utf8');

    return {
        skill: 'anime_character',
        plt_affinity: PLT_AFFINITY,
        action: 'create',
        characterId: character.id,
        character: _generateCharacterSheet(character),
        timestamp: Date.now(),
    };
}

module.exports = {
    MANIFEST,
    PLT_AFFINITY,
    run: skill_anime_character,
    skill_anime_character,
};
