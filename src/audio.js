// User-supplied instrumental track, with small synthesized interaction sounds.
const MUSIC_URL = new URL('../assets/audio/noi-nay-co-anh-instrumental.mp3', import.meta.url);

export class GardenAudio extends EventTarget {
  constructor(settings) {
    super();
    this.settings = settings;
    this.ctx = null;
    this.chapter = 0;
    this.requestedPlayback = false;
    this.pendingPlay = null;
    this.track = document.getElementById('backgroundMusic') || new Audio();
    this.track.src = MUSIC_URL.href;
    this.track.loop = true;
    this.track.preload = 'none';
    this.track.setAttribute('playsinline', '');
    this.setVolume(settings.volume);
    this.track.addEventListener('error', () => {
      if (this.requestedPlayback && this.settings.music) {
        this.dispatchEvent(new CustomEvent('playbackerror', {detail: 'load'}));
      }
    });
  }

  unlock() {
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch { /* The MP3 still works when optional Web Audio effects are unavailable. */ }
    // A new trusted tap/key can retry playback if an earlier automatic resume was blocked.
    if (this.requestedPlayback && this.settings.music) this._playTrack();
  }

  _playTrack() {
    if (this.pendingPlay || !this.track.paused || document.hidden) return;
    try {
      const attempt = this.track.play();
      this.pendingPlay = attempt;
      attempt.then(() => {
        if (!this.requestedPlayback || !this.settings.music || document.hidden) this.track.pause();
      }).catch(error => {
        if (this.pendingPlay !== attempt || !this.requestedPlayback || !this.settings.music || error.name === 'AbortError') return;
        this.dispatchEvent(new CustomEvent('playbackerror', {detail: error.name === 'NotAllowedError' ? 'gesture' : 'load'}));
      }).finally(() => {
        if (this.pendingPlay === attempt) this.pendingPlay = null;
      });
    } catch {
      this.dispatchEvent(new CustomEvent('playbackerror', {detail: 'load'}));
    }
  }

  setVolume(value) {
    const number = Number(value);
    this.settings.volume = Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0.35;
    this.track.volume = this.settings.volume;
  }

  note(freq, duration = 0.5, volume = 0.08, type = 'sine', offset = 0) {
    if (!this.ctx || !this.settings.music || this.settings.volume <= 0) return;
    const t = this.ctx.currentTime + offset, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume * this.settings.volume, t + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  play(name = 'tap') {
    this.unlock();
    const notes = name === 'complete' ? [523.25, 659.25, 783.99] : name === 'error' ? [293.66] : [659.25];
    notes.forEach((note, i) => this.note(note, 0.38, 0.09, 'sine', i * 0.13));
  }

  start(chapter = 0) {
    this.chapter = chapter;
    this.setVolume(this.settings.volume);
    this.requestedPlayback = Boolean(this.settings.music);
    if (!this.requestedPlayback) return this.stop();
    // Do not seek or restart the song when moving between chapters or returning to the tab.
    this.unlock();
  }

  stop() {
    this.requestedPlayback = false;
    this.pendingPlay = null;
    this.track.pause();
  }

  toggle() {
    this.settings.music = !this.settings.music;
    this.settings.music ? this.start(this.chapter) : this.stop();
    return this.settings.music;
  }
}
