// usage: node render.js <outdir> [t1 t2 ...]   (no times = all frames, 30 fps, 8.7 s)
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{
  const [out,...ts]=process.argv.slice(2); fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  await p.goto('file://'+__dirname+'/../templates/motion-overlay.html'); await p.evaluate(()=>window.init()); await p.waitForTimeout(400);
  const jobs=ts.length?ts.map(Number):Array.from({length:261},(_,i)=>i/30);
  for(let i=0;i<jobs.length;i++){
    await p.evaluate(t=>window.render(t),jobs[i]);
    const name=ts.length?`t_${jobs[i].toFixed(2)}.png`:String(i).padStart(4,'0')+'.png';
    await p.screenshot({path:`${out}/${name}`,omitBackground:true});
  }
  await b.close();
})();
