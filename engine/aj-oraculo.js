
// engine/aj-oraculo.js (improved)
(function(){
  const d=document;
  function $(s,r){ return (r||d).querySelector(s); }
  function vis(){ try{return window.buildVisible(window.board, window.offsets);}catch(_){return null;} }
  function isClassic(){ try{ return Array.isArray(window.offsets) && window.offsets.every(x=>(x|0)===0); }catch(_){ return false; } }
  function toast(msg, ms=2200){
    let el=d.getElementById('sf-toast');
    if(!el){ el=d.createElement('div'); el.id='sf-toast'; Object.assign(el.style,{
      position:'fixed',left:'50%',top:'10px',transform:'translateX(-50%)',background:'#111',color:'#fff',padding:'8px 12px',borderRadius:'12px',zIndex:2147483601,fontWeight:'800'
    }); d.body.appendChild(el);}
    el.textContent=msg; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',ms);
  }
  function alg(r,c){ return String.fromCharCode(97+c)+(8-r); }
  function castle(v){
    try{
      let r='-';
      const wk=v[7].findIndex(q=>q&&q.type==='K'&&q.color==='w');
      const bk=v[0].findIndex(q=>q&&q.type==='K'&&q.color==='b');
      if(wk>=0){ if(v[7][7]&&v[7][7].type==='R') r=(r==='-')?'K':r+'K'; if(v[7][0]&&v[7][0].type==='R') r=(r==='-')?'Q':r+'Q'; }
      if(bk>=0){ if(v[0][7]&&v[0][7].type==='R') r=(r==='-')?'k':r+'k'; if(v[0][0]&&v[0][0].type==='R') r=(r==='-')?'q':r+'q'; }
      return r==='-'?'-':r;
    }catch(_){return '-';}
  }
  function ep(){ try{ const e=window.epTarget; return (e&&typeof e.r==='number')? (String.fromCharCode(97+e.c)+(8-e.r)):'-'; }catch(_){return '-';} }
  function fenFromVisible(v){
    const map={K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'};
    const rows=[];
    for(let r=0;r<8;r++){
      let row='', empty=0;
      for(let c=0;c<8;c++){
        const q=v[r][c];
        if(!q||!q.type||q.type==='.') empty++;
        else{
          if(empty){ row+=empty; empty=0; }
          let ch=map[q.type]||'?'; if(q.color==='b') ch=ch.toLowerCase(); row+=ch;
        }
      }
      if(empty) row+=empty;
      rows.push(row);
    }
    const side=(window.turn==='b')?'b':'w';
    return `${rows.join('/') } ${side} ${castle(v)} ${ep()} 0 1`;
  }
  function sendToReplayer(uci){
    try{
      const ta=d.getElementById('regv2-input'); if(ta) ta.value=uci;
      const btn=d.getElementById('regv2-sendto'); if(btn) btn.click();
    }catch(_){}
  }
  function addBtn(){
    if($('#aj-sf-btn')) return;
    const b=d.createElement('button'); b.id='aj-sf-btn'; b.textContent='SF · Oráculo';
    Object.assign(b.style,{position:'fixed',right:'10px',bottom:'10px',zIndex:2147483600,background:'#fff',border:'2px solid #111',borderRadius:'999px',padding:'10px 14px',fontWeight:'900',cursor:'pointer'});
    b.onclick=async ()=>{
      try{
        // Espera activa (hasta 3s) por readyok si el usuario hace clic muy rápido
        if(!window.AJStockfish){
          toast('Cargando Stockfish...'); await new Promise(r=>setTimeout(r,350));
        }
        const t0=Date.now();
        while((!window.AJStockfish || !window.AJStockfish.isReady()) && (Date.now()-t0)<3000){
          await new Promise(r=>setTimeout(r,100));
        }
        if(!window.AJStockfish || !window.AJStockfish.isReady()){
          toast('Stockfish no cargado. Revisa la ruta: engine/stockfish.js o window.AJ_SF_URL');
          return;
        }
        if(!isClassic()){ toast('Solo en tablero 8×8 clásico'); return; }
        const v=vis(); if(!v){ toast('No pude leer el tablero'); return; }
        const fen=fenFromVisible(v);
        const {uci}=await window.AJStockfish.bestMove(fen,{movetime:800});
        if(!uci) return toast('Sin jugada');
        toast('SF: '+uci); sendToReplayer(uci);
      }catch(e){ console.error(e); toast('Error'); }
    };
    d.body.appendChild(b);
  }
  function boot(){
    if(!window.AJStockfish){
      const s=d.createElement('script'); s.src='engine/aj-stockfish.js'; s.onload=addBtn; s.onerror=()=>console.warn('No se pudo cargar aj-stockfish.js'); d.head.appendChild(s);
    }else addBtn();
  }
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
