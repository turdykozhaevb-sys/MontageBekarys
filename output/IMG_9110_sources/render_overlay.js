const {chromium}=require('playwright');
const [,,html,outdir,dur,fps,only]=process.argv;
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
 await pg.goto('file://'+html); await pg.evaluate(()=>document.fonts.ready);
 const N=Math.round(dur*fps); const list=only?only.split(',').map(Number):[...Array(N).keys()];
 for(const i of list){await pg.evaluate(t=>render(t),i/fps);
  await pg.screenshot({path:`${outdir}/${String(i).padStart(4,'0')}.png`,omitBackground:true});}
 await b.close();})();
