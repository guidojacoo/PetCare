// Manejo de cola de eventos offline
(function(){
  const BASE_URL = (typeof BACKEND_URL !== 'undefined') ? BACKEND_URL : 'http://localhost:3000';
  const STORAGE_KEY = 'event_queue';

  function readQueue(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(_){
      return [];
    }
  }

  function writeQueue(q){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); }catch(_){ }
  }

  function showToast(msg){
    let el = document.getElementById('net-toast');
    if(!el){
      el = document.createElement('div');
      el.id = 'net-toast';
      Object.assign(el.style, {
        position:'fixed', left:'50%', bottom:'20px', transform:'translateX(-50%)',
        background:'#333', color:'#fff', padding:'10px 20px', borderRadius:'6px',
        opacity:'0', transition:'opacity .3s', zIndex:'1000'
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(()=>{ el.style.opacity = '0'; }, 3000);
  }

  async function sendToBackend(ev){
    try{
      const res = await fetch(`${BASE_URL}/event`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(ev)
      });
      return res.ok;
    }catch(_){
      return false;
    }
  }

  async function flushQueue(){
    const queue = readQueue();
    if(queue.length === 0) return;
    const remaining = [];
    for(const ev of queue){
      const ok = await sendToBackend(ev);
      if(!ok) remaining.push(ev);
    }
    writeQueue(remaining);
  }

  async function registerEvent(mascota_id, horario_id){
    const ev = { mascota_id, horario_id, timestamp: Date.now() };
    const ok = await sendToBackend(ev);
    if(!ok){
      const q = readQueue();
      q.push(ev);
      writeQueue(q);
      showToast('Se enviará cuando vuelvas a estar online');
    }
  }

  document.addEventListener('DOMContentLoaded', flushQueue);
  window.registerEvent = registerEvent;
})();
