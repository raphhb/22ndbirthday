/*
Firework show + cake interaction + intro gift.
The neon greeting appears only AFTER the show ends.
*/

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (cb) { window.setTimeout(cb, 1000 / 60); };
})();

/* ---------------- Fireworks engine ---------------- */
var canvas = document.getElementById('canvas'),
    ctx    = canvas.getContext('2d'),
    cw     = window.innerWidth,
    ch     = window.innerHeight,
    fireworks = [],
    particles = [],
    hue = 120,
    limiterTotal = 5,
    limiterTick = 0,
    timerTotal = 80,
    timerTick = 0,
    mousedown = false,
    mx, my;

canvas.width = cw; canvas.height = ch;

function random(min, max){ return Math.random()*(max-min)+min; }
function calculateDistance(p1x,p1y,p2x,p2y){
  var x=p1x-p2x, y=p1y-p2y; return Math.sqrt(x*x+y*y);
}

function Firework(sx,sy,tx,ty){
  this.x=sx; this.y=sy; this.sx=sx; this.sy=sy; this.tx=tx; this.ty=ty;
  this.distanceToTarget = calculateDistance(sx,sy,tx,ty);
  this.distanceTraveled = 0;
  this.coordinates=[]; this.coordinateCount=3;
  while(this.coordinateCount--){ this.coordinates.push([this.x,this.y]); }
  this.angle=Math.atan2(ty-sy,tx-sx);
  this.speed=2; this.acceleration=1.05; this.brightness=random(50,70);
  this.targetRadius=1;
}
Firework.prototype.update=function(i){
  this.coordinates.pop(); this.coordinates.unshift([this.x,this.y]);
  this.targetRadius = (this.targetRadius < 8) ? this.targetRadius + 0.3 : 1;
  this.speed *= this.acceleration;
  var vx = Math.cos(this.angle)*this.speed,
      vy = Math.sin(this.angle)*this.speed;
  this.distanceTraveled = calculateDistance(this.sx,this.sy,this.x+vx,this.y+vy);
  if(this.distanceTraveled >= this.distanceToTarget){
    createParticles(this.tx,this.ty);
    fireworks.splice(i,1);
  }else{
    this.x += vx; this.y += vy;
  }
};
Firework.prototype.draw=function(){
  ctx.beginPath();
  ctx.moveTo(this.coordinates[this.coordinates.length-1][0], this.coordinates[this.coordinates.length-1][1]);
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle='hsl('+hue+',100%,'+this.brightness+'%)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI*2);
  ctx.stroke();
};

function Particle(x,y){
  this.x=x; this.y=y; this.coordinates=[]; this.coordinateCount=5;
  while(this.coordinateCount--){ this.coordinates.push([this.x,this.y]); }
  this.angle=random(0,Math.PI*2);
  this.speed=random(1,10);
  this.friction=0.95; this.gravity=1;
  this.hue=random(hue-20,hue+20);
  this.brightness=random(50,80);
  this.alpha=1; this.decay=random(0.015,0.03);
}
Particle.prototype.update=function(i){
  this.coordinates.pop(); this.coordinates.unshift([this.x,this.y]);
  this.speed*=this.friction;
  this.x+=Math.cos(this.angle)*this.speed;
  this.y+=Math.sin(this.angle)*this.speed+this.gravity;
  this.alpha-=this.decay;
  if(this.alpha<=this.decay) particles.splice(i,1);
};
Particle.prototype.draw=function(){
  ctx.beginPath();
  ctx.moveTo(this.coordinates[this.coordinates.length-1][0], this.coordinates[this.coordinates.length-1][1]);
  ctx.lineTo(this.x, this.y);
  ctx.strokeStyle='hsla('+this.hue+',100%,'+this.brightness+'%,'+this.alpha+')';
  ctx.stroke();
};

function createParticles(x,y){
  var c=30;
  while(c--) particles.push(new Particle(x,y));
}

/* ---------------- Show mode (timeline) ---------------- */
let showMode = false;
let scheduledTimers = [];

function schedule(delayMs, fn){
  const id = setTimeout(fn, delayMs);
  scheduledTimers.push(id);
  return id;
}
function clearSchedule(){
  scheduledTimers.forEach(clearTimeout);
  scheduledTimers = [];
}

/* Pattern helpers */
function volley(count, y){
  for(let i=0;i<count;i++){
    let x = ((i+1)/(count+1))*cw;
    fireworks.push(new Firework(cw/2, ch, x, y));
  }
}
function fan(centerX, y, count, spreadPx){
  const mid = (count-1)/2;
  for(let i=0;i<count;i++){
    let offset = (i - mid) * spreadPx;
    fireworks.push(new Firework(cw/2, ch, centerX + offset, y));
  }
}
function sweepRows(rows, countPerRow, yStart, yStep){
  for(let r=0;r<rows;r++){
    schedule(200*r, ()=>volley(countPerRow, yStart + r*yStep));
  }
}
function sparklingRain(columns, bursts, yTop, yJitter){
  for(let b=0;b<bursts;b++){
    schedule(140*b, ()=>{
      for(let i=0;i<columns;i++){
        let x = ((i+0.5)/columns)*cw + random(-20,20);
        let y = yTop + random(0,yJitter);
        fireworks.push(new Firework(cw/2, ch, x, y));
      }
    });
  }
}
function bigFinale(repeats){
  for(let r=0;r<repeats;r++){
    schedule(180*r, ()=>{
      for(let i=0;i<12;i++){
        let x = ((i+0.5)/12)*cw + random(-25,25);
        let y = ch*0.22 + random(-10,20);
        fireworks.push(new Firework(cw/2, ch, x, y));
      }
    });
  }
}

/* The actual show timeline (~14–15s) */
function runShowTimeline(){
  schedule(0,   ()=>fan(cw*0.5, ch*0.30, 9, 80));
  schedule(800, ()=>fan(cw*0.5, ch*0.24, 11, 75));
  schedule(1600, ()=>sweepRows(3, 9, ch*0.28, -ch*0.05));
  schedule(2800, ()=>{
    volley(7, ch*0.26);
    schedule(250, ()=>fan(cw*0.28, ch*0.22, 7, 60));
    schedule(500, ()=>fan(cw*0.72, ch*0.22, 7, 60));
  });
  schedule(4000, ()=>sparklingRain(8, 8, ch*0.25, 60));
  schedule(5200, ()=>{
    fan(cw*0.33, ch*0.24, 9, 60);
    fan(cw*0.66, ch*0.24, 9, 60);
  });
  schedule(6400, ()=>volley(10, ch*0.24));
  schedule(7200, ()=>volley(10, ch*0.22));
  schedule(8000, ()=>volley(12, ch*0.20));
  schedule(9000, ()=>sparklingRain(10, 10, ch*0.22, 50));
  schedule(11000, ()=>bigFinale(8));
  schedule(14500, stopShow); // end + reveal neon
}

function startShow(){
  if(showMode) return;
  showMode = true;
  clearSchedule();
  runShowTimeline();
}
function stopShow(){
  showMode = false;
  clearSchedule();

  // Reveal neon message AFTER the show
  const neon = document.getElementById('neonGreeting');
  if(neon){
    neon.classList.remove('neon-hidden');
    neon.classList.add('neon-show');
  }
}

/* ---------------- Main loop ---------------- */
function loop(){
  requestAnimFrame(loop);
  hue += 0.5;
  ctx.globalCompositeOperation='destination-out';
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.fillRect(0,0,cw,ch);
  ctx.globalCompositeOperation='lighter';

  let i=fireworks.length;
  while(i--){ fireworks[i].draw(); fireworks[i].update(i); }

  i=particles.length;
  while(i--){ particles[i].draw(); particles[i].update(i); }

  // Disable random auto-launches during show mode for clean choreography
  if(!showMode){
    if(timerTick>=timerTotal){
      if(!mousedown){
        fireworks.push(new Firework(cw/2, ch, random(0,cw), random(0,ch/2)));
        timerTick=0;
      }
    }else{ timerTick++; }

    if(limiterTick>=limiterTotal){
      if(mousedown){
        fireworks.push(new Firework(cw/2, ch, mx, my));
        limiterTick=0;
      }
    }else{ limiterTick++; }
  }
}
loop();

/* ---------------- Gift intro ---------------- */
window.onload=function(){
  var merrywrap=document.getElementById("merrywrap");
  var box=merrywrap.getElementsByClassName("giftbox")[0];
  var step=1;
  var stepMinutes=[2000,2000,1000,1000];

  function stepClass(s){ merrywrap.className='merrywrap step-'+s; }
  function openBox(){
    if(step===1){ box.removeEventListener("click",openBox,false); }
    stepClass(step);
    if(step===4){ reveal(); return; }
    setTimeout(openBox,stepMinutes[step-1]);
    step++;
  }
  box.addEventListener("click",openBox,false);
};

function reveal(){
  var wrap=document.querySelector('.merrywrap');
  wrap.style.backgroundColor='transparent';
  wrap.style.pointerEvents='none'; // allow clicking the cake

  // Autoplay video on billboard
  // Autoplay video on billboard
  var ifrm=document.createElement("iframe");
  ifrm.setAttribute("src","https://www.youtube.com/embed/A82FzberR3o?autoplay=1&loop=1&controls=0&playlist=A82FzberR3o");
  ifrm.style.border='none';
  document.querySelector('#video').appendChild(ifrm);
}

/* ---------------- Cake interactions ---------------- */
(function setupCake(){
  var cake=document.getElementById('cake');
  var msg=document.getElementById('cake-message');
  if(!cake||!msg) return;

  let openedOnce=false;

  function toggleMessage(show){ show ? msg.classList.add('show') : msg.classList.remove('show'); }

  function burstsAtCake(big){
    var rect=cake.getBoundingClientRect();
    var tx=rect.left + rect.width/2;
    var ty=rect.top  - 40;
    if(big){
      for(let b=0;b<5;b++){
        setTimeout(()=>{
          for(let k=0;k<6;k++){
            fireworks.push(new Firework(cw/2, ch, tx + random(-80,80), ty + random(-60,10)));
          }
        }, b*180);
      }
    }else{
      for(let k=0;k<3;k++){
        fireworks.push(new Firework(cw/2, ch, tx + random(-40,40), ty + random(-20,20)));
      }
    }
  }

  cake.addEventListener('click', function(){
    cake.classList.add('popped');
    setTimeout(()=>cake.classList.remove('popped'), 650);

    const showing = !msg.classList.contains('show');
    toggleMessage(showing);

    if(!openedOnce){
      burstsAtCake(true);   // big local burst
      startShow();          // start choreographed show
      openedOnce=true;
    }else{
      burstsAtCake(false);  // small bursts afterwards
    }
  });

  cake.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); cake.click(); }
  });
})();

/* ---------------- Mouse controls ---------------- */
canvas.addEventListener('mousemove', function(e){ mx = e.pageX - canvas.offsetLeft; my = e.pageY - canvas.offsetTop; });
canvas.addEventListener('mousedown', function(e){ e.preventDefault(); mousedown = true; });
canvas.addEventListener('mouseup',   function(e){ e.preventDefault(); mousedown = false; });

window.addEventListener('resize', function(){
  cw = window.innerWidth; ch = window.innerHeight;
  canvas.width = cw; canvas.height = ch;
});


