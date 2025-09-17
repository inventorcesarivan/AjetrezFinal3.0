
// engine/aj-oraculo.js — z-index high, diagnostics, absolute worker path
(function(){
  const d=document;
  function $(s,r){return (r||d).querySelector(s);}
  function vis(){ try{return window.buildVisible(window.board, window.offsets);}catch(_){return null;} }
  function isClassic(){ try{ return Array.isArray(window.offsets)&&window.offsets.every(x=>(x|0)===0); }catch(_){ return false; } }
  function toast(msg, ms=2600){
    let el=d.getElementById('sf-toast');
    if(!el){ el=d.createElement('div'); el.id='sf-toast';
      Object.assign(el.style,{position:'fixed',left:'50%',top:'12px',transform:'translateX(-50%)',background:'#111',color:'#fff',padding:'8px 12px',borderRadius:'12px',zIndex:2147483646,fontWeight:'800',border:'2px solid #fff',maxWidth:'92vw'});
      d.body.appendChild(el);
    }
    el.textContent=msg; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',ms);
  }
  function sendToReplayer(uci){ try{ const ta=d.getElementById('regv2-input'); if(ta) ta.value=uci; const btn=d.getElementById('regv2-sendto'); if(btn) btn.click(); }catch(_){ } }
  function addBtn(){
    if($('#aj-sf-btn')) return;
    const b=d.createElement('button'); b.id='aj-sf-btn'; b.textContent='SF · Oráculo';
    Object.assign(b.style,{position:'fixed',right:'10px',bottom:'10px',zIndex:2147483646,background:'#fff',border:'2px solid #111',borderRadius:'999px',padding:'10px 14px',fontWeight:'900',cursor:'pointer',boxShadow:'0 6px 16px rgba(0,0,0,.35)'});
    b.onclick=async ()=>{
      try{
        // Load loader if needed
        if(!window.AJStockfish){
          const s=d.createElement('script'); s.src='/engine/aj-stockfish.js';
          await new Promise((res,rej)=>{ s.onload=res; s.onerror=()=>{ s.src='engine/aj-stockfish.js'; s.onload=res; s.onerror=rej; d.head.appendChild(s); }; d.head.appendChild(s); });
        }
        const t0=Date.now();
        while((!window.AJStockfish || !window.AJStockfish.isReady()) && (Date.now()-t0)<6000){
          await new Promise(r=>setTimeout(r,80));
        }
        if(!window.AJStockfish || !window.AJStockfish.isReady()){
          const tried=(window.__AJ_STOCKFISH_URLS||[]).join(', ');
          toast('Stockfish no cargado. Probado: '+tried+'  • Espera 1s y reintenta');
          return;
        }
        if(!isClassic()){ toast('Solo en tablero 8×8 clásico'); return; }
        const v=vis(); if(!v){ toast('No pude leer el tablero'); return; }
        // Build FEN (simple)
        const map={K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'}; const rows=[];
        for(let r=0;r<8;r++){ let row='',e=0; for(let c=0;c<8;c++){ const q=v[r][c]; if(!q||!q.type||q.type==='.') e++; else{ if(e){row+=e; e=0;} let ch=map[q.type]||'?'; if(q.color==='b') ch=ch.toLowerCase(); row+=ch; } } if(e) row+=e; rows.push(row); }
        const side=(window.turn==='b')?'b':'w'; const fen=`${rows.join('/') } ${side} - - 0 1`;
        const {uci}=await window.AJStockfish.bestMove(fen,{movetime:900});
        if(!uci) return toast('Sin jugada');
        toast('SF: '+uci+'  • worker: '+(window.AJStockfish.usedUrl||'?'));
        sendToReplayer(uci);
      }catch(e){ console.error(e); toast('Error al pedir jugada'); }
    };
    d.body.appendChild(b);
  }
  function boot(){ window.AJ_SF_URL = '/engine/stockfish.js'; addBtn(); }
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
