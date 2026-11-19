const {chromium}=require('playwright');
const [,,html,outdir,dur,fps,only,mode]=process.argv;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
 await pg.goto('file://'+html); await pg.evaluate(()=>document.fonts.ready);
 if(mode){await pg.addStyleTag({content:(mode.includes('green')?'html,body{background:#00FF00!important}.panel{background:#fff!important;box-shadow:none!important}#subs .box{background:#141414!important}#subs,#end .s{text-shadow:none!important}':'')+(mode.includes('subs')?'.panel,#end{display:none!important}':'')+(mode.includes('gfx')?'#subs{display:none!important}':'')});}
 const N=Math.round(dur*fps); const list=only?only.split(',').map(Number):[...Array(N).keys()];
 for(const i of list){await pg.evaluate(t=>render(t),i/fps);
  await pg.screenshot({path:`${outdir}/${String(i).padStart(4,'0')}.png`,omitBackground:!(mode||'').includes('green')});}
 await b.close();})();
