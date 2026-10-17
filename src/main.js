import {WORLD,WorldRenderer,drawCharacter} from './world.js';
import {CHAPTERS,ActivityRunner} from './activities.js';
import {freshProgress,loadProgress,saveProgress,readSettings,writeSettings,readPhotos,writePhotos} from './storage.js';
import {GardenAudio} from './audio.js';
import {StoryEngine} from './story-engine.js';

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconPaths={
  book:'<path d="M3 4h6c2 0 3 1 3 2v15c0-2-2-3-4-3H3zM21 4h-6c-2 0-3 1-3 2v15c0-2 2-3 4-3h5z"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
  settings:'<path d="m9 3-.5 3-2.6 1.5L3 7l-1 3 2.4 2-2.4 2 1 3 2.9-.5L8.5 18l.5 3h4l.5-3 2.6-1.5 2.9.5 1-3-2.4-2 2.4-2-1-3-2.9.5L13.5 6 13 3z"/><circle cx="11" cy="12" r="3"/>',
  sound:'<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  soundOff:'<path d="m11 4-6 5H2v6h3l6 5zM16 9l6 6M22 9l-6 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths.sun}</svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));

const settings=readSettings(), audio=new GardenAudio(settings), renderer=new WorldRenderer($('gameCanvas'));
let progress=loadProgress()||freshProgress(), hasSave=!!loadProgress();
const state={mode:'home',preview:false,area:'garden',player:{...WORLD.spawn,character:'female',direction:'down',moving:false},companion:{x:WORLD.spawn.x+32,y:WORLD.spawn.y-10,character:'male',direction:'down',moving:false},time:0,target:null,nearest:null,locked:false};
const keys=new Set(),held=new Set();
const areaNames={garden:'Vườn hoa bình yên',forest:'Lối rừng nắng nhẹ',lake:'Bến hồ trong xanh'};
const daylightNames={morning:'Sớm mai',sunset:'Hoàng hôn',night:'Đêm dịu dàng'};
const objectForChapter=['flowers','mailbox','picnic','bench','pavilion'];
const itemSymbols=['💐','✉','🎞','♡','🎁'];
let toastTimer,saveTimer,autosaveAt=0,previousFocus=null,transitioning=false;

function notify(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3600);}
function isModal(){return !$('panelModal').hidden||!$('activityModal').hidden;}
function stopMovement(){keys.clear();held.clear();state.target=null;state.player.moving=false;document.querySelectorAll('.dpad button').forEach(b=>b.classList.remove('pressed'));}
function persist(show=false){
  if(state.preview||state.mode!=='playing')return;
  progress.player={x:state.player.x,y:state.player.y,character:state.player.character};progress.area=state.area;progress.started=true;
  hasSave=true;
  if(saveProgress(progress)){
    if(show){$('saveIndicator').textContent='Đã lưu hành trình';$('saveIndicator').classList.add('show');clearTimeout(saveTimer);saveTimer=setTimeout(()=>$('saveIndicator').classList.remove('show'),2000);}
  }else notify('Bộ nhớ trình duyệt đã đầy. Hãy xuất bản lưu trước khi đóng trang.');
}
function currentChapter(){return Math.min(progress.completed.length,4);}
function unlocked(id){return id===0||progress.completed.includes(id-1);}
function updateSound(){const on=settings.music;$('soundBtn').innerHTML=icon(on?'sound':'soundOff');$('soundBtn').ariaLabel=on?'Tắt nhạc':'Bật nhạc';$('soundBtn').title=on?'Tắt nhạc':'Bật nhạc';}
function updateHud(){
  $('areaLabel').textContent=areaNames[state.area];
  $('daylightLabel').textContent=$('timeLabel').textContent=daylightNames[settings.daylight]||daylightNames.morning;
  $('characterLabel').textContent=`Đang chơi: ${progress.names[state.player.character]|| (state.player.character==='female'?'Em':'Anh')}`;
  const id=currentChapter(),chapter=CHAPTERS[id];
  $('chapterTag').textContent=state.preview?'DẠO CHƠI TỰ DO':progress.completed.length===5?'HÀNH TRÌNH ĐÃ LƯU':`CHƯƠNG ${String(id+1).padStart(2,'0')} / 05`;
  $('questTitle').textContent=state.preview?'Chậm lại một chút':progress.completed.length===5?'Câu chuyện còn tiếp':chapter.title;
  $('questDescription').textContent=state.preview?'Ghé thăm vườn hoa, lối rừng và bến hồ.':progress.completed.length===5?'Mọi kỷ niệm đã nằm trong album của chúng mình.':chapter.description||chapter.subtitle;
  $('chapterDots').innerHTML=CHAPTERS.map((c,i)=>`<span class="chapter-dot ${progress.completed.includes(i)?'done':i===id?'current':''}" title="${esc(c.title)}"></span>`).join('');
  $('guideBtn').innerHTML=(state.preview?'Mở bản đồ':progress.completed.length===5?'Xem album ký ức':'Đến địa điểm')+' <span aria-hidden="true">→</span>';
  $('continueBtn').hidden=!hasSave;
  updateSound();
}

function safePosition(x,y){
  const start={x:Math.max(30,Math.min(WORLD.width-30,x)),y:Math.max(40,Math.min(WORLD.height-30,y))};
  if(canStand(start.x,start.y))return start;
  for(let r=20;r<220;r+=20)for(let a=0;a<Math.PI*2;a+=Math.PI/4){const p={x:start.x+Math.cos(a)*r,y:start.y+Math.sin(a)*r};if(canStand(p.x,p.y))return p;}
  return {...WORLD.spawn};
}
function begin(preview=false,fresh=false){
  closePanel();stopMovement();
  if(fresh){const names=progress.names;progress=freshProgress();progress.names=names;}
  state.preview=preview;state.mode='playing';state.area=preview?'garden':progress.area;
  const start=preview?WORLD.spawn:progress.player;
  Object.assign(state.player,safePosition(start.x,start.y),{character:start.character||'female',direction:'down',moving:false});
  Object.assign(state.companion,{x:state.player.x+32,y:state.player.y-16,character:state.player.character==='female'?'male':'female',direction:'down',moving:false});
  $('homeScreen').hidden=true;$('gameHud').hidden=false;$('locationCard').hidden=false;$('gameShell').classList.remove('at-home');
  updateHud();renderer.resize();audio.start(currentChapter());
  if(!preview){persist(true);if(fresh)notify('WASD hoặc chạm để đi. Nút “Đến địa điểm” sẽ giúp bạn tìm ký ức đầu tiên.');}
  else notify('Dạo chơi tự do · Bản lưu câu chuyện được giữ nguyên.');
  $('gameCanvas').focus({preventScroll:true});
}
function home(){persist(true);stopMovement();closePanel();runner.close();$('activityModal').hidden=true;state.mode='home';state.preview=false;audio.stop();$('homeScreen').hidden=false;$('gameHud').hidden=true;$('locationCard').hidden=true;$('gameShell').classList.add('at-home');updateHud();}

function openPanel(title,eyebrow,html,bind){
  stopMovement();previousFocus=document.activeElement;
  $('panelContent').innerHTML=`<div class="panel-eyebrow">${esc(eyebrow)}</div><h2 id="panelTitle">${esc(title)}</h2>${html}`;
  $('panelModal').hidden=false;bind?.();$('closePanel').focus({preventScroll:true});
}
function closePanel(){
  $('panelModal').hidden=true;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
}
function confirmNew(){
  if(!hasSave){begin(false,true);return;}
  openPanel('Viết lại từ trang đầu?','MỘT HÀNH TRÌNH MỚI','<p class="panel-subtitle">Tiến trình hiện tại sẽ được thay bằng một hành trình mới. Bạn có thể xuất bản lưu trong Cài đặt trước khi bắt đầu lại.</p><div class="panel-actions"><button id="confirmNew" class="btn primary">Bắt đầu mới</button><button id="keepSave" class="btn secondary">Giữ bản đã lưu</button></div>',()=>{
    $('confirmNew').onclick=()=>begin(false,true);$('keepSave').onclick=closePanel;
  });
}

const runner=new ActivityRunner({
  container:$('activityHost'),
  onComplete(id){
    if(!progress.completed.includes(id))progress.completed.push(id);
    progress.completed.sort((a,b)=>a-b);progress.chapter=currentChapter();progress.steps[id]=0;
    if(!progress.album.includes(id))progress.album.push(id);
    persist(true);updateHud();audio.play('complete');
    runner.close();$('activityModal').hidden=true;
    const chapter=CHAPTERS[id];
    openPanel(id===4?'Hành trình của chúng mình':'Một kỷ niệm đã được cất giữ',id===4?'OUR STORY IS JUST BEGINNING ♡':`CHƯƠNG ${String(id+1).padStart(2,'0')} · HOÀN THÀNH`,
      `<div class="album-page"><span class="album-symbol">${itemSymbols[id]}</span><h3>${esc(chapter.item)}</h3><p>${esc(chapter.title)}</p></div><p class="panel-subtitle" style="margin-top:20px">${id===4?'20/10 không phải là điểm kết thúc của hành trình này. Đây chỉ là một ngày đặc biệt trong câu chuyện mà anh vẫn muốn viết tiếp cùng em.':'Vật phẩm này đã được thêm vào album. Bạn có thể quay lại bất cứ lúc nào.'}</p><div class="panel-actions"><button id="nextMemory" class="btn primary">${id===4?'Mở album ký ức':'Đi tiếp hành trình'} <span>→</span></button><button id="stayHere" class="btn secondary">Ở lại một chút</button></div>`,()=>{
        $('nextMemory').onclick=()=>{closePanel();id===4?openAlbum():travelToChapter(currentChapter());};$('stayHere').onclick=closePanel;
      });
  },
  onProgress({chapter,step}){progress.steps[chapter]=step;persist(true);},
  onClose(){runner.close();$('activityModal').hidden=true;stopMovement();persist(true);$('gameCanvas').focus({preventScroll:true});},
  onSound(name){audio.play(name);},
});
function launchChapter(id,replay=false){
  if(state.preview){notify('Đây là chế độ dạo chơi. Vào hành trình từ menu chính để mở các chương.');return;}
  if(!unlocked(id)){notify('Hãy hoàn thành kỷ niệm trước để mở chương này.');return;}
  closePanel();stopMovement();$('activityModal').hidden=false;
  audio.start(id);runner.open(id,replay?0:Math.max(0,Number(progress.steps[id])||0));
}

async function travelTo(x,y,area=state.area){
  if(transitioning)return;transitioning=true;stopMovement();closePanel();$('fadeLayer').classList.add('active');
  await new Promise(r=>setTimeout(r,settings.reducedMotion?0:280));
  state.area=area;Object.assign(state.player,safePosition(x,y));Object.assign(state.companion,{x:state.player.x+30,y:state.player.y-18,moving:false});
  updateHud();persist(true);$('fadeLayer').classList.remove('active');transitioning=false;$('gameCanvas').focus({preventScroll:true});
}
function travelToChapter(id){
  const obj=WORLD.objects.find(o=>o.id===objectForChapter[id]);
  if(obj)travelTo(obj.x,obj.y+50,'garden').then(()=>{state.nearest=obj;updateInteraction();notify(`${CHAPTERS[id].title} · Nhấn E hoặc chạm nút tương tác.`);});
}

function openChapters(includeMap=false){
  const maps=includeMap?`<div class="map-preview">${Object.entries(areaNames).map(([id,name],i)=>`<button class="area-tile ${state.area===id?'active':''}" data-area="${id}"><span class="area-symbol">${['✿','♧','≈'][i]}</span>${name}</button>`).join('')}</div><div class="section-label">Những trang trong hành trình</div>`:'';
  const cards=CHAPTERS.map((chapter,i)=>{
    const locked=!unlocked(i),done=progress.completed.includes(i);
    return `<article class="chapter-tile ${locked?'locked':''}"><span class="tile-number">CHƯƠNG ${String(i+1).padStart(2,'0')}</span><span class="tile-status">${locked?'♧':done?'✓':'✳'}</span><h3>${esc(chapter.title)}</h3><p>${esc(chapter.subtitle||chapter.description)}</p><button class="btn ${locked?'secondary':'primary'}" data-chapter="${i}" ${locked?'disabled':''}>${locked?'Chưa mở khóa':done?'Ghé lại ký ức':'Đến địa điểm'} ${locked?'':'→'}</button></article>`;
  }).join('');
  openPanel(includeMap?'Đi đâu cùng nhau?':'Những chương ký ức',includeMap?'BẢN ĐỒ THẾ GIỚI':'HÀNH TRÌNH CỦA CHÚNG MÌNH',`<p class="panel-subtitle">${state.preview?'Bạn đang dạo chơi tự do. Các kỷ niệm mở lần lượt trong chế độ hành trình.':'Mỗi kỷ niệm mở ra một trang mới. Chơi lại chương đã mở không làm mất tiến trình.'}</p>${maps}<div class="chapter-grid">${cards}</div>`,()=>{
    document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{
      const id=Number(b.dataset.chapter);
      if(state.mode==='home')begin(false,false);
      if(progress.completed.includes(id))launchChapter(id,true);
      else if(state.preview)notify('Về menu chính và bắt đầu hành trình để chơi các chương.');
      else travelToChapter(id);
    });
    document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{
      if(state.mode==='home')begin(true);
      travelTo(WORLD.spawn.x,WORLD.spawn.y,b.dataset.area);
    });
  });
}

function openAlbum(){
  const shared=story.data.dialogues?.personal?.photos;
  const photos=[...(Array.isArray(shared)?shared:[]),...readPhotos().filter(x=>typeof x==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(x))];
  let group=null;try{const raw=localStorage.getItem('lovequest.photo.v1');group=raw?.startsWith('data:')?raw:JSON.parse(raw);}catch{}
  if(group?.startsWith('data:image/png;base64,'))photos.unshift(group);
  const pages=CHAPTERS.map((chapter,i)=>`<article class="album-page ${progress.album.includes(i)?'':'locked'}"><span class="album-symbol">${progress.album.includes(i)?itemSymbols[i]:'✧'}</span><h3>${progress.album.includes(i)?esc(chapter.item):'Trang đang chờ'}</h3><p>${esc(chapter.title)}</p>${progress.album.includes(i)?`<button class="text-button" data-replay="${i}">Ghé lại ký ức →</button>`:''}</article>`).join('');
  openPanel('Những điều mình giữ lại','ALBUM KÝ ỨC',`<p class="panel-subtitle">Một bó hoa, một tin nhắn, một tấm ảnh. Những điều nhỏ bé làm nên câu chuyện của chúng mình.</p><div class="album-grid">${pages}</div><div class="section-label">Góc ảnh của hai người</div>${photos.length?`<div class="photo-grid">${photos.map((src,i)=>`<img src="${esc(src)}" alt="Ảnh kỷ niệm ${i+1}" loading="lazy">`).join('')}</div>`:'<p class="panel-note">Chưa có ảnh thật. Bạn có thể thêm những bức ảnh của riêng mình bên dưới.</p>'}<label class="photo-upload" style="margin-top:20px">Thêm ảnh từ thiết bị · chỉ lưu trong trình duyệt này, không tải lên mạng.<input id="photoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><p class="panel-note">Tối đa 4 ảnh cá nhân. Bản lưu game không chứa ảnh; ảnh không đồng bộ giữa thiết bị.</p>`,()=>{
    document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{if(state.mode==='home')begin(false);launchChapter(Number(b.dataset.replay),true);});
    $('photoInput').onchange=async event=>{
      try {
        const files=[...event.target.files].slice(0,4),existing=readPhotos();
        for(const file of files){
          if(!['image/jpeg','image/png','image/webp'].includes(file.type))continue;
          const image=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1000/Math.max(image.width,image.height));
          canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();existing.push(canvas.toDataURL('image/jpeg',0.78));
        }
        if(!writePhotos(existing.slice(-4)))throw new Error('storage');
        openAlbum();notify('Đã thêm ảnh vào album riêng trên thiết bị này.');
      }catch{notify('Chưa lưu được ảnh. Hãy chọn ảnh nhỏ hơn hoặc giải phóng bộ nhớ trình duyệt.');}
    };
  });
}

function openSettings(){
  openPanel('Một chút theo ý bạn','CÀI ĐẶT',`<p class="panel-subtitle">Một thế giới vừa vặn với bạn. Mọi thay đổi được lưu trên thiết bị này.</p>
    <div class="settings-row"><label for="femaleName">Tên nhân vật nữ<small>Tóc đen, kính tròn · 158 cm</small></label><input class="name-input" id="femaleName" maxlength="20" value="${esc(progress.names.female)}"></div>
    <div class="settings-row"><label for="maleName">Tên nhân vật nam<small>Tóc đen, áo xanh sage</small></label><input class="name-input" id="maleName" maxlength="20" value="${esc(progress.names.male)}"></div>
    <div class="settings-row"><label>Nhạc nền<small>Giai điệu nhẹ theo từng chương</small></label><button id="musicToggle" class="switch ${settings.music?'on':''}">${settings.music?'Đang bật':'Đang tắt'}</button></div>
    <div class="settings-row"><label for="volumeInput">Âm lượng<small>Âm thanh được tạo trực tiếp, không tải nhạc ngoài</small></label><input id="volumeInput" type="range" min="0" max="1" step="0.05" value="${settings.volume}" aria-label="Âm lượng"></div>
    <div class="settings-row"><label for="qualityInput">Đồ họa<small>Chế độ nhẹ giảm số hạt và hiệu ứng</small></label><select id="qualityInput"><option value="high" ${settings.quality==='high'?'selected':''}>Nhiều chi tiết</option><option value="low" ${settings.quality==='low'?'selected':''}>Nhẹ nhàng</option></select></div>
    <div class="settings-row"><label for="daylightInput">Thời gian trong ngày<small>Chỉ thay đổi ánh sáng, không khóa nội dung</small></label><select id="daylightInput">${Object.entries(daylightNames).map(([id,n])=>`<option value="${id}" ${settings.daylight===id?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="settings-row"><label>Giảm chuyển động<small>Giảm hạt bay và các chuyển cảnh</small></label><button id="motionToggle" class="switch ${settings.reducedMotion?'on':''}">${settings.reducedMotion?'Đang bật':'Đang tắt'}</button></div>
    <div class="panel-actions"><button id="saveNow" class="btn primary">Lưu hành trình</button><button id="exportSave" class="btn secondary">Xuất bản lưu</button><label class="btn secondary" for="importSave">Nhập bản lưu</label><input id="importSave" type="file" accept="application/json,.json" hidden><button id="toHome" class="btn secondary">Về menu chính</button></div><p class="panel-note">Game tự lưu sau mỗi mini-game và khi di chuyển. Dữ liệu được tách riêng với bản Love Quest cũ. Ảnh và lời thư cá nhân chỉ lưu trên thiết bị hiện tại.</p>`,()=>{
    const saveNames=()=>{progress.names.female=$('femaleName').value.trim()||'Em';progress.names.male=$('maleName').value.trim()||'Anh';if(hasSave)saveProgress(progress);updateHud();};
    $('femaleName').onchange=$('maleName').onchange=saveNames;
    $('musicToggle').onclick=()=>{audio.toggle();writeSettings(settings);openSettings();updateSound();};
    $('volumeInput').oninput=e=>{settings.volume=Number(e.target.value);writeSettings(settings);};
    $('qualityInput').onchange=e=>{settings.quality=e.target.value;writeSettings(settings);};
    $('daylightInput').onchange=e=>{settings.daylight=e.target.value;writeSettings(settings);updateHud();};
    $('motionToggle').onclick=()=>{settings.reducedMotion=!settings.reducedMotion;writeSettings(settings);openSettings();};
    $('saveNow').onclick=()=>{saveNames();if(state.mode==='playing'&&!state.preview){persist(true);notify('Đã lưu hành trình.');}else notify('Bắt đầu hoặc tiếp tục hành trình để lưu tiến trình.');};
    $('exportSave').onclick=()=>{if(state.mode==='playing')persist();download('love-quest-ban-luu.json',JSON.stringify(progress,null,2),'application/json');};
    $('importSave').onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.completed)||data.completed.some((n,i)=>n!==i)||data.completed.length>5||Object.entries(data.steps||{}).some(([id,step])=>!Number.isInteger(Number(id))||Number(id)<0||Number(id)>4||!Number.isInteger(step)||step<0||step>[2,3,3,3,2][Number(id)]))throw new Error('invalid');
        const previous=progress;progress={...freshProgress(),...data};if(!saveProgress(progress)){progress=previous;throw new Error('storage');}
        progress=loadProgress()||previous;hasSave=true;begin(false);notify('Đã mở bản lưu của bạn.');
      }catch{notify('Tệp bản lưu không hợp lệ hoặc không thể lưu trên thiết bị.');}
    };
    $('toHome').onclick=home;
  });
}
function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function openHelp(){openPanel('Cứ thong thả khám phá','MỘT VÀI CHỈ DẪN',`<p class="panel-subtitle">Không có giới hạn thời gian. Mọi kỷ niệm đều có thể thử lại.</p><div class="help-grid"><div class="help-card"><strong>Trên máy tính</strong><p>WASD / phím mũi tên để đi.<br>E hoặc Enter để tương tác.<br>C để đổi nhân vật.<br>Esc để tạm dừng hoặc đóng menu.<br>Nhấp vào mặt đất để đi tới.</p></div><div class="help-card"><strong>Trên điện thoại</strong><p>Giữ các phím điều hướng ở góc trái.<br>Chạm nút ✦ để tương tác.<br>Hoặc chạm mặt đất để đi tới.<br>Nút “Đến địa điểm” giúp bạn tìm đường.<br>Chơi được cả màn hình dọc và ngang.</p></div></div><div class="inline-message">Mỗi chương mở khóa một vật phẩm trong album. Sau bốn kỷ niệm, món quà 20/10 sẽ đợi bạn. Chọn “Dạo chơi tự do” ở menu chính để ngắm thế giới mà không thay đổi bản lưu.</div><p class="panel-note">Các lời tỏ tình, tên địa điểm và thư riêng chưa được cung cấp không được xem là lời kể thật. Bạn có thể bổ sung nội dung cá nhân trong chương cuối và các tệp story/.</p>`);}

function nearestObject(){let best=null,bestDistance=78;for(const object of WORLD.objects){const d=Math.hypot(object.x-state.player.x,object.y-state.player.y);if(d<bestDistance){best=object;bestDistance=d;}}return best;}
function updateInteraction(){
  const obj=state.nearest;
  $('interactPrompt').hidden=!obj||isModal()||state.mode!=='playing';
  if(obj)$('interactLabel').textContent=obj.label||'Khám phá';
}
function interact(){
  if(state.mode!=='playing'||isModal())return;
  const obj=state.nearest||nearestObject();if(!obj){notify('Lại gần một địa điểm có dấu ✦ để tương tác.');return;}
  audio.play();
  const id=objectForChapter.indexOf(obj.id);
  if(id>=0){
    if(state.preview){openPanel(obj.label||CHAPTERS[id].title,'MỘT GÓC TRONG THẾ GIỚI',`<p class="panel-subtitle">${esc(CHAPTERS[id].description||CHAPTERS[id].subtitle)}</p><div class="inline-message">Bạn đang dạo chơi tự do. Các chương kỷ niệm được mở lần lượt trong hành trình.</div><div class="panel-actions"><button id="startFromPreview" class="btn primary">${hasSave?'Tiếp tục hành trình':'Bắt đầu hành trình'}</button></div>`,()=>$('startFromPreview').onclick=()=>begin(false,!hasSave));}
    else launchChapter(id,progress.completed.includes(id));return;
  }
  if(obj.id.startsWith('portal')){
    const area=obj.id==='portalForest'?'forest':obj.id==='portalLake'?'lake':'garden';
    travelTo(WORLD.spawn.x,WORLD.spawn.y,area);notify(areaNames[area]);return;
  }
  if(obj.id==='cat')notify('Mèo nhỏ khẽ dụi đầu vào bạn. Một buổi dạo chơi thật yên bình.');
  else notify('Một góc nhỏ để dừng chân. Hãy thử đổi ánh sáng để ngắm thêm một chút.');
}

function canStand(x,y){
  if(x<20||y<25||x>WORLD.width-20||y>WORLD.height-20)return false;
  return !(WORLD.solids||[]).some(r=>x+8>r.x&&x-8<r.x+r.w&&y>r.y&&y-10<r.y+r.h);
}
function updateMovement(dt){
  if(state.mode!=='playing'||isModal()||state.locked||transitioning){state.player.moving=false;state.companion.moving=false;return;}
  let dx=Number(keys.has('d')||keys.has('arrowright')||held.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||held.has('left'));
  let dy=Number(keys.has('s')||keys.has('arrowdown')||held.has('down'))-Number(keys.has('w')||keys.has('arrowup')||held.has('up'));
  if(dx||dy)state.target=null;
  else if(state.target){const x=state.target.x-state.player.x,y=state.target.y-state.player.y,d=Math.hypot(x,y);if(d<5)state.target=null;else{dx=x/d;dy=y/d;}}
  const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
  const speed=(keys.has('shift')?145:110)*dt,old={x:state.player.x,y:state.player.y};
  if(canStand(state.player.x+dx*speed,state.player.y))state.player.x+=dx*speed;
  if(canStand(state.player.x,state.player.y+dy*speed))state.player.y+=dy*speed;
  state.player.moving=Math.hypot(state.player.x-old.x,state.player.y-old.y)>.05;
  if(len>0)state.player.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
  if(state.target&&!state.player.moving)state.target=null;
  const cx=state.player.x-state.companion.x,cy=state.player.y-state.companion.y,d=Math.hypot(cx,cy);
  state.companion.moving=d>44;
  if(d>44){const step=Math.min(d-38,100*dt),nx=state.companion.x+cx/d*step,ny=state.companion.y+cy/d*step;if(canStand(nx,ny)){state.companion.x=nx;state.companion.y=ny;}else if(d>170){state.companion.x=state.player.x-25;state.companion.y=state.player.y+15;}state.companion.direction=Math.abs(cx)>Math.abs(cy)?cx>0?'right':'left':cy>0?'down':'up';}
  state.nearest=nearestObject();updateInteraction();
}
function switchCharacter(){
  if(state.mode!=='playing'||isModal())return;
  state.player.character=state.player.character==='female'?'male':'female';state.companion.character=state.player.character==='female'?'male':'female';updateHud();persist(true);audio.play();
}
function drawAvatars(){
  for(const [id,character] of [['femaleAvatar','female'],['maleAvatar','male']]){
    const canvas=$(id),ctx=canvas.getContext('2d');ctx.clearRect(0,0,60,72);ctx.imageSmoothingEnabled=false;
    drawCharacter(ctx,30,67,{character,direction:'down',moving:false,time:0,scale:1.45});
  }
}

$('startNew').onclick=confirmNew;$('continueBtn').onclick=()=>begin(false);$('previewBtn').onclick=()=>begin(true);
$('homeBtn').onclick=()=>state.mode==='home'?null:home();$('closePanel').onclick=closePanel;
$('albumBtn').onclick=openAlbum;$('settingsBtn').onclick=openSettings;$('mapBtn').onclick=()=>openChapters(true);$('chaptersBtn').onclick=()=>openChapters();$('helpBtn').onclick=openHelp;
$('guideBtn').onclick=()=>state.preview?openChapters(true):progress.completed.length===5?openAlbum():travelToChapter(currentChapter());
$('interactPrompt').onclick=$('touchInteract').onclick=interact;$('switchCharacter').onclick=switchCharacter;
$('soundBtn').onclick=()=>{audio.toggle();writeSettings(settings);updateSound();};
$('timeBtn').onclick=()=>{const options=Object.keys(daylightNames);settings.daylight=options[(options.indexOf(settings.daylight)+1)%options.length];writeSettings(settings);updateHud();};
$('panelModal').onclick=e=>{if(e.target===$('panelModal'))closePanel();};
$('gameCanvas').addEventListener('pointerdown',e=>{
  if(state.mode!=='playing'||isModal()||e.button>0)return;
  state.target=renderer.screenToWorld(e.clientX,e.clientY);audio.unlock();
});
document.querySelectorAll('.dpad button').forEach(button=>{
  const release=()=>{held.delete(button.dataset.dir);button.classList.remove('pressed');};
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(button.dataset.dir);button.classList.add('pressed');state.target=null;audio.unlock();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
});
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(isModal()){
    if(key==='escape'){e.preventDefault();if(!$('activityModal').hidden){runner.close();$('activityModal').hidden=true;persist(true);}else closePanel();return;}
    if(key==='tab'){
      const parent=$('activityModal').hidden?$('panelModal'):$('activityModal');
      const elements=[...parent.querySelectorAll('button:not(:disabled),input:not([hidden]),textarea,select,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(first&&((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last))){e.preventDefault();(e.shiftKey?last:first).focus();}
    }
    return;
  }
  if(state.mode!=='playing')return;
  if(['input','textarea','select'].includes(document.activeElement.tagName.toLowerCase()))return;
  if(key==='escape'){e.preventDefault();openSettings();return;}
  if(key==='c'){e.preventDefault();switchCharacter();return;}
  if(['enter',' '].includes(key)&&document.activeElement.closest('button,a,[role="button"]'))return;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(['e','enter',' '].includes(key)){if(!e.repeat)interact();return;}
  keys.add(key);audio.unlock();
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{stopMovement();persist();audio.stop();});
window.addEventListener('focus',()=>{if(settings.music&&state.mode==='playing')audio.start(currentChapter());});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMovement();persist();audio.stop();}else if(settings.music&&state.mode==='playing')audio.start(currentChapter());});
window.addEventListener('pagehide',()=>persist());window.addEventListener('resize',()=>renderer.resize());

const story=new StoryEngine({
  dialogue:async event=>{
    const data=story.data.dialogues;
    const line=Array.isArray(data)?data.find(d=>d.id===event.id):data[event.id];
    if(line?.text)notify(line.text);
  },
  area:async event=>travelTo(event.x||WORLD.spawn.x,event.y||WORLD.spawn.y,event.area||'garden'),
  fade:async event=>{$('fadeLayer').classList.toggle('active',!!event.visible);},
  camera:event=>event.release?renderer.releaseFocus():renderer.focus(event),
  move:async event=>{Object.assign(state.player,safePosition(event.x,event.y));},
  animation:async event=>{state.player.direction=event.direction||state.player.direction;},
});
story.addEventListener('lock',()=>{state.locked=true;});story.addEventListener('unlock',()=>{state.locked=false;});
// A small public content API for future chapters, without coupling story to rendering.
window.loveQuest={story,getProgress:()=>structuredClone(progress),getWorld:()=>({player:{...state.player},area:state.area,mode:state.mode,preview:state.preview}),version:'1.0.0'};

let previous=performance.now(),frames=0,fpsAt=previous,lastFps=60;
function frame(now){
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(!document.hidden){
    state.time+=settings.reducedMotion?dt*.15:dt;updateMovement(dt);
    renderer.render({...state,daylight:settings.daylight,quality:settings.reducedMotion?'low':settings.quality,reducedMotion:settings.reducedMotion,activeObject:state.nearest,paused:isModal()},dt);
    if(state.mode==='playing'&&!state.preview&&now-autosaveAt>10000){persist();autosaveAt=now;}
    if(++frames&&now-fpsAt>=1000){lastFps=Math.round(frames*1000/(now-fpsAt));frames=0;fpsAt=now;}
  }
  requestAnimationFrame(frame);
}

try{
  renderer.resize();drawAvatars();updateHud();
  await story.load();
  $('loadingMessage').hidden=true;
  requestAnimationFrame(frame);
}catch(error){
  console.error(error);$('loadingMessage').textContent='Chưa tải được thế giới. Hãy tải lại trang khi kết nối ổn định.';
}
