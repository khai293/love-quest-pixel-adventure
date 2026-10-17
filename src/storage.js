export const SAVE_KEY = 'lovequest.our-story.v1';
export const SETTINGS_KEY = 'lovequest.preferences.v1';
export const PHOTO_KEY = 'lovequest.personal-photos.v1';

export function freshProgress() {
  return {version:1, chapter:0, completed:[], steps:{}, album:[], player:{x:790,y:800,character:'female'}, area:'garden', names:{female:'Em',male:'Anh'}, started:false, updatedAt:null};
}

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!raw || raw.version !== 1) return null;
    const data = {...freshProgress(), ...raw};
    const valid = new Set((Array.isArray(raw.completed) ? raw.completed : []).filter(n => Number.isInteger(n) && n >= 0 && n < 5));
    data.completed = [];
    for(let n=0;n<5&&valid.has(n);n++)data.completed.push(n);
    data.chapter = Math.min(data.completed.length,4);
    data.steps = {};
    [2,3,3,3,2].forEach((max,id)=>{const step=raw.steps?.[id];if(Number.isInteger(step)&&step>=0&&step<=max)data.steps[id]=step;});
    data.album = (Array.isArray(raw.album) ? raw.album : []).filter(n=>data.completed.includes(n));
    data.player = {...freshProgress().player, ...raw.player};
    if (!Number.isFinite(data.player.x) || !Number.isFinite(data.player.y)) data.player = freshProgress().player;
    data.player.character = data.player.character === 'male' ? 'male' : 'female';
    data.names = {...freshProgress().names,...raw.names};
    data.area = ['garden','forest','lake'].includes(data.area) ? data.area : 'garden';
    return data;
  } catch { return null; }
}

export function saveProgress(progress) {
  const data = {...progress,updatedAt:new Date().toISOString()};
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(data)); return true; }
  catch { return false; }
}

export function readSettings() {
  const defaults = {volume:0.35,music:true,quality:'high',daylight:'morning',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
  try { return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')}; } catch { return defaults; }
}

export function writeSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); return true; } catch { return false; }
}

export function readPhotos() {
  try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]'); } catch { return []; }
}

export function writePhotos(photos) {
  try { localStorage.setItem(PHOTO_KEY,JSON.stringify(photos)); return true; } catch { return false; }
}
