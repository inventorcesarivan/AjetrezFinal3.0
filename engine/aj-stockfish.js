
// engine/aj-stockfish.js
(function(){
  if (window.AJStockfish) return;
  class SF {
    constructor(url){
      this.url = url || (window.AJ_SF_URL || 'engine/stockfish.js');
      this.worker = null;
      this.ready = false;
      this._init();
    }
    _init(){
      try{
        this.worker = new Worker(this.url);
        this.worker.onmessage = (e)=> this._onMsg(String(e.data||''));
        this._post('uci'); this._post('isready');
      }catch(e){ console.error('[AJStockfish] Worker error', e); }
    }
    _post(cmd){ try{ this.worker.postMessage(cmd); }catch(e){ console.error(e);} }
    _onMsg(s){
      if (s==='uciok') return;
      if (s==='readyok'){ this.ready = true; return; }
      if (s.startsWith('bestmove')){
        const parts = s.split(/\s+/);
        const bm = parts[1]||'';
        if (this._resolve){ this._resolve({uci: bm}); this._resolve = null; }
      }
    }
    isReady(){ return this.ready; }
    async bestMove(fen, opts={}){
      const mt = opts.movetime || 800;
      const start = Date.now();
      while(!this.ready && Date.now()-start<1500) await new Promise(r=>setTimeout(r,50));
      this._post('ucinewgame');
      this._post('position fen '+fen);
      return await new Promise((resolve, reject)=>{
        this._resolve = resolve;
        this._post('go movetime '+mt);
        setTimeout(()=>{ if(this._resolve){ this._resolve=null; reject(new Error('timeout')); } }, mt+2000);
      });
    }
  }
  window.AJStockfish = new SF();
})();
