import { useState } from 'react';

export function useToast() {
  const [list, setList] = useState([]);
  
  const add = (msg, type="ok") => {
    const id = Date.now() + Math.random();
    setList(l => [...l, {id, msg, type}]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 3800);
  };
  
  return { list, ok: m => add(m, "ok"), err: m => add(m, "err") };
}