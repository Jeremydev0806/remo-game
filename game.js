const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');
const messageDiv = document.getElementById('message');

const W = canvas.width;
const H = canvas.height;

// Remolacha character
const beet = {
  x: W/2 - 20,
  y: H - 100,
  w: 40,
  h: 50,
  vy: 0,
  vx: 0,
  gravity: 0.3,
  jumpPower: 12,
  maxVX: 5,
  alive: true,
  direction: 'right',
  abilities: {
    superJump: false
  }
};

// Platforms
const platformCount = 8;
const platformWidth = 70;
const platformHeight = 14;
let platforms = [];

// Game state
let score = 0;
let highScore = 0;
let gameOver = false;
let lastPlatformY = H - 20;
let showMessage = false;
let messageTimer = 0;
let lastMessageScore = 0;

// Controls
let leftPressed = false;
let rightPressed = false;


function drawBeet(x, y, w, h, direction) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  if(direction === 'left') ctx.scale(-1, 1);
  ctx.translate(-w/2, -h/2);

  ctx.beginPath();
  ctx.ellipse(w/2, h/2 - 5, w/2, h/2, 0, 0, 2*Math.PI);
  ctx.fillStyle = "#a1005e";
  ctx.fill();
  ctx.strokeStyle = "#800040";
  ctx.lineWidth = 2;
  ctx.stroke();

  for(let i=0; i<3; i++) {
    ctx.beginPath();
    ctx.moveTo(w/2, 8);
    ctx.bezierCurveTo(w/2 + (i-1)*8, 0, w/2 + (i-1)*12, -18, w/2 + (i-1)*4, -20);
    ctx.strokeStyle = "#299e2e";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(w/2 - 7, h/2, 4, 0, 2*Math.PI);
  ctx.arc(w/2 + 7, h/2, 4, 0, 2*Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w/2 - 7, h/2, 1.5, 0, 2*Math.PI);
  ctx.arc(w/2 + 7, h/2, 1.5, 0, 2*Math.PI);
  ctx.fillStyle = "#111";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(w/2, h/2 + 10, 8, Math.PI/8, Math.PI - Math.PI/8);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPlatform(p) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, platformWidth, platformHeight);
  if(p.type === "normal") ctx.fillStyle = "#a1005e";
  else if(p.type === "bouncy") ctx.fillStyle = "#299e2e";
  else if(p.type === "super") ctx.fillStyle = "#ffd700";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#800040";
  ctx.stroke();

  if(p.type === "bouncy") {
    ctx.beginPath();
    ctx.moveTo(p.x + platformWidth/2 - 8, p.y + platformHeight);
    ctx.lineTo(p.x + platformWidth/2 + 8, p.y + platformHeight);
    ctx.strokeStyle = "#299e2e";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if(p.type === "super") {
    ctx.save();
    ctx.translate(p.x + platformWidth/2, p.y + platformHeight/2);
    ctx.rotate(Math.PI/10);
    ctx.beginPath();
    for(let i=0; i<5; i++){
      ctx.lineTo(0, 7);
      ctx.rotate(Math.PI/5);
      ctx.lineTo(0, -7);
      ctx.rotate(Math.PI/5);
    }
    ctx.fillStyle = "#fff79a";
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function resetGame() {
  beet.x = W/2 - beet.w/2;
  beet.y = H - 100;
  beet.vy = 0;
  beet.vx = 0;
  beet.alive = true;
  beet.abilities.superJump = false;
  score = 0;
  gameOver = false;
  lastPlatformY = H - 20;
  messageDiv.style.display = "none";
  showMessage = false;
  messageTimer = 0;
  lastMessageScore = 0;

  platforms = [];
  platforms.push({
    x: beet.x + beet.w/2 - platformWidth/2,
    y: beet.y + beet.h + 5,
    type: "normal"
  });

  let y = H - 40;
  for(let i=0; i<platformCount; i++) {
    let px = Math.random() * (W - platformWidth);
    platforms.push({
      x: px,
      y: y,
      type: i === 0 ? "normal" : randomPlatformType(i)
    });
    y -= (H/platformCount);
  }

  scoreDiv.innerText = "Score: 0";
  restartBtn.style.display = "none";
}

function randomPlatformType(index) {
  if (score > 0 && (score + index) % 30 === 0) return "super";
  if (score > 0 && (score + index) % 10 === 0) return "bouncy";
  return "normal";
}

function update() {
  if(!beet.alive) return;

  beet.x += beet.vx;
  beet.y += beet.vy;
  beet.vy += beet.gravity;

  if(beet.x < -beet.w/2) beet.x = W - beet.w/2;
  if(beet.x > W - beet.w/2) beet.x = -beet.w/2;

  if(leftPressed) {
    beet.vx = Math.max(beet.vx - 0.4, -beet.maxVX);
    beet.direction = 'left';
  } else if(rightPressed) {
    beet.vx = Math.min(beet.vx + 0.4, beet.maxVX);
    beet.direction = 'right';
  } else {
    beet.vx *= 0.92;
    if(Math.abs(beet.vx) < 0.1) beet.vx = 0;
  }

  for(let p of platforms) {
    if(
      beet.vy > 0 &&
      beet.x + beet.w/2 > p.x &&
      beet.x + beet.w/2 < p.x + platformWidth &&
      beet.y + beet.h > p.y &&
      beet.y + beet.h < p.y + platformHeight + beet.vy
    ) {
      if(p.type === "super") {
        beet.vy = -beet.jumpPower * 2.2;
        beet.abilities.superJump = true;
        showSuperJumpMessage();
      } else if(p.type === "bouncy") {
        beet.vy = -beet.jumpPower * 1.4;
      } else {
        beet.vy = beet.abilities.superJump ? -beet.jumpPower * 1.3 : -beet.jumpPower;
      }
      score += 1;
      if(score > highScore) highScore = score;
      scoreDiv.innerText = "Score: " + score;
      break;
    }
  }

  if(beet.y < H/2) {
    let dy = H/2 - beet.y;
    beet.y = H/2;
    for(let p of platforms) p.y += dy;
    score += Math.floor(dy/10);
    scoreDiv.innerText = "Score: " + score;
  }

  // ⚠️ BLOQUE CORREGIDO: generación segura de plataformas
  for(let i=0; i<platforms.length; i++) {
    let p = platforms[i];
    if (p.y > H) {
      const g = beet.gravity;
      const v = beet.abilities.superJump ? beet.jumpPower * 1.3 : beet.jumpPower;
      const maxHeight = (v * v) / (2 * g);
      const minStep = 40;
      const maxStep = Math.min(maxHeight - 10, 160);
      const topY = platforms.reduce((min, p) => Math.min(min, p.y), H);
      const newY = topY - (Math.random() * (maxStep - minStep) + minStep);
      const timeToPeak = v / g;
      const maxHorizontalReach = beet.maxVX * timeToPeak;
      let newX = beet.x + (Math.random() - 0.5) * 2 * maxHorizontalReach;
      if (newX < 0) newX = 0;
      if (newX > W - platformWidth) newX = W - platformWidth;

      platforms[i] = {
        x: newX,
        y: newY,
        type: randomPlatformType(i)
      };
    }
  }

  if(score > 0 && score % 200 === 0 && score !== lastMessageScore) {
    showKeepGoingMessage();
    lastMessageScore = score;
  }

  if(beet.y > H) {
    beet.alive = false;
    gameOver = true;
    restartBtn.style.display = "block";
    scoreDiv.innerText += " | Puntaje mas alto " + highScore;
  }

  if(showMessage && messageTimer > 0) {
    messageTimer--;
    if(messageTimer <= 0) {
      messageDiv.style.display = "none";
      showMessage = false;
    }
  }
}

function showKeepGoingMessage() {
  messageDiv.innerText = "SIGUE AVANZANDOOOO REMOLACHITA";
  messageDiv.style.display = "block";
  showMessage = true;
  messageTimer = 120;
}

function showSuperJumpMessage() {
  messageDiv.innerText = "¡Super Salto Activado!";
  messageDiv.style.display = "block";
  showMessage = true;
  messageTimer = 60;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for(let p of platforms) drawPlatform(p);
  drawBeet(beet.x, beet.y, beet.w, beet.h, beet.direction);

  if(gameOver) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#fff";
    ctx.fillRect(W/2-140,H/2-60,280,120);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#a1005e";
    ctx.font = "bold 32px Arial";   // 👈 cambiado
    ctx.textAlign = "center";
    ctx.fillText("¡UYYYY Perdiste!", W/2, H/2-10);
    ctx.font = "20px Arial";        // 👈 cambiado
    ctx.fillText(" Saltos: " + score, W/2, H/2+24);
    ctx.fillText("High Score: " + highScore, W/2, H/2+52);
    ctx.restore();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
  if(e.code === "ArrowLeft" || e.key === "a") leftPressed = true;
  if(e.code === "ArrowRight" || e.key === "d") rightPressed = true;
});
document.addEventListener('keyup', e => {
  if(e.code === "ArrowLeft" || e.key === "a") leftPressed = false;
  if(e.code === "ArrowRight" || e.key === "d") rightPressed = false;
});

canvas.addEventListener('touchstart', function(e) {
  let touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  if(touchX < W/2) leftPressed = true;
  else rightPressed = true;
});
canvas.addEventListener('touchend', function(e) {
  leftPressed = false;
  rightPressed = false;
});

restartBtn.addEventListener('click', function() {
  resetGame();
});

resetGame();
gameLoop();
