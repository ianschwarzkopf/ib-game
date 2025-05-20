// server.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // serve static files

// Game state
const players = {};

const stageWidth = 640;
const stageHeight = 360;

const Character = require('./public/characters/Character.js');

function randomSpawn() {
  return Math.random() * (stageWidth - 100) + 50;
}

io.on('connection', socket => {
  console.log(`Player connected: ${socket.id}`);

  const characterTypes = ['glyph', 'vexa'];
  const charType = characterTypes[Math.floor(Math.random() * characterTypes.length)];

  const character = new Character(charType);

  players[socket.id] = {
    x: randomSpawn(),
    y: stageHeight - 60,
    vx: 0,
    vy: 0,
    health: character.health,
    maxHealth: character.health,
    facing: 1,
    attacking: false,
    grounded: true,
    knockback: 0,
    isDead: false,
    characterType: charType,
    attacks: character.attacks,
    speed: character.speed,
    knockbacks: character.knockbacks,
  };

  // Send all players to the new player
  socket.emit('currentPlayers', players);

  // Notify existing players about new player
  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  // Receive inputs from client
  socket.on('playerInput', input => {
    if (!players[socket.id]) return;
    // Update player state based on input
    players[socket.id].input = input;
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

// Game loop variables
const gravity = 0.8;
const friction = 0.8;
const moveSpeed = 5;
const jumpPower = 15;

function gameLoop() {
  // Update each player
  for (const id in players) {
    const p = players[id];
    if (p.isDead) continue;

    const input = p.input || {};

    // Horizontal movement
    if (input.left) p.vx = -moveSpeed;
    else if (input.right) p.vx = moveSpeed;
    else p.vx *= friction;

    // Jump
    if (input.jump && p.grounded) {
      p.vy = -jumpPower;
      p.grounded = false;
    }

    // Gravity
    p.vy += gravity;

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Boundaries and ground collision
    if (p.x < 0) p.x = 0;
    if (p.x > stageWidth) p.x = stageWidth;
    if (p.y > stageHeight - 32) {
      p.y = stageHeight - 32;
      p.vy = 0;
      p.grounded = true;
    }

    // Handle knockback decay
    if (p.knockback > 0) {
      p.vx += p.facing * p.knockback;
      p.knockback *= 0.9;
      if (p.knockback < 0.1) p.knockback = 0;
    }

    // Attack handling
    if (input.basic && !p.attacking) {
      p.attacking = true;

      for (const otherId in players) {
        if (otherId === id) continue;
        const o = players[otherId];
        if (Math.abs(o.x - p.x) < 50 && Math.abs(o.y - p.y) < 50) {
          o.health -= p.attacks.basic;  // Use character’s basic attack damage
          o.knockback = p.knockbacks.basic + o.health * 0.3;
          o.facing = o.x > p.x ? 1 : -1;
          o.vx = o.facing * o.knockback;
        }
      }

      setTimeout(() => {
        p.attacking = false;
      }, 300);
    }


    if (input.special && !p.attacking) {
      p.attacking = true;

      for (const otherId in players) {
        if (otherId === id) continue;
        const o = players[otherId];
        if (Math.abs(o.x - p.x) < 50 && Math.abs(o.y - p.y) < 50) {
          o.health -= p.attacks.special;  // Use character’s basic attack damage
          o.knockback = p.knockbacks.special + o.health * 0.3;
          o.facing = o.x > p.x ? 1 : -1;
          o.vx = o.facing * o.knockback;
        }
      }

      setTimeout(() => {
        p.attacking = false;
      }, 300);
    }

    if (input.ult && !p.attacking) {
      p.attacking = true;

      for (const otherId in players) {
        if (otherId === id) continue;
        const o = players[otherId];
        if (Math.abs(o.x - p.x) < 50 && Math.abs(o.y - p.y) < 50) {
          o.health -= p.attacks.ult;  // Use character’s basic attack damage
          o.knockback = p.knockbacks.ult + o.health * 0.3;
          o.facing = o.x > p.x ? 1 : -1;
          o.vx = o.facing * o.knockback;
        }
      }

      setTimeout(() => {
        p.attacking = false;
      }, 300);
    }

    // Check if player fell off stage
    if (p.y > stageHeight + 100) {
      p.isDead = true;
      setTimeout(() => {
        // Respawn
        p.x = randomSpawn();
        p.y = stageHeight - 60;
        p.health = 0;
        p.isDead = false;
      }, 3000);
    }
  }

  io.emit('gameState', players);
}

setInterval(gameLoop, 1000 / 60);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
