// Memory game logic
(function(){
  // themed emoji sets — pick one theme per game to make the background match
  const THEMES = {
    animals: {
      name: 'Animals',
      emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🦁','🐵','🐸','🐙','🦄','🐝','🦉','🐯'],
      accent: ['#7ee787','#66d1ff','#ffd86b']
    },
    fruits: {
      name: 'Fruits',
      emojis: ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍','🥭','🍐','🥝','🍋','🍊','🍈','🍏','🍅'],
      accent: ['#ffb86b','#ffd86b','#ff7aa2']
    },
    sweets: {
      name: 'Sweets',
      emojis: ['🍰','🍩','🍪','🧁','🍫','🍬','🍭','🥧','🍮','🍯','🍨','🍧','🍡','🍦','🧋','🥠'],
      accent: ['#ffb3d6','#ffd3a5','#ffe799']
    },
    sea: {
      name: 'Sea',
      emojis: ['🐬','🐟','🐠','🦀','🦞','🦑','🐚','🦐','🐳','🐋','🐙','🦈','🪸','🪼','🌊','🛥️'],
      accent: ['#66d1ff','#7ee787','#9be6ff']
    }
  };
  // flattened fallback (if needed)
  const EMOJIS = Array.from(new Set(Object.values(THEMES).flatMap(t=>t.emojis)));

  const boardEl = document.getElementById('board');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const matchesEl = document.getElementById('matches');
  const overlay = document.getElementById('overlay');
  const resultTitle = document.getElementById('resultTitle');
  const finalScore = document.getElementById('finalScore');
  const playAgain = document.getElementById('playAgain');
  const restartBtn = document.getElementById('restartBtn');
  const timeSelect = document.getElementById('timeSelect');
  const muteBtn = document.getElementById('muteBtn');

  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let matches = 0;
  let score = 0;
  let pairs = 8; // default pairs (16 cards)
  let remainingTime = parseInt(timeSelect.value,10);
  let timerId = null;
  let currentThemeKey = null;
  let themeEmojiEl = null;
  // audio / music state
  let audioCtx = null;
  let musicGain = null;
  let musicLoopId = null;
  let isMuted = localStorage.getItem('memgame_muted') === '1';
  let musicStarted = false;

  function formatTime(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function shuffle(array){
    for(let i=array.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
  }

  function buildBoard(){
    boardEl.innerHTML='';
    // choose theme each game (random)
    const themeKeys = Object.keys(THEMES);
    currentThemeKey = themeKeys[Math.floor(Math.random()*themeKeys.length)];
    const theme = THEMES[currentThemeKey];
    // choose representative emoji for background decoration
    placeThemeEmoji(theme.emojis[Math.floor(Math.random()*theme.emojis.length)]);

    const selected = shuffle(theme.emojis.slice()).slice(0,pairs);
    const items = shuffle([...selected, ...selected]);
    items.forEach((emoji, idx)=>{
      const card = document.createElement('button');
      card.className='card';
      card.setAttribute('aria-label','Hidden card');
      card.dataset.emoji = emoji;
      card.dataset.index = idx;

      const inner = document.createElement('div');
      inner.className='card-inner';

      const front = document.createElement('div');
      front.className='card-face card-front';
      front.textContent='❓';

      const back = document.createElement('div');
      back.className='card-face card-back';
      back.textContent=emoji;

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);

      card.addEventListener('click', onCardClick);
      boardEl.appendChild(card);
    });
  }

  function placeThemeEmoji(symbol){
    // remove existing
    if(themeEmojiEl){ themeEmojiEl.remove(); themeEmojiEl = null; }
    themeEmojiEl = document.createElement('div');
    themeEmojiEl.className = 'theme-emoji-decor';
    themeEmojiEl.setAttribute('aria-hidden','true');
    themeEmojiEl.textContent = symbol;
    document.body.appendChild(themeEmojiEl);
    // also add a body class for theme-specific CSS
    document.body.classList.remove(...Object.keys(THEMES).map(k=>`theme-${k}`));
    document.body.classList.add(`theme-${currentThemeKey}`);
  }

  function onCardClick(e){
    // ensure music/audio is allowed to start after a user gesture
    ensureMusicStartedOnInteraction();
    if(lockBoard) return;
    const btn = e.currentTarget;
    if(btn === firstCard || btn.classList.contains('matched')) return;

    btn.classList.add('flipped');
    if(!firstCard){
      firstCard = btn;
      return;
    }
    secondCard = btn;
    lockBoard = true;
    checkForMatch();
  }

  function checkForMatch(){
    const a = firstCard.dataset.emoji;
    const b = secondCard.dataset.emoji;
    // Let the player see the second card first, then animate, then act.
    const revealDelay = 420; // ms to show second card before animation
    setTimeout(()=>{
      if(a === b){
        // match: play celebration animation, keep revealed
        firstCard.classList.add('matched','celebrate');
        secondCard.classList.add('matched','celebrate');
        // remove celebrate class after the animation so future matches animate too
        setTimeout(()=>{
          firstCard.classList.remove('celebrate');
          secondCard.classList.remove('celebrate');
        }, 900);
        matches++;
        score += 10;
        updateStatus();
        resetTurn();
        if(matches === pairs) win();
      } else {
        // not a match: show a shake/move animation then cover back
        firstCard.classList.add('shake');
        secondCard.classList.add('shake');
        // small penalty and update immediately so player sees score change
        score = Math.max(0, score - 1);
        updateStatus();
        setTimeout(()=>{
          firstCard.classList.remove('shake');
          secondCard.classList.remove('shake');
          firstCard.classList.remove('flipped');
          secondCard.classList.remove('flipped');
          resetTurn();
          playBeep();
        }, 700);
      }
    }, revealDelay);
  }

  function resetTurn(){
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
  }

  function updateStatus(){
    scoreEl.textContent = score;
    matchesEl.textContent = `${matches} / ${pairs}`;
  }

  function startTimer(){
    stopTimer();
    remainingTime = parseInt(timeSelect.value,10);
    timerEl.textContent = formatTime(remainingTime);
    timerId = setInterval(()=>{
      remainingTime--;
      timerEl.textContent = formatTime(remainingTime);
      if(remainingTime<=0){
        stopTimer();
        gameOver();
      }
    },1000);
  }

  function stopTimer(){
    if(timerId) clearInterval(timerId);
    timerId = null;
  }

  function gameOver(){
    resultTitle.textContent = 'Time\'s up!';
    finalScore.textContent = score;
    overlay.classList.remove('hidden');
    // decorative class for game-over (calm but pleasant)
    document.body.classList.remove('victory');
    clearVictoryDecor();
    document.body.classList.add('defeat');
    playSadTone();
  }

  function win(){
    stopTimer();
    resultTitle.textContent = 'Victory!';
    finalScore.textContent = score;
    overlay.classList.remove('hidden');
    // decorate body for victory (bright, happy background)
    document.body.classList.remove('defeat');
    document.body.classList.add('victory');
    playFanfare();
    launchConfetti();
    // additional victory sparkles
    createSparkles(18);
  }

  function restart(){
    overlay.classList.add('hidden');
    matches = 0; score = 0; updateStatus();
    buildBoard();
    // ensure audio allowed and start music if unmuted
    ensureMusicStartedOnInteraction();
    startTimer();
    // clear victory/defeat decorations
    document.body.classList.remove('victory');
    document.body.classList.remove('defeat');
    // ensure theme emoji is placed (buildBoard handles but ensure not left stale)
    if(!themeEmojiEl) placeThemeEmoji(THEMES[currentThemeKey].emojis[0]);
    clearVictoryDecor();
  }

  function clearVictoryDecor(){
    // remove any sparkles created for victory
    const existing = document.querySelectorAll('.victory-sparkle');
    existing.forEach(el=>el.remove());
  }

  function createSparkles(count){
    if(!document.body.classList.contains('victory')) return;
    const w = Math.max(window.innerWidth || 800, 800);
    const h = Math.max(window.innerHeight || 600, 600);
    for(let i=0;i<count;i++){
      const s = document.createElement('div');
      s.className = 'sparkle victory-sparkle';
      const size = Math.floor(Math.random()*10)+6;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${Math.random()*100}%`;
      s.style.top = `${60 + Math.random()*30}%`;
      s.style.opacity = String(0.7 + Math.random()*0.4);
      // stagger animation
      s.style.animationDelay = `${Math.random()*1200}ms`;
      document.body.appendChild(s);
      // remove after complete
      setTimeout(()=>{ s.remove(); }, 4200 + Math.random()*800);
    }
  }

  // simple WebAudio beep for mismatch
  function playBeep(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type='sine'; o.frequency.value=220;
      g.gain.value=0.08;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(()=>{o.stop();ctx.close();},150);
    }catch(e){}
  }

  function playSadTone(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type='sine'; o.frequency.value=160;
      g.gain.value=0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      const t = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.001,t+1.1);
      setTimeout(()=>{o.stop();ctx.close();},1100);
    }catch(e){}
  }

  // short fanfare sequence
  function playFanfare(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const notes = [880,1046,1318,1760];
      let t = ctx.currentTime;
      notes.forEach((f,i)=>{
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type='sawtooth'; o.frequency.value = f;
        g.gain.value = 0.06;
        o.connect(g); g.connect(ctx.destination);
        o.start(t + i*0.12);
        g.gain.exponentialRampToValueAtTime(0.0001,t + i*0.12 + 0.18);
        o.stop(t + i*0.12 + 0.2);
      });
      setTimeout(()=>{ctx.close();},1000);
    }catch(e){}
  }

  // confetti: create colored divs that fall
  function launchConfetti(){
    const colors = ['#ff4d6d','#ffb86b','#ffd86b','#7ee787','#66d1ff','#b48aff'];
    const count = 36;
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className='confetti-piece';
      const size = Math.random()*10+6;
      el.style.width = `${size}px`;
      el.style.height = `${size*0.6}px`;
      el.style.left = Math.random()*100+'%';
      el.style.top = '-10px';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.transform = `rotate(${Math.random()*360}deg)`;
      document.body.appendChild(el);
      const falling = el.animate([
        {transform:el.style.transform, opacity:1, top:'-10px'},
        {transform:`rotate(${Math.random()*720}deg) translateY(90vh)`, opacity:0.9, top:'90vh'}
      ],{duration:2000+Math.random()*1600,easing:'cubic-bezier(.2,.8,.2,1)'});
      falling.onfinish = ()=>el.remove();
    }
  }

  // ----- Background music (simple loop using WebAudio) -----
  function ensureAudioContext(){
    if(audioCtx) return;
    try{
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = isMuted ? 0 : 0.05;
      musicGain.connect(audioCtx.destination);
    }catch(e){
      audioCtx = null;
    }
  }

  function playNote(freq, when, duration=0.18, type='sine', gain=0.06){
    if(!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(musicGain);
    o.start(when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    o.stop(when + duration + 0.02);
  }

  function startMusicLoop(){
    if(musicLoopId || !audioCtx) return;
    musicStarted = true;
    // simple 2s loop arpeggio
    const loop = ()=>{
      const now = audioCtx.currentTime + 0.05;
      const notes = [330,440,523,660];
      notes.forEach((n,i)=> playNote(n, now + i*0.18, 0.16, 'sine', 0.04));
      // soft pad note
      playNote(220, now, 1.8, 'triangle', 0.02);
    };
    loop();
    musicLoopId = setInterval(loop, 2000);
  }

  function stopMusicLoop(){
    if(musicLoopId){ clearInterval(musicLoopId); musicLoopId = null; }
    musicStarted = false;
  }

  function ensureMusicStartedOnInteraction(){
    // resume AudioContext and start loop on first user gesture
    if(!audioCtx) ensureAudioContext();
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended'){
      audioCtx.resume().catch(()=>{});
    }
    if(!musicStarted && !isMuted) startMusicLoop();
  }

  function setMuted(m){
    isMuted = !!m;
    localStorage.setItem('memgame_muted', isMuted ? '1' : '0');
    if(musicGain) musicGain.gain.value = isMuted ? 0 : 0.05;
    muteBtn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    muteBtn.textContent = isMuted ? '🔈' : '🔊';
    if(isMuted){ stopMusicLoop(); } else { if(audioCtx) startMusicLoop(); }
  }

  // wire mute button
  muteBtn.addEventListener('click', ()=>{
    ensureAudioContext();
    ensureMusicStartedOnInteraction();
    setMuted(!isMuted);
  });


  // wire controls
  restartBtn.addEventListener('click', ()=>{restart();});
  playAgain.addEventListener('click', ()=>{restart();});
  timeSelect.addEventListener('change', ()=>{startTimer();});

  // init
  function init(){
    buildBoard();
    updateStatus();
    startTimer();
  }

  init();

})();
