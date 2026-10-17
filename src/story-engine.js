// Small data-driven event runner. Personal dialogue lives in story/*.json.
// Unknown personal content remains empty; no fictional memories are inserted.
export class StoryEngine extends EventTarget {
  constructor(actions={}) { super();this.actions=actions;this.data={};this.cancelled=false;this.flags={}; }
  async load() {
    const names=['chapters','dialogues','characters','events','quests'];
    await Promise.all(names.map(async name=>{
      const response=await fetch(new URL(`../story/${name}.json`,import.meta.url));
      if(!response.ok)throw new Error(`Không tải được dữ liệu ${name}`);
      this.data[name]=await response.json();
    }));
    return this.data;
  }
  available(event,progress) {
    return (event.requires||[]).every(key=>this.flags[key] || (progress.completed||[]).includes(key));
  }
  async run(timeline=[]) {
    this.cancelled=false;
    this.dispatchEvent(new Event('lock'));
    try {
      for(const event of timeline) {
        if(this.cancelled)break;
        if(event.type==='wait')await new Promise(r=>setTimeout(r,Math.min(event.ms||0,10000)));
        else if(event.type==='flag')this.flags[event.key]=event.value??true;
        else if(this.actions[event.type])await this.actions[event.type](event);
        this.dispatchEvent(new CustomEvent('event',{detail:event}));
      }
    } finally { this.dispatchEvent(new Event('unlock')); }
  }
  cancel(){this.cancelled=true;}
}
