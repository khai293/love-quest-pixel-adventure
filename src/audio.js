// Original, gently synthesized music: no external audio or autoplay downloads.
export class GardenAudio {
  constructor(settings) { this.settings=settings; this.ctx=null; this.timer=null; this.beat=0; this.chapter=0; }
  unlock() {
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
    } catch { /* Audio is optional on browsers without Web Audio. */ }
  }
  note(freq,duration=0.5,volume=0.08,type='sine',offset=0) {
    if (!this.ctx || !this.settings.music) return;
    const t=this.ctx.currentTime+offset,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,t);
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(volume*this.settings.volume,t+0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001,t+duration);
    osc.connect(gain);gain.connect(this.ctx.destination);osc.start(t);osc.stop(t+duration+0.05);
  }
  play(name='tap') {
    this.unlock();
    const notes=name==='complete'?[523.25,659.25,783.99]:name==='error'?[293.66]:[659.25];
    notes.forEach((n,i)=>this.note(n,0.38,0.09,'sine',i*0.13));
  }
  start(chapter=0) {
    this.stop();this.chapter=chapter;this.unlock();
    if (!this.settings.music || !this.ctx) return;
    const melodies=[[0,4,7,11,7,4,2,7],[0,7,4,9,7,4,2,4],[4,7,12,11,9,7,4,2],[0,3,7,10,7,5,3,2],[0,4,7,12,11,7,9,4]];
    const step=()=>{
      if (document.hidden) return;
      const seq=melodies[this.chapter%5],n=seq[this.beat%seq.length];
      this.note(261.63*Math.pow(2,n/12),1.1,0.055);
      if(this.beat%4===0) this.note(130.81,2.2,0.035,'triangle');
      this.beat++;
    };
    step();this.timer=setInterval(step,this.chapter===3?640:520);
  }
  stop() { if(this.timer)clearInterval(this.timer);this.timer=null; }
  toggle() { this.settings.music=!this.settings.music;this.settings.music?this.start(this.chapter):this.stop();return this.settings.music; }
}
