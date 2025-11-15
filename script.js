const btnNo = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');
const introCard = document.getElementById('introCard');
const gameCard = document.getElementById('gameCard');

let transformed = false;
btnNo.addEventListener('mouseenter', ()=>{
  if (transformed) return;
  btnNo.classList.remove('btn-no');
  btnNo.classList.add('btn-yes');
  btnNo.textContent = 'Hə';
  transformed = true;
});

function startGame(){
  introCard.style.display = 'none';
  gameCard.style.display = 'block';
  setTimeout(initCanvas,50);
}
btnYes.addEventListener('click', startGame);
btnNo.addEventListener('click', startGame);

const canvas = document.getElementById('c');
const arena = document.getElementById('arena');
const jarWin = document.getElementById('jarWin');
const jarLose = document.getElementById('jarLose'); 
const overlay = document.getElementById('overlay');
const confetti = document.getElementById('confetti');


let ctx, W, H;
let ball = {x:0,y:0,r:18,dragging:false,ox:0,oy:0};
let slingPos = {x:140,y: H? (H-120):400};
let animating=false;

function resize(){
  W = arena.clientWidth; H = arena.clientHeight;
  canvas.width = W; canvas.height = H;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  jarWin.style.bottom = '36px'; jarWin.style.right = '110px';
  jarLose.style.bottom = '36px'; jarLose.style.right = '320px';
  slingPos.x = 80; slingPos.y = H - 80;
  if (!ball.dragging && !animating){
    ball.x = slingPos.x + 28; ball.y = slingPos.y - 22; ball.ox = ball.x; ball.oy = ball.y;
  }
}

function drawSling(){
  ctx.save();
  ctx.translate(slingPos.x, slingPos.y);
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.quadraticCurveTo(ball.x - slingPos.x, ball.y - slingPos.y, 18, -28);
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,20,20,0.6)'; ctx.stroke();
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,W,H);
  const g = ctx.createLinearGradient(0,H-140,0,H);
  g.addColorStop(0,'#07202a'); g.addColorStop(1,'#021417');
  ctx.fillStyle = g; ctx.fillRect(0,H-140,W,140);

  drawSling();

  ctx.save();
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  const grad = ctx.createRadialGradient(ball.x-6, ball.y-8, 4, ball.x, ball.y, ball.r);
  grad.addColorStop(0,'#fff'); grad.addColorStop(0.12,'#ffd9a8'); grad.addColorStop(0.5,'#ff8b3d'); grad.addColorStop(1,'#d9480f');
  ctx.fillStyle = grad; ctx.fill();
  ctx.restore();
}

function initCanvas(){
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  draw();
  canvas.addEventListener('pointerdown', startDrag);
  canvas.addEventListener('pointermove', onDrag);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', endDrag);
}

function pointInBall(px,py){
  const dx = px - ball.x, dy = py - ball.y; return Math.sqrt(dx*dx+dy*dy) <= ball.r+6;
}

function startDrag(e){
  if (animating) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  if (pointInBall(x,y)){
    ball.dragging = true;
    canvas.setPointerCapture(e.pointerId);
  }
}

function onDrag(e){
  if (!ball.dragging) return;
  const rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left, y = e.clientY - rect.top;
  const dx = x - (slingPos.x+28), dy = y - (slingPos.y-22);
  const max = 120; const d = Math.hypot(dx,dy);
  if (d > max){ x = (dx/d)*max + (slingPos.x+28); y = (dy/d)*max + (slingPos.y-22); }
  ball.x = x; ball.y = y;
  draw();
}

function endDrag(e){
  if (!ball.dragging) return;
  ball.dragging = false;
  const vx = (slingPos.x+28) - ball.x; const vy = (slingPos.y-22) - ball.y;
  launchBall(vx,vy);
}

function getJarCenter(el){
  const r = el.getBoundingClientRect();
  const a = arena.getBoundingClientRect();
  return {x: r.left - a.left + r.width/2, y: r.top - a.top + r.height/3};
}

function launchBall(vx,vy){
  animating = true;
  const target = getJarCenter(jarWin);
  const ctrl = {x: ball.x + vx*2.6, y: Math.min(ball.y + vy*2.0, ball.y - 80)};
  const start = {x:ball.x,y:ball.y};
  const duration = 900 + Math.random()*450;
  const t0 = performance.now();
  const startRotate = 0; const endRotate = 5 + Math.random()*10;

  (function tick(now){
    const tt = Math.min(1,(now - t0)/duration);
    const t = 1 - Math.pow(1-tt, 3);
    const ix = (1-t)*(1-t)*start.x + 2*(1-t)*t*ctrl.x + t*t*target.x;
    const iy = (1-t)*(1-t)*start.y + 2*(1-t)*t*ctrl.y + t*t*target.y;
    ball.x = ix; ball.y = iy;
    draw();
    if (tt < 1) requestAnimationFrame(tick);
    else finishInJar();
  })(t0);
}

function finishInJar(){
  const dropStart = performance.now(); const dur = 700;
  const jarRect = jarWin.getBoundingClientRect();
  const aRect = arena.getBoundingClientRect();
  const targetY = jarRect.top - aRect.top + jarRect.height*0.46;
  const startY = ball.y;
  (function anim(now){
    const tt = Math.min(1,(now - dropStart)/dur);
    const t = tt<0.6? (tt/0.6) : 1;
    ball.y = startY + (targetY - startY) * t;
    draw();
    if (tt < 1) requestAnimationFrame(anim);
    else {
      overlay.classList.add('show');
      explodeConfetti();
      animating = false;
    }
  })(dropStart);
}

function explodeConfetti(){
  confetti.innerHTML = '';
  const count = 40;
  for(let i=0;i<count;i++){
    const el = document.createElement('div'); el.className='piece';
    el.style.left = (50 + Math.random()*40) + '%';
    el.style.top = (10 + Math.random()*20) + '%';
    el.style.background = randomColor();
    el.style.transform = `translate3d(0,0,0) rotate(${Math.random()*360}deg)`;
    confetti.appendChild(el);
    const dx = (Math.random()-0.5)*800; const dy = 400 + Math.random()*300; const rot = (Math.random()-0.5)*720;
    el.animate([
      {transform: `translateY(0px) rotate(0deg)`, opacity:1},
      {transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity:0}
    ], {duration:1200+Math.random()*1200, easing:'cubic-bezier(.2,.8,.2,1)'});
  }
}
function randomColor(){
  const colors = ['#ff6b6b','#f7b267','#ffd166','#4ecdc4','#6a4c93','#f72585','#06d6a0'];
  return colors[Math.floor(Math.random()*colors.length)];
}

overlay.addEventListener('click', ()=>{
  overlay.classList.remove('show');
  confetti.innerHTML = '';
  ball.x = slingPos.x + 28; ball.y = slingPos.y - 22; draw();
});