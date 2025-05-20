
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const BASE_WIDTH = 640;
const BASE_HEIGHT = 360;

canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // 16:9 aspect ratio means height = width * 9/16
  let newWidth = windowWidth;
  let newHeight = newWidth * 9 / 16;

  // If height is too tall for the window, adjust based on height
  if (newHeight > windowHeight) {
    newHeight = windowHeight;
    newWidth = newHeight * 16 / 9;
  }

  // Make sure width/height are integers and don’t exceed window size
  newWidth = Math.min(newWidth, windowWidth);
  newHeight = Math.min(newHeight, windowHeight);

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
}



resizeCanvas();
window.addEventListener('resize', resizeCanvas);


const socket = io();

const vexaImg = new Image();
vexaImg.src = './characters/vexa.png';

const glyphImg = new Image();
glyphImg.src = './characters/glyph.png';

let players = {};
let myId = null;
let input = {
  left: false,
  right: false,
  jump: false,
  basic: false,
  special: false,
  ult: false,
};

// Controls
window.addEventListener('keydown', e => {
  if (e.key === 'a' || e.key === 'ArrowLeft') input.left = true;
  if (e.key === 'd' || e.key === 'ArrowRight') input.right = true;
  if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') input.jump = true;
  if (e.key === 'j') input.basic = true;
  if (e.key === 'k') input.special = true;
  if (e.key === 'l') input.ult = true;
});

window.addEventListener('keyup', e => {
  if (e.key === 'a' || e.key === 'ArrowLeft') input.left = false;
  if (e.key === 'd' || e.key === 'ArrowRight') input.right = false;
  if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') input.jump = false;
  if (e.key === 'j') input.basic = false;
  if (e.key === 'k') input.special = false;
  if (e.key === 'l') input.ult = false;

});

socket.on('connect', () => {
  myId = socket.id;
});

socket.on('currentPlayers', serverPlayers => {
  players = serverPlayers;
});

socket.on('newPlayer', player => {
  players[player.id] = player;
});

socket.on('playerDisconnected', id => {
  delete players[id];
});

socket.on('gameState', serverPlayers => {
  players = serverPlayers;
});

function drawPlayer(p, isMe) {
  let sprite = null;

  if (p.characterType === 'vexa') sprite = vexaImg;
  else if (p.characterType === 'glyph') sprite = glyphImg;

  ctx.drawImage(sprite, p.x - 32, p.y - 32, 64, 64);

  // Health bar
  const barWidth = 40;
  const barHeight = 5;

  ctx.fillStyle = 'white';
  ctx.fillRect(p.x - barWidth / 2, p.y - 60, barWidth, barHeight);

  ctx.fillStyle = 'red';
  const healthRatio = Math.max(0, Math.min(1, p.health / p.maxHealth));
  ctx.fillRect(p.x - barWidth / 2, p.y - 60, barWidth * healthRatio, barHeight);

  // Attack indicator
  if (p.attacking) {
    ctx.fillStyle = 'orange';
    ctx.fillRect(p.x + 20 * p.facing, p.y, 20 * p.facing, 10);
  }
}



function gameLoop() {
  for (const id in players) {
  const p = players[id];
  console.log(p.type, p);  // <-- Add this line to debug
  if (p.isDead) continue;
  drawPlayer(p, id === myId);
}

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = '#555';
  ctx.fillRect(0, canvas.height + 10, canvas.width, 10);

  // Draw players
  for (const id in players) {
    const p = players[id];
    if (p.isDead) continue;
    drawPlayer(p, id === myId);
  }

  // Send inputs to server
  socket.emit('playerInput', input);

  requestAnimationFrame(gameLoop);
}

gameLoop();
