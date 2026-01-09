const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_NUM_ROWS = 15;
const MAP_NUM_COLS = 20;

canvas.width = MAP_NUM_COLS * TILE_SIZE;
canvas.height = MAP_NUM_ROWS * TILE_SIZE;

// Tile Types
const TILE_PATH = 0;
const TILE_WALL = 1;
const TILE_GRASS = 2; 
const TILE_CENTER = 3; 

// Game States
const STATE_MAP = 'map';
const STATE_BATTLE = 'battle';
const STATE_GAME_OVER = 'game_over';
const STATE_LEVEL_UP = 'level_up';

let gameState = STATE_MAP;

// --- IMAGES ---
const images = {};
const loadImg = (key, src) => {
    const img = new Image();
    img.src = src;
    images[key] = img;
};

loadImg('player', 'assets/player.svg');
loadImg('tree', 'assets/tree.svg');
loadImg('grass', 'assets/grass.svg');
loadImg('center', 'assets/center.svg');
// We will lazy load pokemon sprites

// Map Data
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 2, 2, 1, 0, 1, 2, 2, 2, 2, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 2, 2, 1, 0, 1, 2, 2, 2, 2, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 2, 2, 2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 2, 2, 0, 1],
    [1, 0, 1, 2, 2, 2, 1, 1, 0, 1, 0, 1, 1, 0, 1, 2, 2, 2, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Pokemon Database with IDs for sprites
const POKEMON_DB = [
    { id: 25, name: "Pikachu", type: "Electric", color: "#FFEB3B", baseHp: 40, baseAtk: 12 },
    { id: 4, name: "Charmander", type: "Fire", color: "#F44336", baseHp: 39, baseAtk: 13 },
    { id: 1, name: "Bulbasaur", type: "Grass", color: "#4CAF50", baseHp: 45, baseAtk: 11 },
    { id: 7, name: "Squirtle", type: "Water", color: "#2196F3", baseHp: 44, baseAtk: 11 },
    { id: 16, name: "Pidgey", type: "Flying", color: "#A1887F", baseHp: 35, baseAtk: 9 },
    { id: 19, name: "Rattata", type: "Normal", color: "#9E9E9E", baseHp: 30, baseAtk: 8 },
    { id: 150, name: "Mewtwo", type: "Psychic", color: "#E1BEE7", baseHp: 100, baseAtk: 25 } 
];

// Sprite Caching
const spriteCache = {};
function getPokemonSprite(id, isBack = false) {
    const key = `${id}_${isBack ? 'back' : 'front'}`;
    if (spriteCache[key]) return spriteCache[key];
    
    const img = new Image();
    // Using PokeAPI Sprites
    if (isBack) {
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
    } else {
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
    spriteCache[key] = img;
    return img;
}

function createPokemon(name, level) {
    const data = POKEMON_DB.find(p => p.name === name) || POKEMON_DB[0];
    const hp = Math.floor(data.baseHp + (level * 2.5));
    const attack = Math.floor(data.baseAtk + (level * 1.5));
    
    // Preload sprites
    getPokemonSprite(data.id, false);
    getPokemonSprite(data.id, true);

    return {
        ...data,
        level: level,
        hp: hp,
        maxHp: hp,
        attack: attack,
        exp: 0,
        maxExp: level * 20
    };
}

const player = {
    x: 1,
    y: 1,
    width: TILE_SIZE,
    height: TILE_SIZE,
    color: '#EA4335',
    direction: 'down',
    pokemon: createPokemon("Pikachu", 5),
    inventory: {
        pokeballs: 5,
        potions: 3
    },
    collection: []
};

let wildPokemon = null;
let battleLog = "";
let tempBattleLog = "";

function drawMap() {
    for (let row = 0; row < MAP_NUM_ROWS; row++) {
        for (let col = 0; col < MAP_NUM_COLS; col++) {
            const tile = map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            // Draw Ground (Path)
            ctx.fillStyle = '#F0EAD6';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (tile === TILE_WALL) {
                if (images.tree.complete) ctx.drawImage(images.tree, x, y, TILE_SIZE, TILE_SIZE);
                else { ctx.fillStyle = '#558B2F'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
            } else if (tile === TILE_GRASS) {
                 if (images.grass.complete) ctx.drawImage(images.grass, x, y, TILE_SIZE, TILE_SIZE);
                 else { ctx.fillStyle = '#8BC34A'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
            } else if (tile === TILE_CENTER) {
                 if (images.center.complete) ctx.drawImage(images.center, x, y, TILE_SIZE, TILE_SIZE);
                 else { ctx.fillStyle = '#E91E63'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
            }
        }
    }
}

function drawPlayer() {
    const x = player.x * TILE_SIZE;
    const y = player.y * TILE_SIZE;
    
    if (images.player.complete) {
        ctx.drawImage(images.player, x, y, TILE_SIZE, TILE_SIZE);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(x, y, player.width, player.height);
    }
}

function drawBattle() {
    // Background
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple battle platform circles
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.ellipse(100, 280, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(canvas.width - 120, 140, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();


    // Wild Pokemon (Top Right)
    const enemyX = canvas.width - 180;
    const enemyY = 50;
    const enemySprite = getPokemonSprite(wildPokemon.id, false);
    
    if (enemySprite && enemySprite.complete) {
        // Draw image larger
        ctx.drawImage(enemySprite, enemyX, enemyY, 120, 120);
    } else {
        ctx.fillStyle = wildPokemon.color;
        ctx.fillRect(enemyX + 30, enemyY + 30, 60, 60);
    }
    
    // Info Box
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${wildPokemon.name} Lv.${wildPokemon.level}`, enemyX - 20, enemyY);
    
    const hpPercent = wildPokemon.hp / wildPokemon.maxHp;
    ctx.fillStyle = '#ccc';
    ctx.fillRect(enemyX - 20, enemyY + 5, 100, 8);
    ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : '#F44336';
    ctx.fillRect(enemyX - 20, enemyY + 5, 100 * hpPercent, 8);


    // Player Pokemon (Bottom Left)
    const playerX = 40;
    const playerY = 180;
    const playerSprite = getPokemonSprite(player.pokemon.id, true);

    if (playerSprite && playerSprite.complete) {
         ctx.drawImage(playerSprite, playerX, playerY, 120, 120);
    } else {
        ctx.fillStyle = player.pokemon.color;
        ctx.fillRect(playerX + 30, playerY + 30, 60, 60);
    }
    
    const pInfoX = playerX + 130;
    const pInfoY = playerY + 50;
    
    ctx.fillStyle = '#000';
    ctx.fillText(`${player.pokemon.name} Lv.${player.pokemon.level}`, pInfoX, pInfoY);
    ctx.fillText(`HP: ${player.pokemon.hp}/${player.pokemon.maxHp}`, pInfoX, pInfoY + 20);
    
    const expPercent = player.pokemon.exp / player.pokemon.maxExp;
    ctx.fillStyle = '#DDD';
    ctx.fillRect(pInfoX, pInfoY + 30, 100, 5);
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(pInfoX, pInfoY + 30, 100 * expPercent, 5);

    // UI Panel (Bottom)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Controls/Log
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    if (battleLog) {
        ctx.fillText(battleLog, 20, canvas.height - 60);
        ctx.fillStyle = '#FFEB3B';
        ctx.font = '14px monospace';
        ctx.fillText("Press 'Z' to continue...", 20, canvas.height - 30);
    } else {
        ctx.fillText("What will you do?", 20, canvas.height - 70);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(`[Z] Attack`, 20, canvas.height - 40);
        
        ctx.fillStyle = '#FF9800';
        ctx.fillText(`[X] Run`, 130, canvas.height - 40);
        
        ctx.fillStyle = '#2196F3';
        ctx.fillText(`[C] Catch (${player.inventory.pokeballs})`, 240, canvas.height - 40);
        
        ctx.fillStyle = '#E91E63';
        ctx.fillText(`[I] Potion (${player.inventory.potions})`, 420, canvas.height - 40);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === STATE_MAP) {
        drawMap();
        drawPlayer();
        
        ctx.fillStyle = 'black';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Lv.${player.pokemon.level} ${player.pokemon.name} | HP: ${player.pokemon.hp}/${player.pokemon.maxHp}`, 5, 15);
        ctx.fillText(`Balls: ${player.inventory.pokeballs} | Potions: ${player.inventory.potions} | Caught: ${player.collection.length}`, 5, 30);
        // ctx.fillText('Move: Arrows | Pink Tile: Heal/Restock', 5, canvas.height - 10);
    } else if (gameState === STATE_BATTLE) {
        drawBattle();
    } else if (gameState === STATE_LEVEL_UP) {
        drawBattle(); 
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
        ctx.fillStyle = '#FFF';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("LEVEL UP!", canvas.width/2, 100);
        ctx.font = '16px monospace';
        ctx.fillText(`${player.pokemon.name} grew to Lv. ${player.pokemon.level}!`, canvas.width/2, 140);
        ctx.fillText(`Max HP +5`, canvas.width/2, 170);
        ctx.fillText(`Attack +2`, canvas.width/2, 200);
        ctx.fillStyle = '#FFEB3B';
        ctx.fillText("Press 'Z' to continue", canvas.width/2, 250);
        ctx.textAlign = 'left';
    } else if (gameState === STATE_GAME_OVER) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = '#F44336';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

function checkEncounter() {
    if (Math.random() < 0.2) { 
        startBattle();
    }
}

function startBattle() {
    gameState = STATE_BATTLE;
    
    const levelOffset = Math.floor(Math.random() * 3) - 1;
    let lvl = player.pokemon.level + levelOffset;
    if (lvl < 1) lvl = 1;

    const randomIndex = Math.floor(Math.random() * (POKEMON_DB.length - 1));
    const pokeTemplate = POKEMON_DB[randomIndex];
    wildPokemon = createPokemon(pokeTemplate.name, lvl);
    
    battleLog = `A wild ${wildPokemon.name} appeared!`;
}

function gainExp(amount) {
    player.pokemon.exp += amount;
    battleLog = `You gained ${amount} EXP!`;
    
    if (player.pokemon.exp >= player.pokemon.maxExp) {
        const remainder = player.pokemon.exp - player.pokemon.maxExp;
        
        player.pokemon.level++;
        player.pokemon.exp = remainder;
        player.pokemon.maxExp = player.pokemon.level * 20;
        
        player.pokemon.maxHp += 5;
        player.pokemon.hp = player.pokemon.maxHp; 
        player.pokemon.attack += 2;
        
        tempBattleLog = battleLog; 
        gameState = STATE_LEVEL_UP;
    }
}

function playerAttack() {
    const damage = Math.floor(player.pokemon.attack * (0.9 + Math.random() * 0.2)); 
    wildPokemon.hp -= damage;
    if (wildPokemon.hp < 0) wildPokemon.hp = 0;
    return damage;
}

function usePotion() {
    if (player.inventory.potions > 0) {
        player.inventory.potions--;
        const healAmount = 20;
        player.pokemon.hp += healAmount;
        if (player.pokemon.hp > player.pokemon.maxHp) player.pokemon.hp = player.pokemon.maxHp;
        battleLog = `Used Potion! Recovered ${healAmount} HP.`;
        setTimeout(() => enemyTurn(), 1000);
    } else {
        battleLog = "You don't have any Potions!";
    }
}

function throwPokeball() {
    if (player.inventory.pokeballs > 0) {
        player.inventory.pokeballs--;
        
        const hpFactor = (wildPokemon.maxHp - wildPokemon.hp) / wildPokemon.maxHp; 
        const chance = 0.4 + (hpFactor * 0.5); 
        
        if (Math.random() < chance) {
            player.collection.push(wildPokemon);
            battleLog = `Gotcha! ${wildPokemon.name} was caught!`;
            tempBattleLog = "win"; 
        } else {
            battleLog = `Argh! ${wildPokemon.name} broke free!`;
            setTimeout(() => enemyTurn(), 1000);
        }
    } else {
        battleLog = "You don't have any Pokeballs!";
    }
}

function enemyTurn() {
    if (wildPokemon.hp <= 0) {
        const expGain = Math.floor(wildPokemon.level * 10);
        gainExp(expGain);
        
        if (Math.random() < 0.3) {
            if (Math.random() < 0.5) player.inventory.potions++;
            else player.inventory.pokeballs++;
        }
        return;
    }

    const damage = Math.floor(wildPokemon.attack * (0.8 + Math.random() * 0.4));
    player.pokemon.hp -= damage;
    if (player.pokemon.hp < 0) player.pokemon.hp = 0;
    
    battleLog = `${wildPokemon.name} attacked! Dealt ${damage} dmg.`;
}

document.addEventListener('keydown', (e) => {
    if (gameState === STATE_MAP) {
        let newX = player.x;
        let newY = player.y;
        let moved = false;

        switch (e.key) {
            case 'ArrowUp': player.direction = 'up'; newY--; moved = true; break;
            case 'ArrowDown': player.direction = 'down'; newY++; moved = true; break;
            case 'ArrowLeft': player.direction = 'left'; newX--; moved = true; break;
            case 'ArrowRight': player.direction = 'right'; newX++; moved = true; break;
        }

        if (moved) {
            if (newX >= 0 && newX < MAP_NUM_COLS && newY >= 0 && newY < MAP_NUM_ROWS) {
                const tile = map[newY][newX];
                if (tile !== TILE_WALL) {
                    player.x = newX;
                    player.y = newY;
                    
                    if (tile === TILE_GRASS) checkEncounter();
                    if (tile === TILE_CENTER) {
                        player.pokemon.hp = player.pokemon.maxHp;
                        player.inventory.potions = Math.max(player.inventory.potions, 3);
                        player.inventory.pokeballs = Math.max(player.inventory.pokeballs, 5);
                    }
                }
            }
        }
    } else if (gameState === STATE_BATTLE) {
        if (battleLog) {
            if (e.key === 'z' || e.key === 'Z') {
                if (wildPokemon.hp <= 0 || tempBattleLog === "win") {
                    gameState = STATE_MAP;
                    battleLog = "";
                    tempBattleLog = "";
                } else if (player.pokemon.hp <= 0) {
                    gameState = STATE_GAME_OVER;
                } else {
                    if (battleLog.includes("attacked!")) {
                        battleLog = ""; 
                    } else if (battleLog.includes("appeared")) {
                        battleLog = "";
                    } else if (battleLog.includes("You attacked")) {
                         enemyTurn();
                    } else if (battleLog.includes("escaped")) {
                        gameState = STATE_MAP;
                        battleLog = "";
                    }
                }
            }
        } else {
            if (e.key === 'z' || e.key === 'Z') {
                const dmg = playerAttack();
                battleLog = `You attacked! Dealt ${dmg} dmg.`;
            } else if (e.key === 'x' || e.key === 'X') {
                if (Math.random() > 0.4) {
                    battleLog = "Got away safely!";
                    tempBattleLog = "win"; 
                } else {
                    battleLog = "Can't escape!";
                    setTimeout(() => enemyTurn(), 1000);
                }
            } else if (e.key === 'c' || e.key === 'C') {
                throwPokeball();
            } else if (e.key === 'i' || e.key === 'I') {
                usePotion();
            }
        }
    } else if (gameState === STATE_LEVEL_UP) {
        if (e.key === 'z' || e.key === 'Z') {
             gameState = STATE_MAP;
             battleLog = "";
        }
    } else if (gameState === STATE_GAME_OVER) {
        if (e.key === 'r' || e.key === 'R') {
            location.reload(); 
        }
    }
    draw();
});

// Loop for animation if needed, but we rely on events for now.
// Add a simple loop to ensure images render when loaded
function gameLoop() {
    if (gameState === STATE_MAP) draw(); // Redraw map to catch loaded images
    // In battle, we might need constant redraw if we had animations
    requestAnimationFrame(gameLoop);
}
gameLoop();