
// engine/aj-stockfish.js — hardened for Netlify and slow inits
(function(){
  if (window.AJStockfish) return;

  function uniq(a){return Array.from(new Set(a.filter(Boolean)));}
  function candidates(){
    const hint = window.AJ_SF_URL;
    const list = [];
    if (hint) list.push(hint);
    list.push('/engine/stockfish.js','engine/stockfish.js','./engine/stockfish.js','../engine/stockfish.js');
    return uniq(list);
  }

  class SF {
    constructor(){
      this.worker=null;
      this.ready=false;
      this.usedUrl=null;
      this._boot();
    }
    _post(s){ try{ this.worker && this.worker.postMessage(s); } catch(e){} }
    _onMsg=(e)=>{ const s=String(e.data||''); if(s==='readyok') this.ready=true; };
    _try(u){
      try{
        const w=new Worker(u);
        this.worker=w; this.usedUrl=u;
        w.onmessage=this._onMsg;
        w.postMessage('uci'); w.postMessage('isready');
        return true;
      }catch(e){
        console.warn('[AJStockfish] Worker failed for', u, e);
        return false;
      }
    }
    _boot(){
      const urls=candidates(); window.__AJ_STOCKFISH_URLS=urls.slice();
      for(const u of urls){ if(this._try(u)){ setTimeout(()=>{},0); return; } }
      console.error('[AJStockfish] Ninguna ruta funcionó. Probadas:', urls);
    }
    isReady(){ return !!this.ready; }
    async bestMove(fen,opts={}){
      const mt=Math.max(200, opts.movetime|0 || 900);
      const start=Date.now();
      while(!this.ready && Date.now()-start<6000){ await new Promise(r=>setTimeout(r,80)); }
      if(!this.ready) throw new Error('Stockfish no ready. url='+this.usedUrl+' cand='+(window.__AJ_STOCKFISH_URLS||[]).join(', '));
      this._post('ucinewgame');
      this._post('position fen '+fen);
      return await new Promise((resolve,reject)=>{
        let solved=false;
        const on=(e)=>{
          const s=String(e.data||'');
          if(s.startsWith('bestmove')){
            const parts=s.split(/\s+/); const bm=parts[1]||'';
            solved=true; this.worker.removeEventListener('message', on);
            resolve({uci: bm});
          }
        };
        this.worker.addEventListener('message', on);
        this._post('go movetime '+mt);
        setTimeout(()=>{ if(!solved){ this.worker.removeEventListener('message', on); reject(new Error('Timeout esperando bestmove')); } }, mt+2500);
      });
    }
  }
  window.AJStockfish = new SF();
})();
