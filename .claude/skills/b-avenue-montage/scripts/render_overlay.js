// node render_overlay.js preview <html> <src.mp4> <outdir> t1 t2 ...
// node render_overlay.js build   <html> <src.mp4> <out.mp4> <fps> <seconds> [crf]
const {chromium}=require('playwright'); const {spawn,spawnSync}=require('child_process'); const fs=require('fs'),path=require('path');
const [mode,html,src,out,...rest]=process.argv.slice(2);
const FILT=`[0:v:0]format=yuv420p[b];[1:v]scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[o];[b][o]overlay=0:0:format=auto,format=yuv420p[v]`;
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  await p.goto('file://'+path.resolve(html)); await p.evaluate(()=>window.init()); await p.waitForTimeout(400);
  const shot=async t=>{await p.evaluate(x=>window.render(x),t);return p.screenshot({omitBackground:true,type:'png'});};
  if(mode==='preview'){ fs.mkdirSync(out,{recursive:true});
    for(const ts of rest){const t=+ts; const png=path.join(out,`ov_${ts}.png`); fs.writeFileSync(png,await shot(t));
      spawnSync('ffmpeg',['-v','error','-y','-ss',String(t),'-i',src,'-i',png,'-filter_complex',FILT.replace('[1:v]','[1:v]')+';[v]scale=360:-1[s]','-map','[s]','-frames:v','1',path.join(out,`pv_${ts}.jpg`)]);}
  } else {
    const [fps,secs,crf='20']=rest; const n=Math.round(+fps*+secs);
    const ff=spawn('ffmpeg',['-v','error','-y','-i',src,'-f','image2pipe','-framerate',fps,'-c:v','png','-i','-','-filter_complex',FILT,'-map','[v]','-map','0:a:0','-c:v','libx264','-crf',crf,'-preset','medium','-r',fps,
      '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','copy','-movflags','+faststart','-t',String(secs),out],{stdio:['pipe','inherit','inherit']});
    for(let i=0;i<n;i++){const buf=await shot(i/ +fps); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); if(i%300===0) console.error('frame',i,'/',n);}
    ff.stdin.end(); await new Promise(r=>ff.on('close',r));
  }
  await b.close();
})();
