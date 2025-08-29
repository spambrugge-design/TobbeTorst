// 1. GRUNDLÄGGANDE INSTÄLLNINGAR
// ===============================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // "Context" är ytan vi ritar på

// Hämta UI-element från HTML
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// Spelvariabler
let score = 0;
let lives = 3;
let isGameOver = false;
const barPositions = [80, 205, 330, 455];

// *** ÄNDRAD: Ladda in tre bilder ***
const playerImage = new Image();
playerImage.src = 'otto.png';

// *** NYTT: Ladda in den andra bilden för spelaren ***
const playerImage2 = new Image();
playerImage2.src = 'otto2.png'; 

const beerImage = new Image();
beerImage.src = 'ol.png';

let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    // *** ÄNDRAD: Starta spelet när TRE bilder är laddade ***
    if (imagesLoaded === 3) {
        restartGame();
    }
}
playerImage.onload = onImageLoad;
playerImage2.onload = onImageLoad; // *** NYTT ***
beerImage.onload = onImageLoad;


// 2. SPELOBJEKT (SPELARE OCH ÖL)
// ===============================

// Spelaren ("Otto")
const player = {
    x: 30,
    y: barPositions[0],
    width: 60,
    height: 90,
    currentLane: 0,
    // *** NYTT: Egenskaper för drick-animationen ***
    isDrinking: false,
    drinkingTimer: 0,
    drinkingDuration: 15, // Animationen varar i 15 frames (ca 0.25 sekunder)
    
    // *** ÄNDRAD: draw-funktionen väljer nu bild baserat på isDrinking ***
    draw: function() {
        let imageToDraw = this.isDrinking ? playerImage2 : playerImage;
        ctx.drawImage(imageToDraw, this.x, this.y - this.height / 2, this.width, this.height);
    },
    
    // Funktioner för att flytta spelaren
    moveUp: function() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.y = barPositions[this.currentLane];
        }
    },
    moveDown: function() {
        if (this.currentLane < barPositions.length - 1) {
            this.currentLane++;
            this.y = barPositions[this.currentLane];
        }
    }
};

// ... (resten av sektion 2 och 3 är oförändrad) ...
let beers = [];
let beerSpeed = 3;
let beerSpawnRate = 120;
let frameCount = 0;

function spawnBeer() {
    const lane = Math.floor(Math.random() * barPositions.length);
    beers.push({
        x: canvas.width,
        y: barPositions[lane],
        width: 40,
        height: 60,
    });
}

document.addEventListener('keydown', function(event) {
    if (isGameOver) {
        if (event.code === 'Space') {
            restartGame();
        }
        return;
    }
    if (event.key === 'ArrowUp' || event.key === 'w') {
        player.moveUp();
    } else if (event.key === 'ArrowDown' || event.key === 's') {
        player.moveDown();
    }
});
// ... (sektion 4 är oförändrad) ...
function restartGame() {
    score = 0;
    lives = 3;
    beerSpeed = 3;
    beerSpawnRate = 120;
    beers = [];
    isGameOver = false;
    player.currentLane = 0;
    player.y = barPositions[0];
    player.isDrinking = false; // Återställ animationen
    frameCount = 0;
    
    updateUI();
    gameOverScreen.classList.add('hidden');
    cancelAnimationFrame(animationFrameId); 
    gameLoop();
}

function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

function drawBars() {
    ctx.fillStyle = '#8b4513';
    for (const y of barPositions) {
        ctx.fillRect(0, y + 20, canvas.width, 10);
    }
}
// 5. SPELLOOPEN (HJÄRTAT I SPELET)
// ==================================
let animationFrameId;

function gameLoop() {
    if (isGameOver) return;

    // A. Rensa skärmen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // B. Rita ut bakgrund och statiska element
    drawBars();

    // C. Uppdatera och rita spelobjekt
    
    // *** NYTT: Hantera drick-animationens timer ***
    if (player.isDrinking) {
        player.drinkingTimer--;
        if (player.drinkingTimer <= 0) {
            player.isDrinking = false; // Avsluta animationen när timern är slut
        }
    }
    
    // Spelaren
    player.draw();

    // Ölen
    frameCount++;
    if (frameCount % beerSpawnRate === 0) {
        spawnBeer();
        beerSpeed += 0.1;
        if (beerSpawnRate > 40) {
            beerSpawnRate -= 2;
        }
    }

    // Loopa igenom alla öl baklänges
    for (let i = beers.length - 1; i >= 0; i--) {
        let beer = beers[i];
        
        beer.x -= beerSpeed;
        
        ctx.drawImage(beerImage, beer.x, beer.y - beer.height / 2, beer.width, beer.height);
        
        // D. Kollisionsdetektering
        if (beer.x < player.x + player.width &&
            beer.x + beer.width > player.x &&
            Math.abs(beer.y - player.y) < 10) {
            
            score += 10;
            beers.splice(i, 1);
            
            // *** NYTT: Starta drick-animationen vid kollision ***
            player.isDrinking = true;
            player.drinkingTimer = player.drinkingDuration;

        } else if (beer.x + beer.width < 0) {
            lives--;
            beers.splice(i, 1);
            if (lives <= 0) {
                lives = 0;
                isGameOver = true;
                finalScoreElement.textContent = score;
                gameOverScreen.classList.remove('hidden');
            }
        }
    }
    
    // E. Uppdatera UI
    updateUI();

    // F. Anropa nästa frame i loopen
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Startar först när bilderna är laddade...
updateUI();