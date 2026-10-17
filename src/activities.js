const readData = async name => {
  const response = await fetch(new URL(`../story/${name}.json`, import.meta.url));
  if (!response.ok) throw new Error(`Không tải được dữ liệu ${name}.`);
  return response.json();
};
export const CHAPTERS = await readData('chapters');
const [DIALOGUES, QUESTS] = await Promise.all([readData('dialogues'), readData('quests')]);
const PEOPLE = [
  { id: 'female', name: 'Em', label: 'Nhân vật nữ', symbol: '✿' },
  { id: 'male', name: 'Anh', label: 'Nhân vật nam', symbol: '☘' },
  { id: 'niece1', name: 'Cháu 1', label: 'Cháu thứ nhất', symbol: '🌷' },
  { id: 'niece2', name: 'Cháu 2', label: 'Cháu thứ hai', symbol: '🌼' },
  { id: 'brother', name: 'Em trai', label: 'Em trai 8 tuổi', symbol: '🌱' },
];
const MEMORY_SYMBOLS = ['💐', '💌', '📷', '♡', '✉'];
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const button = (text, attrs = '', style = '') => `<button ${attrs.includes('type=') ? '' : 'type="button"'} class="activity-button ${style}" ${attrs}>${text}</button>`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

/** Tiny original pixel sprites are shared by the boards and the exported photograph. */
function person(ctx, x, y, id = 'female', scale = 2, walk = 0) {
  const child = !['female', 'male'].includes(id);
  const female = id === 'female';
  const s = scale * (child ? .79 : 1);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(s, s);
  ctx.fillStyle = '#26362a35'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
  const p = (color, a, b, w, h) => { ctx.fillStyle = color; ctx.fillRect(a, b, w, h); };
  const stride = Math.sin(walk) * 2;
  p('#372d2d', -8, -37, 16, female ? 30 : 16); p('#372d2d', -6, -40, 12, 4);
  p('#f4cda9', -7, -32, 14, 11); p('#f4cda9', -4, -23, 8, 5);
  p(female ? '#f8efd3' : id === 'male' ? '#90a887' : id === 'niece1' ? '#d598a9' : id === 'niece2' ? '#debd6d' : '#8ab7bb', -8, -20, 16, 12);
  p('#f3ccac', -11, -19, 3, 10); p('#f3ccac', 8, -19, 3, 10);
  p(female ? '#e2c9ac' : '#3b3e3d', -7, -8, 14, 5);
  p(female ? '#f3ccac' : '#3b3e3d', -6, -3 + stride, 4, 4); p(female ? '#f3ccac' : '#3b3e3d', 2, -3 - stride, 4, 4);
  p(female ? '#eee8d5' : '#353333', -8, 0 + stride, 7, 3); p(female ? '#eee8d5' : '#353333', 1, 0 - stride, 7, 3);
  p('#312d30', -7, -35, 14, 4); p('#312d30', -9, -33, 3, 6); p('#312d30', 5, -34, 4, 4);
  p('#302f30', -4, -28, 2, 2); p('#302f30', 3, -28, 2, 2); p('#c67d7d', -1, -24, 3, 1);
  if (female) {
    ctx.strokeStyle = '#695548'; ctx.lineWidth = .9;
    ctx.strokeRect(-7, -30, 6, 5); ctx.strokeRect(1, -30, 6, 5); ctx.beginPath(); ctx.moveTo(-1, -28); ctx.lineTo(1, -28); ctx.stroke();
    p('#f3dfb8', -10, -34, 4, 4); p('#da9bae', -9, -33, 2, 2);
  }
  ctx.restore();
}

function landscape(ctx, phase = 'day', t = 0) {
  const night = phase === 'night';
  const sky = ctx.createLinearGradient(0, 0, 0, 270);
  sky.addColorStop(0, night ? '#28334f' : '#c8e5db'); sky.addColorStop(1, night ? '#7e7694' : '#faf0d9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, 270);
  if (night) {
    ctx.fillStyle = '#fff2cf'; ctx.beginPath(); ctx.arc(550, 43, 19, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 32; i++) ctx.fillRect((i * 89 + 19) % 640, (i * 43 + 13) % 105, 2, 2);
  } else {
    ctx.fillStyle = '#fff6cd'; ctx.beginPath(); ctx.arc(545, 40, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf0aa';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse((i * 190 + t * .003) % 740 - 40, 40 + i % 2 * 25, 45, 8, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = night ? '#3b4661' : '#a6bdb0'; ctx.beginPath(); ctx.moveTo(0, 130); ctx.lineTo(85, 45); ctx.lineTo(178, 124); ctx.lineTo(280, 61); ctx.lineTo(399, 132); ctx.lineTo(475, 81); ctx.lineTo(640, 135); ctx.lineTo(640, 270); ctx.lineTo(0, 270); ctx.fill();
  ctx.fillStyle = night ? '#3c4d4c' : '#91ae83'; ctx.fillRect(0, 123, 640, 147);
  for (let i = 0; i < 17; i++) {
    const x = (i * 83 + 5) % 640, y = 125 + (i % 3) * 9;
    ctx.fillStyle = night ? '#304b46' : '#648f76'; ctx.fillRect(x - 12, y - 13, 25, 22); ctx.fillRect(x - 8, y - 20, 17, 10);
    ctx.fillStyle = night ? '#705b5d' : '#d6b1a4'; ctx.fillRect(x - 3, y, 6, 15);
  }
}

export class ActivityRunner {
  constructor({ container, onComplete = () => {}, onProgress = () => {}, onClose = () => {}, onSound = () => {} }) {
    this.container = container; this.onComplete = onComplete; this.onProgress = onProgress; this.onClose = onClose; this.onSound = onSound;
    this.cleanups = [];
  }
  open(chapterId, startStep = 0) {
    this.close(); this.chapter = CHAPTERS.find(c => c.id === chapterId) || CHAPTERS[0];
    const requestedStep = Number(startStep);
    this.step = Math.min(Math.max(Number.isFinite(requestedStep) ? Math.trunc(requestedStep) : 0, 0), this.chapter.steps.length);
    if (this.step === 0) this._dialogue(this.chapter.intro, () => this._render(), true);
    else if (this.step >= this.chapter.steps.length) this._outro();
    else this._render();
  }
  close() {
    this._cleanup(); if (this.container) this.container.replaceChildren();
  }
  _cleanup() { this.generation = (this.generation || 0) + 1; this.cleanups.splice(0).forEach(fn => fn()); }
  _listen(node, name, handler, opts) { if (!node) return; node.addEventListener(name, handler, opts); this.cleanups.push(() => node.removeEventListener(name, handler, opts)); }
  _q(selector) { return this.container.querySelector(selector); }
  _all(selector) { return [...this.container.querySelectorAll(selector)]; }
  _shell(body, hasNext = true) {
    this._cleanup(); this.complete = false;
    this.container.innerHTML = `<section class="activity-shell" aria-label="${esc(this.chapter.title)}" style="--activity-accent:${this.chapter.accent}">
      <header class="activity-header"><div><span class="activity-kicker">${esc(this.chapter.short)}</span><h2>${esc(this.chapter.title)}</h2></div><button class="activity-close" type="button" aria-label="Quay lại khu vườn">×</button></header>
      <div class="activity-steps" aria-label="Tiến trình chương">${this.chapter.steps.map((s, i) => `<span class="${i < this.step ? 'is-done' : i === this.step ? 'is-current' : ''}">${i < this.step ? '✓' : i + 1}<span>${esc(s)}</span></span>`).join('')}</div>
      <div class="activity-body">${body}</div>
      ${hasNext ? `<footer class="activity-footer"><p class="activity-feedback" role="status" aria-live="polite">Mỗi bước nhỏ đều được giữ lại khi bạn hoàn thành.</p><button type="button" class="activity-button primary activity-next" disabled>Tiếp tục <span aria-hidden="true">→</span></button></footer>` : ''}
    </section>`;
    this._listen(this._q('.activity-close'), 'click', () => this.onClose());
    this._q('.activity-close').focus({ preventScroll: true });
    if (hasNext) this._listen(this._q('.activity-next'), 'click', () => {
      if (!this.complete) return;
      this.step++; this.onProgress({ chapter: this.chapter.id, step: this.step }); this.onSound('success');
      if (this.step >= this.chapter.steps.length) this._outro(); else this._render();
    });
  }
  _feedback(text) { const node = this._q('.activity-feedback'); if (node) node.textContent = text; }
  _done(message = 'Đã hoàn thành. Mình cùng đi tiếp nhé.') {
    if (this.complete) return; this.complete = true; this.onSound('collect');
    const next = this._q('.activity-next'); if (next) next.disabled = false;
    this._feedback(message);
  }
  _copy(title, text, note = '') { return `<div class="activity-copy"><h3>${title}</h3><p>${text}</p>${note ? `<small class="activity-note">${note}</small>` : ''}</div>`; }
  _dialogue(lines, finish, intro = false) {
    let index = 0, timer, full = '', typed = false;
    this._shell(`<div class="activity-intro"><div class="activity-dialogue-cast"><span class="activity-portrait female" role="img" aria-label="Chân dung nhân vật nữ, tóc đen và kính tròn"></span><span class="activity-portrait male" role="img" aria-label="Chân dung nhân vật nam, tóc đen và áo xanh sage"></span><span class="activity-cast-symbol" aria-hidden="true">${MEMORY_SYMBOLS[this.chapter.id]}</span></div><p class="activity-kicker">${intro ? esc(this.chapter.subtitle) : 'Một trang đã được giữ lại'}</p><blockquote class="activity-dialogue-text"></blockquote><p class="activity-dialogue-speaker"></p><small class="activity-note activity-dialogue-note"></small>${button('Đọc tiếp →', 'data-dialogue-next', 'primary')}</div>`, false);
    const advance = this._q('[data-dialogue-next]');
    if(!intro && [0,4].includes(this.chapter.id)){
      const canvas=document.createElement('canvas');canvas.width=640;canvas.height=150;canvas.className='activity-outro-scene';canvas.ariaLabel=this.chapter.id===0?'Hai người đối diện nhau và trao bó hoa':'Hai người cùng mở món quà';
      this._q('.activity-intro').prepend(canvas);
      const ctx=canvas.getContext('2d'),start=performance.now();let frame;
      const draw=now=>{const t=Math.min(1,(now-start)/1800);ctx.clearRect(0,0,640,150);ctx.fillStyle='#e7ecdc';ctx.fillRect(0,130,640,20);person(ctx,245+t*30,136,'male',2.2,t<1?now/150:0);person(ctx,395-t*30,136,'female',2.2,t<1?now/150:0);ctx.font='32px serif';ctx.textAlign='center';ctx.fillText(this.chapter.id===0?'💐':'🎁',285+t*35,110-Math.sin(t*Math.PI)*12);if(t===1){ctx.fillStyle='#b97788';ctx.font='22px serif';ctx.fillText('♡',320,44);}frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);this.cleanups.push(()=>cancelAnimationFrame(frame));
    }
    const show = () => {
      const line = lines[index]; full = line.text; typed = false;
      if(line.editable&&this.chapter.id===0)full=DIALOGUES.personal.confession.text||full;
      const expressions=['happy','sad','surprised','shy','upset','joyful'];
      const expression=Math.max(0,expressions.indexOf(line.expression||(this.chapter.id===3&&intro?'sad':!intro?'joyful':'happy')));
      this._all('.activity-portrait').forEach(el=>el.style.setProperty('--portrait-x',`${expression*20}%`));
      this._q('.activity-dialogue-text').textContent = '';
      this._q('.activity-dialogue-speaker').textContent = line.speaker;
      this._q('.activity-dialogue-note').textContent = line.editable ? 'Nội dung riêng đang chờ hai người bổ sung.' : '';
      let n = 0; timer = setInterval(() => {
        n += 2; this._q('.activity-dialogue-text').textContent = full.slice(0, n);
        if (n >= full.length) { clearInterval(timer); typed = true; }
      }, 18);
      advance.textContent = index === lines.length - 1 ? intro ? 'Bắt đầu kỷ niệm →' : 'Cất vào album ♡' : 'Đọc tiếp →';
    };
    this.cleanups.push(() => clearInterval(timer));
    this._listen(advance, 'click', () => {
      if (!typed) { clearInterval(timer); this._q('.activity-dialogue-text').textContent = full; typed = true; return; }
      if (++index < lines.length) show(); else finish();
    }); show();
  }
  _outro() { this._dialogue(this.chapter.outro, () => this.onComplete(this.chapter.id), false); }
  _render() {
    const methods = [['_nightDrive', '_bouquet'], ['_route', '_phone', '_pickup'], ['_tickets', '_food', '_photo'], ['_feelings', '_message', '_reconcile'], ['_memories', '_gift']];
    this[methods[this.chapter.id][this.step]]();
  }
  _canvas(title) { return `<canvas class="activity-canvas" width="640" height="270" tabindex="0" aria-label="${esc(title)}"></canvas>`; }
  _directions() { return `<div class="activity-dpad" aria-label="Điều khiển di chuyển">${button('↑', 'data-move="up" aria-label="Đi lên"')}${button('←', 'data-move="left" aria-label="Đi sang trái"')}${button('↓', 'data-move="down" aria-label="Đi xuống"')}${button('→', 'data-move="right" aria-label="Đi sang phải"')}<small>Phím mũi tên / WASD · hoặc chạm vào cảnh</small></div>`; }
  _movement({ start, draw, tick, bounds = [25, 615, 90, 240], speed = 90 }) {
    const canvas = this._q('canvas'), ctx = canvas.getContext('2d');
    const pos = { ...start }; const keys = new Set(); let target = null, frame, last = performance.now();
    const mapped = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
    this._listen(document, 'keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; const key = mapped[e.key]; if (key) { e.preventDefault(); keys.add(key); target = null; } });
    this._listen(document, 'keyup', e => keys.delete(mapped[e.key]));
    this._listen(window, 'blur', () => keys.clear());
    this._all('[data-move]').forEach(el => {
      this._listen(el, 'pointerdown', e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); keys.add(el.dataset.move); target = null; });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => this._listen(el, event, () => keys.delete(el.dataset.move)));
      this._listen(el, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); keys.add(el.dataset.move); } });
      this._listen(el, 'keyup', () => keys.delete(el.dataset.move));
    });
    this._listen(canvas, 'pointerdown', e => { const r = canvas.getBoundingClientRect(); target = { x: (e.clientX - r.left) * 640 / r.width, y: (e.clientY - r.top) * 270 / r.height }; });
    const loop = now => {
      const dt = Math.min((now - last) / 1000, .04); last = now;
      let dx = Number(keys.has('right')) - Number(keys.has('left')), dy = Number(keys.has('down')) - Number(keys.has('up'));
      if (target && !dx && !dy) { const d = distance(pos, target); if (d > 3) { dx = (target.x - pos.x) / d; dy = (target.y - pos.y) / d; } else target = null; }
      const mag = Math.max(1, Math.hypot(dx, dy)); pos.x = Math.max(bounds[0], Math.min(bounds[1], pos.x + dx / mag * speed * dt)); pos.y = Math.max(bounds[2], Math.min(bounds[3], pos.y + dy / mag * speed * dt));
      tick?.(pos); draw(ctx, pos, now, Boolean(dx || dy)); frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop); this.cleanups.push(() => cancelAnimationFrame(frame)); return pos;
  }
  _nightDrive() {
    this._shell(this._copy('Một chuyến đi thật chậm', 'Đi qua ba đốm sáng trên đường rồi dừng xe ở điểm P. Không có đồng hồ đếm ngược; cứ đi theo nhịp của bạn.') + this._canvas('Chuyến xe đêm. Điều khiển xe đến ba điểm sáng rồi đến bãi đỗ P.') + this._directions());
    const points = [{ x: 150, y: 184 }, { x: 315, y: 145 }, { x: 480, y: 183 }], found = new Set();
    this._movement({ start: { x: 42, y: 184 }, bounds: [25, 615, 120, 222], speed: 93,
      tick: pos => {
        points.forEach((p, i) => { if (!found.has(i) && distance(pos, p) < 27) { found.add(i); this.onSound('collect'); this._feedback(`Đã đi qua ${found.size}/3 ánh đèn. ${found.size === 3 ? 'Đỗ xe tại điểm P nhé.' : 'Đi theo đốm sáng tiếp theo.'}`); } });
        if (found.size === 3 && distance(pos, { x: 590, y: 167 }) < 25) this._done('Xe đã dừng an toàn. Bó hoa đang chờ được khám phá.');
      },
      draw: (ctx, pos, now, moving) => {
        landscape(ctx, 'night', now);
        ctx.strokeStyle = '#a3a0b0'; ctx.lineWidth = 84; ctx.beginPath(); ctx.moveTo(-30, 184); ctx.bezierCurveTo(180, 220, 200, 100, 340, 151); ctx.bezierCurveTo(490, 210, 500, 171, 680, 167); ctx.stroke();
        ctx.strokeStyle = '#f8eab65c'; ctx.lineWidth = 2; ctx.setLineDash([12, 15]); ctx.stroke(); ctx.setLineDash([]);
        points.forEach((p, i) => {
          ctx.fillStyle = '#e8c9a6'; ctx.fillRect(p.x - 2, p.y - 72, 4, 40);
          ctx.fillStyle = '#ffe9ad35'; ctx.beginPath(); ctx.arc(p.x, p.y - 71, 28, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffe9ad'; ctx.fillRect(p.x - 6, p.y - 77, 12, 8);
          ctx.strokeStyle = found.has(i) ? '#b5dfb8' : '#ffdf9c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 18 + Math.sin(now / 400) * 2, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fff8da'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(found.has(i) ? '✓' : i + 1, p.x, p.y + 6);
        });
        ctx.fillStyle = '#e9e2d2'; ctx.fillRect(570, 133, 40, 50); ctx.fillStyle = '#5a6377'; ctx.font = 'bold 25px sans-serif'; ctx.fillText('P', 590, 166);
        ctx.fillStyle = '#ffe7a32b'; ctx.beginPath(); ctx.moveTo(pos.x + 15, pos.y - 6); ctx.lineTo(pos.x + 85, pos.y - 30); ctx.lineTo(pos.x + 85, pos.y + 22); ctx.fill();
        ctx.fillStyle = '#272d41'; ctx.fillRect(pos.x - 17, pos.y - 11, 35, 20); ctx.fillStyle = '#b7c7ae'; ctx.fillRect(pos.x - 20, pos.y - 9, 40, 16); ctx.fillStyle = '#e5d7c0'; ctx.fillRect(pos.x - 7, pos.y - 7, 14, 12); ctx.fillStyle = '#f0d0c4'; ctx.fillRect(pos.x - 5, pos.y - 5, 4, 4); ctx.fillRect(pos.x - 5, pos.y + 1, 4, 4);
        ctx.fillStyle = '#f7d3bd'; ctx.fillRect(pos.x + 16, pos.y - 7, 4, 4); ctx.fillRect(pos.x + 16, pos.y + 3, 4, 4);
      }
    });
  }
  _bouquet() {
    const flowers = ['🌷', '🌼', '🌸', '🌹', '✿'], colors = ['#d993a8', '#e4bd5f', '#e3aec3', '#c57c7c', '#a6b0d3'];
    this._shell(this._copy('Ghép lại bó hoa đầu tiên', 'Chọn một bông hoa bên dưới, rồi đặt vào dấu hoa giống nó. Đủ năm bông, bó hoa sẽ được buộc lại.') + `<div class="activity-puzzle"><div class="activity-bouquet-slots">${flowers.map((f, i) => `<button class="activity-flower-slot" type="button" data-flower-slot="${i}" aria-label="Vị trí hoa ${i + 1}: ${f}" style="--flower-color:${colors[i]}"><span class="activity-flower">${f}</span></button>`).join('')}</div><div class="activity-bouquet-stems" aria-hidden="true">╲│╱<br>🎀</div><div class="activity-tray">${[2, 0, 4, 1, 3].map(i => button(`<span class="activity-flower">${flowers[i]}</span>`, `data-flower="${i}" aria-label="Chọn hoa ${i + 1}: ${flowers[i]}"`, 'activity-chip')).join('')}</div></div>`);
    let selected = null; const placed = new Set();
    this._all('[data-flower]').forEach(el => this._listen(el, 'click', () => { selected = Number(el.dataset.flower); this._all('[data-flower]').forEach(n => n.classList.toggle('is-selected', n === el)); this._feedback('Chọn dấu hoa phù hợp trong bó hoa.'); }));
    this._all('[data-flower-slot]').forEach(el => this._listen(el, 'click', () => {
      if (selected === null) return this._feedback('Chọn một bông hoa trong khay trước nhé.');
      const slot = Number(el.dataset.flowerSlot); if (placed.has(slot)) return;
      if (slot !== selected) return this._feedback('Bông hoa này đang chờ một dấu hoa giống nó. Thử lại nhé.');
      placed.add(slot); el.classList.add('is-done'); el.disabled = true; this._q(`[data-flower="${selected}"]`).disabled = true; selected = null; this.onSound('collect');
      if (placed.size === 5) this._done('Bó hoa đã sẵn sàng. Mở trang lời tỏ tình nhé.'); else this._feedback(`Bó hoa có ${placed.size}/5 bông rồi.`);
    }));
  }
  _route() {
    const blocked = new Set(['0,0', '1,0', '2,0', '0,1', '2,1', '0,2', '4,2', '3,3', '4,3', '2,4', '3,4', '4,4']);
    this._shell(this._copy('Nối một lối đi buổi sáng', 'Chạm các ô đường liền kề từ ngôi nhà đến nơi làm việc, đi qua ngôi sao. Chạm ô trước đó để quay lại.', 'Bản đồ minh họa; địa điểm thật có thể bổ sung trong dữ liệu.') + `<div class="activity-route-grid">${Array.from({ length: 25 }, (_, i) => { const x = i % 5, y = Math.floor(i / 5), key = `${x},${y}`; return `<button type="button" class="activity-route-cell ${blocked.has(key) ? 'is-blocked' : ''}" data-cell="${key}" ${blocked.has(key) ? 'disabled' : ''} aria-label="${x === 0 && y === 4 ? 'Điểm xuất phát' : x === 4 && y === 0 ? 'Nơi làm việc' : x === 2 && y === 2 ? 'Điểm hẹn ngôi sao' : `Ô đường ${x + 1}, ${y + 1}`}">${blocked.has(key) ? (i % 2 ? '🌳' : '🌸') : key === '0,4' ? '⌂' : key === '4,0' ? '▥' : key === '2,2' ? '☆' : '·'}</button>`; }).join('')}</div><div class="activity-tray">${button('Vẽ lại đường', 'data-route-reset', 'secondary')}</div>`);
    let path = ['0,4'];
    const paint = () => this._all('[data-cell]').forEach(el => { el.classList.toggle('is-path', path.includes(el.dataset.cell)); el.classList.toggle('is-current', el.dataset.cell === path.at(-1)); });
    this._all('[data-cell]').forEach(el => this._listen(el, 'click', () => {
      if (this.complete) return; const key = el.dataset.cell;
      if (path.length > 1 && key === path.at(-2)) { path.pop(); paint(); return; }
      const [x, y] = key.split(',').map(Number), [px, py] = path.at(-1).split(',').map(Number);
      if (Math.abs(x - px) + Math.abs(y - py) !== 1 || path.includes(key)) return this._feedback('Chọn ô đường liền kề với điểm hiện tại nhé.');
      path.push(key); this.onSound('click'); paint();
      if (key === '4,0') {
        if (path.includes('2,2')) this._done('Đã tìm được lối đi qua ngôi sao đến nơi làm việc.');
        else this._feedback('Mình còn cần đi qua điểm ngôi sao. Quay lại một chút nhé.');
      } else this._feedback(path.includes('2,2') ? 'Đã qua ngôi sao. Đi tiếp đến biểu tượng nơi làm việc.' : 'Đi qua ngôi sao ở giữa bản đồ nhé.');
    }));
    this._listen(this._q('[data-route-reset]'), 'click', () => { if (!this.complete) { path = ['0,4']; paint(); this._feedback('Lối đi mới bắt đầu từ ngôi nhà.'); } }); paint();
  }
  _phone() {
    this._shell(this._copy('Giữ liên lạc trong ngày', 'Chọn một lời nhắn, rồi chạm gửi. Cả hai lựa chọn đều là những cách quan tâm phù hợp.', 'Các tin nhắn là gợi ý tương tác, không phải hội thoại thật của hai người.') + `<div class="activity-phone"><div class="activity-phone-top"><span>‹</span><strong>♡ Một người thương</strong><span>•••</span></div><div class="activity-chat-log" aria-live="polite"></div><div class="activity-phone-compose"></div></div>`);
    let round = 0, selected = null, pending = false;
    const compose = () => {
      const data = DIALOGUES.phone.rounds[round]; selected = null;
      const log = this._q('.activity-chat-log'), note = document.createElement('div'); note.className = 'activity-message'; note.textContent = `${data.title} · ${data.prompt}`; log.append(note);
      this._q('.activity-phone-compose').innerHTML = `<div class="activity-choice-list">${data.choices.map((choice, i) => button(esc(choice), `data-reply="${i}"`, 'activity-choice')).join('')}</div>${button('Gửi tin nhắn →', 'data-send disabled', 'primary')}`;
      this._all('[data-reply]').forEach(el => this._listen(el, 'click', () => { selected = Number(el.dataset.reply); this._all('[data-reply]').forEach(n => n.classList.toggle('is-selected', n === el)); this._q('[data-send]').disabled = false; }));
      this._listen(this._q('[data-send]'), 'click', () => {
        if (selected === null || pending) return; pending = true;
        const message = document.createElement('div'); message.className = 'activity-message is-outgoing'; message.textContent = data.choices[selected]; log.append(message); this.onSound('message');
        this._q('.activity-phone-compose').textContent = 'Đã gửi ♡'; this._feedback(`Đã gửi ${round + 1}/3 lời nhắn mẫu.`);
        const timer = setTimeout(() => { pending = false; if (++round < DIALOGUES.phone.rounds.length) compose(); else { this._q('.activity-phone-compose').textContent = 'Đã đến lúc cùng nhau kết thúc ngày làm việc.'; this._done('Ba lời quan tâm đã được gửi. Mình đi đón nhau nhé.'); } log.scrollTop = log.scrollHeight; }, 420); this.cleanups.push(() => clearTimeout(timer));
      }); log.scrollTop = log.scrollHeight;
    }; compose();
  }
  _pickup() {
    this._shell(this._copy('Đi đón nhau, rồi cùng trở về', 'Di chuyển đến nơi làm việc ở bên phải. Đứng gần Em để gọi, rồi cùng trở về ngôi nhà bên trái.') + this._canvas('Di chuyển đến nhân vật nữ bên phải để đón, sau đó trở về bên trái.') + this._directions() + `<div class="activity-tray">${button('Mình về nhé ♡', 'data-pickup disabled', 'primary')}</div>`);
    let together = false, current;
    const pickup = this._q('[data-pickup]');
    this._listen(pickup, 'click', () => { if (current && distance(current, { x: 535, y: 196 }) < 65) { together = true; pickup.disabled = true; pickup.textContent = 'Đang cùng trở về ♡'; this._feedback('Đã gặp nhau. Cùng đi về ngôi nhà bên trái nhé.'); this.onSound('collect'); } });
    current = this._movement({ start: { x: 65, y: 198 }, bounds: [35, 590, 164, 232], speed: 105,
      tick: pos => { if (!together) pickup.disabled = distance(pos, { x: 535, y: 196 }) >= 65; if (together && pos.x < 88) this._done('Đã cùng nhau trở về. Một ngày bình thường cũng có thể trở thành kỷ niệm.'); },
      draw: (ctx, pos, now, moving) => {
        landscape(ctx, 'day', now); ctx.fillStyle = '#ebdbc2'; ctx.fillRect(0, 173, 640, 69); ctx.fillStyle = '#d4c6a9'; for (let i = 0; i < 13; i++) ctx.fillRect(i * 52, 203, 32, 2);
        ctx.fillStyle = '#ead9bc'; ctx.fillRect(23, 107, 82, 64); ctx.fillStyle = '#aa7c73'; ctx.beginPath(); ctx.moveTo(12, 111); ctx.lineTo(64, 69); ctx.lineTo(116, 111); ctx.fill(); ctx.fillStyle = '#8c7162'; ctx.fillRect(55, 137, 20, 35);
        ctx.fillStyle = '#d9ded0'; ctx.fillRect(495, 76, 115, 96); ctx.fillStyle = '#8ba29a'; ctx.fillRect(491, 72, 123, 12); ctx.fillStyle = '#a2c7c2'; for (let i = 0; i < 3; i++) ctx.fillRect(505 + i * 33, 98, 20, 24); ctx.fillStyle = '#827b68'; ctx.fillRect(544, 139, 25, 34);
        ctx.fillStyle = '#536d5b'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Nơi làm việc', 552, 65); ctx.fillText('Cùng trở về', 65, 60);
        person(ctx, together ? pos.x + 22 : 535, together ? pos.y + 6 : 197, 'female', 1.65, moving && together ? now / 120 : 0); person(ctx, pos.x, pos.y, 'male', 1.65, moving ? now / 120 : 0);
      }
    });
  }
  _peopleButtons(attr = 'data-person') { return PEOPLE.map((p, i) => `<button type="button" class="activity-person" ${attr}="${i}" aria-label="${esc(p.label)}"><span class="activity-person-icon" aria-hidden="true">${p.symbol}</span><strong>${p.name}</strong><small>${p.label}</small></button>`).join(''); }
  _tickets() {
    this._shell(this._copy('Đủ vé cho cả năm người', 'Chọn một vé rồi trao cho đúng người. Khi đủ vé, chọn từng người và một ghế trống để sắp chỗ ngồi.') + this._canvas('Cả năm nhân vật đang chờ vào rạp. Các em nhỏ chuyển động và đi đến ghế được bạn chọn.') + `<div class="activity-tickets">${[3, 0, 4, 1, 2].map(i => button(`<span aria-hidden="true">▥</span> ${PEOPLE[i].label}<small>VÉ XEM PHIM · 0${i + 1}</small>`, `data-ticket="${i}"`, 'activity-ticket')).join('')}</div><div class="activity-people">${this._peopleButtons()}</div><div class="activity-cinema-screen">MÀN HÌNH</div><div class="activity-seats">${PEOPLE.map((_, i) => `<button type="button" class="activity-seat" data-seat="${i}" aria-label="Ghế ${i + 1}"><span>▥</span><small>${i + 1}</small></button>`).join('')}</div>`);
    let selectedTicket = null, selectedPerson = null; const ticketed = new Set(), seated = new Map();
    const ctx = this._q('canvas').getContext('2d'), positions = PEOPLE.map((_, i) => ({ x: 100 + i * 108, y: 226 })); let sceneFrame;
    const scene = now => {
      ctx.fillStyle = '#424958'; ctx.fillRect(0, 0, 640, 270); ctx.fillStyle = '#e3d9bd'; ctx.fillRect(119, 19, 402, 100); ctx.fillStyle = '#b6cebb'; ctx.fillRect(129, 29, 382, 80);
      ctx.fillStyle = '#718d80'; ctx.beginPath(); ctx.moveTo(129, 109); ctx.lineTo(223, 49); ctx.lineTo(327, 109); ctx.lineTo(411, 48); ctx.lineTo(511, 109); ctx.fill();
      ctx.fillStyle = '#6f6674'; ctx.fillRect(0, 138, 640, 132); ctx.fillStyle = '#c9a8ac'; ctx.fillRect(25, 0, 49, 151); ctx.fillRect(566, 0, 49, 151);
      for (let slot = 0; slot < 5; slot++) { ctx.fillStyle = '#a17782'; ctx.fillRect(84 + slot * 108, 142, 42, 44); ctx.fillStyle = '#c39aa0'; ctx.fillRect(79 + slot * 108, 171, 52, 13); }
      PEOPLE.forEach((p, i) => {
        const seat = [...seated.entries()].find(([, id]) => id === i)?.[0];
        const targetX = seat === undefined ? 100 + i * 108 + Math.sin(now / 1100 + i) * (i > 1 ? 9 : 2) : 105 + seat * 108;
        const targetY = seat === undefined ? 231 + Math.sin(now / 850 + i) * (i > 1 ? 3 : 0) : 181;
        const moving = Math.abs(targetY - positions[i].y) > 1 || Math.abs(targetX - positions[i].x) > 1;
        positions[i].x += (targetX - positions[i].x) * .055; positions[i].y += (targetY - positions[i].y) * .055;
        person(ctx, positions[i].x, positions[i].y, p.id, 1.75, moving ? now / 130 : 0);
        if (ticketed.has(i) && seat === undefined) { ctx.fillStyle = '#f2ddb8'; ctx.fillRect(positions[i].x + 15, positions[i].y - 29, 13, 8); }
        ctx.fillStyle = '#fff6df'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.name, positions[i].x, positions[i].y + 20);
      }); sceneFrame = requestAnimationFrame(scene);
    }; sceneFrame = requestAnimationFrame(scene); this.cleanups.push(() => cancelAnimationFrame(sceneFrame));
    this._all('[data-ticket]').forEach(el => this._listen(el, 'click', () => { selectedTicket = Number(el.dataset.ticket); this._all('[data-ticket]').forEach(n => n.classList.toggle('is-selected', n === el)); this._feedback('Trao vé cho nhân vật có nhãn tương ứng.'); }));
    this._all('[data-person]').forEach(el => this._listen(el, 'click', () => {
      const id = Number(el.dataset.person);
      if (ticketed.size < 5) {
        if (selectedTicket === null) return this._feedback('Chọn một chiếc vé trước nhé.');
        if (selectedTicket !== id) return this._feedback('Vé có tên vai trò của một người khác. Thử lại nhé.');
        ticketed.add(id); this._q(`[data-ticket="${id}"]`).disabled = true; selectedTicket = null; el.classList.add('is-done'); this.onSound('collect'); this._feedback(ticketed.size === 5 ? 'Đã đủ năm vé. Chọn một người rồi chọn ghế trống.' : `Đã trao ${ticketed.size}/5 chiếc vé.`);
      } else {
        if ([...seated.values()].includes(id)) return this._feedback('Người này đã có ghế rồi.');
        selectedPerson = id; this._all('[data-person]').forEach(n => n.classList.toggle('is-selected', n === el)); this._feedback(`Chọn ghế trống cho ${PEOPLE[id].name}.`);
      }
    }));
    this._all('[data-seat]').forEach(el => this._listen(el, 'click', () => {
      if (ticketed.size < 5) return this._feedback('Cần chuẩn bị đủ năm vé trước khi vào rạp.');
      if (selectedPerson === null) return this._feedback('Chọn người sẽ ngồi ở ghế này.');
      const seat = Number(el.dataset.seat); if (seated.has(seat)) return this._feedback('Ghế này đã có người. Chọn một ghế khác nhé.');
      seated.set(seat, selectedPerson); el.innerHTML = `<span>${PEOPLE[selectedPerson].symbol}</span><small>${PEOPLE[selectedPerson].name}</small>`; el.classList.add('is-done'); this._q(`[data-person="${selectedPerson}"]`).disabled = true; selectedPerson = null; this.onSound('click');
      if (seated.size === 5) this._done('Năm người đã vào rạp. Sau bộ phim, mình cùng đi ăn nhé.'); else this._feedback(`Đã xếp ${seated.size}/5 chỗ ngồi.`);
    }));
  }
  _food() {
    const foods = QUESTS.foods.items, assignment = [2, 0, 4, 1, 3];
    this._shell(this._copy('Nhớ giúp nhau những món nhỏ', 'Ghi nhớ món trên từng thẻ. Khi đã sẵn sàng, úp thẻ và chọn món để phục vụ đúng người.', 'Món ăn dùng trong câu đố là minh họa, không khẳng định sở thích thật của ai.') + `<div class="activity-food-table">${PEOPLE.map((p, i) => `<button type="button" class="activity-food-card" data-food-person="${i}" aria-label="Phần ăn của ${p.name}"><span class="activity-person-icon">${p.symbol}</span><strong>${p.name}</strong><span class="activity-food-order">${foods[assignment[i]].icon}</span><small>${foods[assignment[i]].name}</small></button>`).join('')}</div><div class="activity-tray activity-food-tray" hidden>${foods.map(f => button(`${f.icon}<span>${f.name}</span>`, `data-food="${f.id}"`, 'activity-chip')).join('')}</div><div class="activity-tray">${button('Đã nhớ · Úp thẻ', 'data-hide-food', 'primary')}${button('Xem lại món', 'data-reveal-food hidden', 'secondary')}</div>`);
    let memorizing = true, selected = null; const served = new Set();
    const hide = () => { memorizing = false; this._all('[data-food-person]').forEach((el, i) => { if (!served.has(i)) { el.querySelector('.activity-food-order').textContent = '?'; el.querySelector('small').textContent = 'Chờ món ăn'; } }); this._q('.activity-food-tray').hidden = false; this._q('[data-hide-food]').hidden = true; this._q('[data-reveal-food]').hidden = false; this._feedback('Chọn một món trong khay, rồi chạm vào người đã gọi món đó.'); };
    this._listen(this._q('[data-hide-food]'), 'click', hide);
    this._listen(this._q('[data-reveal-food]'), 'click', () => { memorizing = true; this._all('[data-food-person]').forEach((el, i) => { el.querySelector('.activity-food-order').textContent = foods[assignment[i]].icon; el.querySelector('small').textContent = foods[assignment[i]].name; }); this._q('.activity-food-tray').hidden = true; this._q('[data-hide-food]').hidden = false; this._q('[data-reveal-food]').hidden = true; this._feedback('Cứ nhìn thêm một chút. Không giới hạn số lần xem lại.'); });
    this._all('[data-food]').forEach(el => this._listen(el, 'click', () => { selected = Number(el.dataset.food); this._all('[data-food]').forEach(n => n.classList.toggle('is-selected', n === el)); }));
    this._all('[data-food-person]').forEach(el => this._listen(el, 'click', () => {
      if (memorizing || this.complete) return; const id = Number(el.dataset.foodPerson);
      if (served.has(id)) return; if (selected === null) return this._feedback('Chọn món ăn trong khay trước nhé.');
      if (selected !== assignment[id]) return this._feedback('Chưa đúng món trên thẻ. Bạn có thể bấm Xem lại món bất cứ lúc nào.');
      served.add(id); el.classList.add('is-done'); el.querySelector('.activity-food-order').textContent = foods[selected].icon; el.querySelector('small').textContent = foods[selected].name; this._q(`[data-food="${selected}"]`).disabled = true; selected = null; this.onSound('collect');
      if (served.size === 5) this._done('Đủ năm phần ăn. Bây giờ cùng chụp một tấm ảnh nhé.'); else this._feedback(`Đã chuẩn bị ${served.size}/5 phần ăn.`);
    }));
  }
  _drawPhoto(canvas, slots, animated = false) {
    const ctx = canvas.getContext('2d'); landscape(ctx, 'day', 0);
    ctx.fillStyle = '#8abdbb'; ctx.fillRect(0, 145, 640, 57); ctx.fillStyle = '#c5dfcd'; for (let i = 0; i < 14; i++) ctx.fillRect(i * 51, 157 + i % 3 * 10, 20, 2);
    ctx.fillStyle = '#e8d6b5'; ctx.fillRect(0, 196, 640, 74); ctx.fillStyle = '#b09c7e'; ctx.fillRect(0, 190, 640, 7);
    for (let x = 15; x < 640; x += 45) { ctx.fillStyle = '#b79b7f'; ctx.fillRect(x, 164, 7, 39); }
    [28, 604].forEach((x, i) => { ctx.fillStyle = '#847060'; ctx.fillRect(x, 64, 12, 130); ctx.fillStyle = '#c996a5'; ctx.fillRect(x - 42, 37, 95, 57); ctx.fillRect(x - 29, 23, 70, 87); ctx.fillStyle = '#eab8c0'; for (let j = 0; j < 23; j++) ctx.fillRect(x - 35 + (j * 17 % 80), 34 + (j * 11 % 59), 8, 7); });
    slots.forEach((id, slot) => { if (id !== null) person(ctx, 135 + slot * 94, 241, PEOPLE[id].id, 2.25); });
    ctx.fillStyle = '#fff7e9ed'; ctx.fillRect(167, 8, 306, 31); ctx.fillStyle = '#536b59'; ctx.font = 'italic 18px Georgia'; ctx.textAlign = 'center'; ctx.fillText('Một khung hình, đủ cả năm', 320, 29);
  }
  _photo() {
    this._shell(this._copy('Một khung hình của cả năm', 'Chọn từng người rồi chọn vị trí trong ảnh. Khi đủ cả năm, chạm máy ảnh để giữ khoảnh khắc này.') + `<div class="activity-photo-stage">${this._canvas('Khung ảnh năm người. Sắp nhân vật bằng các nút bên dưới.')}<div class="activity-photo-slots">${PEOPLE.map((_, i) => `<button class="activity-photo-slot" type="button" data-photo-slot="${i}" aria-label="Vị trí chụp ảnh ${i + 1}">+</button>`).join('')}</div></div><div class="activity-people">${this._peopleButtons('data-photo-person')}</div><div class="activity-tray">${button('◉ Chụp ảnh', 'data-shutter disabled', 'primary')}${button('Sắp xếp lại', 'data-photo-reset', 'secondary')}<a class="activity-button secondary" data-download hidden download="love-quest-nam-nguoi.png">Tải ảnh về máy ↓</a></div>`);
    let slots = [null, null, null, null, null], selected = null; const canvas = this._q('canvas');
    const paint = () => { this._drawPhoto(canvas, slots); this._all('[data-photo-slot]').forEach(el => { const p = slots[Number(el.dataset.photoSlot)]; el.textContent = p === null ? '+' : PEOPLE[p].name; el.classList.toggle('is-done', p !== null); }); this._all('[data-photo-person]').forEach(el => { el.disabled = slots.includes(Number(el.dataset.photoPerson)); }); this._q('[data-shutter]').disabled = slots.includes(null); };
    this._all('[data-photo-person]').forEach(el => this._listen(el, 'click', () => { selected = Number(el.dataset.photoPerson); this._all('[data-photo-person]').forEach(n => n.classList.toggle('is-selected', el === n)); this._feedback('Chọn một trong năm vị trí trong khung hình.'); }));
    this._all('[data-photo-slot]').forEach(el => this._listen(el, 'click', () => { if (selected === null) return this._feedback('Chọn người bên dưới trước nhé.'); const slot = Number(el.dataset.photoSlot); if (slots[slot] !== null) return this._feedback('Vị trí này đã có người. Bạn có thể sắp xếp lại nếu muốn.'); slots[slot] = selected; selected = null; paint(); this.onSound('click'); }));
    this._listen(this._q('[data-photo-reset]'), 'click', () => { if (this.complete) return; slots = [null, null, null, null, null]; selected = null; paint(); });
    this._listen(this._q('[data-shutter]'), 'click', () => {
      if (slots.includes(null)) return;
      const image = canvas.toDataURL('image/png'); const saved = safeWrite('lovequest.photo.v1', image); const link = this._q('[data-download]'); link.href = image; link.hidden = false;
      this._q('[data-shutter]').textContent = '✓ Đã chụp'; this._q('[data-shutter]').disabled = true; this._q('[data-photo-reset]').disabled = true;
      this._done(saved ? 'Ảnh đã được giữ trong album trên trình duyệt này. Bạn cũng có thể tải ảnh về máy.' : 'Ảnh đã chụp. Trình duyệt chưa lưu được ảnh; hãy tải ảnh về máy.');
    }); paint();
  }
  _feelings() {
    const icons = ['☁', '✉', '✿'];
    this._shell(this._copy('Lắng nghe từ cả hai phía', 'Chạm ba khoảng suy tư ở mỗi phía. Đây là những câu hỏi gợi mở; cảm xúc thật của hai người luôn có thể khác.', 'Không có ai mặc định là người có lỗi. Mình cùng tìm hiểu cả hai phía.') + `<div class="activity-two-sides">${['female', 'male'].map((id, side) => `<section class="activity-feeling-side ${id}"><span class="activity-person-icon">${side ? '☘' : '✿'}</span><h4>${side ? 'Phía anh' : 'Phía em'}</h4><div class="activity-feeling-thoughts">${icons.map((icon, i) => `<button type="button" class="activity-thought" data-thought="${id}:${i}" aria-label="Khám phá suy tư ${i + 1} của ${side ? 'anh' : 'em'}">${icon}</button>`).join('')}</div><p class="activity-reflection" data-reflection="${id}" aria-live="polite">Một chút yên lặng để hiểu mình hơn.</p></section>`).join('')}</div>`);
    const found = new Set();
    this._all('[data-thought]').forEach(el => this._listen(el, 'click', () => { const [id, index] = el.dataset.thought.split(':'); found.add(el.dataset.thought); el.classList.add('is-done'); this._q(`[data-reflection="${id}"]`).textContent = DIALOGUES.reflection[id][Number(index)]; this.onSound('click'); if (found.size === 6) this._done('Đã dành thời gian cho cả hai phía. Mình thử viết một lời nhắn nhé.'); else this._feedback(`Đã khám phá ${found.size}/6 khoảng suy tư.`); }));
  }
  _message() {
    const groups = DIALOGUES.messageAssembly.groups;
    this._shell(this._copy('Một lời nhắn có chỗ cho cả hai', 'Chọn một ý từ mỗi nhóm để viết lời nhắn. Mọi lựa chọn đều hợp lệ; không có một đáp án tình cảm duy nhất.', 'Nội dung là gợi ý để tương tác, có thể thay bằng lời nhắn thật trong dữ liệu.') + `<div class="activity-message-groups">${groups.map((g, gi) => `<section><h4>${gi + 1}. ${g.title}</h4>${g.choices.map((choice, ci) => button(esc(choice), `data-message-piece="${gi}:${ci}"`, 'activity-choice')).join('')}</section>`).join('')}</div><blockquote class="activity-message-preview" aria-live="polite">Lời nhắn của bạn sẽ xuất hiện ở đây…</blockquote><div class="activity-tray">${button('Gửi lời nhắn ♡', 'data-send-feelings disabled', 'primary')}</div>`);
    const selected = [null, null, null];
    this._all('[data-message-piece]').forEach(el => this._listen(el, 'click', () => { const [g, c] = el.dataset.messagePiece.split(':').map(Number); selected[g] = c; this._all(`[data-message-piece^="${g}:"]`).forEach(n => n.classList.toggle('is-selected', n === el)); this._q('.activity-message-preview').textContent = selected.map((choice, i) => choice === null ? '…' : groups[i].choices[choice]).join(' '); this._q('[data-send-feelings]').disabled = selected.includes(null); this.onSound('click'); }));
    this._listen(this._q('[data-send-feelings]'), 'click', () => { if (selected.includes(null)) return; this._q('[data-send-feelings]').disabled = true; this._q('[data-send-feelings]').textContent = 'Đã gửi ♡'; this._done('Một lời nhắn đã được ghép bằng sự lắng nghe và tôn trọng.'); });
  }
  _reconcile() {
    this._shell(this._copy('Mỗi người một bước nhỏ', 'Giữ hai nút bên dưới, hoặc phím A và L, để cả hai cùng bước lại gần. Khi đã ở cạnh nhau, chạm nút ôm.') + this._canvas('Hai nhân vật bước lại gần nhau. Giữ A cho Em, L cho Anh.') + `<div class="activity-tray">${button('Em bước lại gần →', 'data-approach="female"', 'secondary')}${button('← Anh bước lại gần', 'data-approach="male"', 'secondary')}${button('Một cái ôm ♡', 'data-hug disabled', 'primary')}</div>`);
    let left = 115, right = 525, frame, last = performance.now(), hugged = false; const active = new Set(); const canvas = this._q('canvas'), ctx = canvas.getContext('2d');
    this._all('[data-approach]').forEach(el => {
      this._listen(el, 'pointerdown', e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); active.add(el.dataset.approach); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(event => this._listen(el, event, () => active.delete(el.dataset.approach)));
      this._listen(el, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); active.add(el.dataset.approach); } }); this._listen(el, 'keyup', () => active.delete(el.dataset.approach));
    });
    this._listen(document, 'keydown', e => { if (e.key.toLowerCase() === 'a') active.add('female'); if (e.key.toLowerCase() === 'l') active.add('male'); });
    this._listen(document, 'keyup', e => { if (e.key.toLowerCase() === 'a') active.delete('female'); if (e.key.toLowerCase() === 'l') active.delete('male'); }); this._listen(window, 'blur', () => active.clear());
    this._listen(this._q('[data-hug]'), 'click', () => { if (right - left > 65) return; hugged = true; this._done('Hai người đã cùng bước lại gần. Trái tim hòa giải được giữ lại.'); });
    const loop = now => {
      const dt = Math.min((now - last) / 1000, .04); last = now;
      if (active.has('female')) left = Math.min(296, left + dt * 78); if (active.has('male')) right = Math.max(344, right - dt * 78);
      const warmth = (410 - (right - left)) / 362;
      landscape(ctx, 'day', now); ctx.fillStyle = `rgba(99,103,131,${.5 * (1 - warmth)})`; ctx.fillRect(0, 0, 640, 270); ctx.fillStyle = `rgba(255,204,165,${warmth * .25})`; ctx.fillRect(0, 0, 640, 270);
      ctx.fillStyle = '#d8c7ab'; ctx.beginPath(); ctx.ellipse(320, 232, 300, 35, 0, 0, Math.PI * 2); ctx.fill();
      person(ctx, hugged ? 307 : left, 227, 'female', 2.3, active.has('female') ? now / 120 : 0); person(ctx, hugged ? 332 : right, 227, 'male', 2.3, active.has('male') ? now / 120 : 0);
      if (hugged) { ctx.fillStyle = '#c88296'; ctx.font = '36px Georgia'; ctx.textAlign = 'center'; ctx.fillText('♥', 320, 105 + Math.sin(now / 500) * 4); }
      this._q('[data-hug]').disabled = hugged || right - left > 65; frame = requestAnimationFrame(loop);
    }; frame = requestAnimationFrame(loop); this.cleanups.push(() => cancelAnimationFrame(frame));
  }
  _memories() {
    this._shell(this._copy('Đặt bốn kỷ niệm theo hành trình', 'Chọn một vật phẩm rồi đặt vào trang tương ứng, theo thứ tự bốn chương mình vừa đi qua.') + `<div class="activity-memory-slots">${CHAPTERS.slice(0, 4).map((c, i) => `<button type="button" class="activity-memory-slot" data-memory-slot="${i}"><small>TRANG 0${i + 1}</small><span class="activity-memory-empty">＋</span><strong>${esc(c.title)}</strong></button>`).join('')}</div><div class="activity-tray">${[2, 0, 3, 1].map(i => button(`<span class="activity-flower">${MEMORY_SYMBOLS[i]}</span><small>${CHAPTERS[i].item}</small>`, `data-memory="${i}"`, 'activity-chip')).join('')}</div>`);
    let selected = null; const placed = new Set();
    this._all('[data-memory]').forEach(el => this._listen(el, 'click', () => { selected = Number(el.dataset.memory); this._all('[data-memory]').forEach(n => n.classList.toggle('is-selected', el === n)); }));
    this._all('[data-memory-slot]').forEach(el => this._listen(el, 'click', () => { const id = Number(el.dataset.memorySlot); if (selected === null) return this._feedback('Chọn một vật phẩm kỷ niệm trước nhé.'); if (placed.has(id)) return; if (selected !== id) return this._feedback('Vật phẩm này thuộc một trang khác trong hành trình. Thử lại nhé.'); placed.add(id); el.querySelector('.activity-memory-empty').textContent = MEMORY_SYMBOLS[id]; el.classList.add('is-done'); this._q(`[data-memory="${id}"]`).disabled = true; selected = null; this.onSound('collect'); if (placed.size === 4) this._done('Bốn trang đã ở đúng vị trí. Món quà cuối cùng đang chờ.'); else this._feedback(`Đã đặt ${placed.size}/4 kỷ niệm.`); }));
  }
  _gift() {
    const shared=DIALOGUES.personal||{};
    const personal = {greeting:shared.greeting?.text||'',letter:shared.letter?.text||'',...safeRead('lovequest.personal.v1', {})}, photos = [...(Array.isArray(shared.photos)?shared.photos:[]),...safeRead('lovequest.personal-photos.v1', [])].slice(0,4);
    this._shell(this._copy('Một món quà, một trang viết tiếp', 'Kéo dải ruy-băng hết sang phải để mở hộp quà. Bên trong là bức thư có thể dành riêng cho hai người.') + `<div class="activity-gift-scene"><div class="activity-gift-box" aria-hidden="true"><div class="activity-gift-lid"></div><div class="activity-gift-ribbon">🎀</div><span>20 / 10</span></div><label class="activity-ribbon-control">Tháo dải ruy-băng<input type="range" min="0" max="100" value="0" step="1" data-ribbon aria-label="Kéo để tháo ruy-băng"></label></div><section class="activity-letter" hidden><p class="activity-kicker">Gửi người thương của anh</p><h3 class="activity-greeting"></h3>${button('Mở lá thư ✉', 'data-open-letter', 'primary')}<div class="activity-letter-content" hidden><p class="activity-letter-text"></p><p class="activity-note activity-letter-placeholder"></p><div class="activity-private-photos"></div></div></section><details class="activity-personal-settings"><summary>Thêm lời riêng & ảnh của hai người</summary><form class="activity-personal-form"><label>Lời chúc ngày 20/10<input name="greeting" maxlength="160" placeholder="Lời chúc thật của bạn…" value="${esc(personal.greeting || '')}"></label><label>Nội dung bức thư<textarea name="letter" rows="5" maxlength="8000" placeholder="Viết bức thư của riêng hai người…">${esc(personal.letter || '')}</textarea></label><label>Ảnh kỷ niệm (tối đa 4 ảnh)<input type="file" accept="image/*" multiple data-real-photos></label><p class="activity-note">Lời riêng và ảnh chỉ được lưu trong trình duyệt này, không gửi lên GitHub. Thêm ảnh sau vẫn được.</p>${button('Lưu lời riêng', 'type="submit" data-save-personal', 'secondary')}<p class="activity-personal-status" role="status"></p></form></details>`);
    let opened = false;
    const paintPersonal = () => {
      this._q('.activity-greeting').textContent = personal.greeting || 'Lời chúc dành riêng cho em';
      this._q('.activity-letter-text').textContent = personal.letter || '[Bức thư thật đang chờ được viết. Bạn có thể thêm lời riêng bằng mục bên dưới.]';
      this._q('.activity-letter-placeholder').textContent = personal.letter ? '' : 'Đây là chỗ dành cho bức thư thật, chưa phải lời nhắn chính thức.';
      const gallery = this._q('.activity-private-photos'); gallery.replaceChildren();
      photos.forEach((src, i) => { const img = document.createElement('img'); img.src = src; img.alt = `Ảnh kỷ niệm riêng ${i + 1}`; gallery.append(img); });
    }; paintPersonal();
    this._listen(this._q('[data-ribbon]'), 'input', e => { this._q('.activity-gift-ribbon').style.transform = `translateX(${Number(e.target.value) * .8}px) rotate(${Number(e.target.value) / 4}deg)`; this._q('.activity-gift-ribbon').style.opacity = 1 - Number(e.target.value) / 125; if (Number(e.target.value) >= 100 && !opened) { opened = true; this._q('.activity-gift-box').classList.add('is-open'); this._q('.activity-letter').hidden = false; this._q('[data-ribbon]').disabled = true; this._feedback('Hộp quà đã mở. Chạm vào lá thư để đọc nhé.'); this.onSound('collect'); } });
    this._listen(this._q('[data-open-letter]'), 'click', () => { if (!opened) return; this._q('.activity-letter-content').hidden = false; this._q('[data-open-letter]').hidden = true; this._done('Lá thư đã mở. Bạn có thể thêm lời riêng hoặc cất trang này vào album.'); });
    this._listen(this._q('.activity-personal-form'), 'submit', e => { e.preventDefault(); const data = new FormData(e.currentTarget); personal.greeting = String(data.get('greeting')).trim(); personal.letter = String(data.get('letter')).trim(); const saved = safeWrite('lovequest.personal.v1', personal); this._q('.activity-personal-status').textContent = saved ? 'Đã lưu lời riêng trên trình duyệt này.' : 'Trình duyệt chưa lưu được. Hãy giữ lại nội dung ở nơi khác.'; paintPersonal(); });
    this._listen(this._q('[data-real-photos]'), 'change', async e => {
      const files = [...e.target.files].slice(0, 4); if (!files.length) return; const generation = this.generation; const status = this._q('.activity-personal-status'); status.textContent = 'Đang chuẩn bị ảnh…';
      const converted = [];
      for (const file of files) {
        if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) continue;
        try {
          const src = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
          const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
          const c = document.createElement('canvas'), ratio = Math.min(1, 1000 / Math.max(image.width, image.height)); c.width = Math.round(image.width * ratio); c.height = Math.round(image.height * ratio); c.getContext('2d').drawImage(image, 0, 0, c.width, c.height); converted.push(c.toDataURL('image/jpeg', .78));
        } catch { /* Invalid local images are skipped without interrupting the chapter. */ }
      }
      if (generation !== this.generation || !this._q('.activity-private-photos')) return;
      if (converted.length) { photos.splice(0, photos.length, ...converted); const saved = safeWrite('lovequest.personal-photos.v1', photos); this._q('.activity-personal-status').textContent = saved ? `Đã lưu ${photos.length} ảnh riêng trên trình duyệt này.` : 'Bộ nhớ trình duyệt đã đầy; hãy thử ảnh nhỏ hơn.'; paintPersonal(); }
      else this._q('.activity-personal-status').textContent = 'Chưa đọc được ảnh. Hãy chọn ảnh JPG, PNG hoặc WebP dưới 15 MB.';
    });
  }
}
