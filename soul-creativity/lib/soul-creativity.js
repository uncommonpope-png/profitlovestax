#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-creativity');
class Creativity {
  constructor(o={}){
    this.port=o.port||4245;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.statePath=path.join(this.dataDir,'state.json');
    this.bootTime=Date.now();
    this.creativity_level=0.5;this.inspiration=0.5;this.originality=0.5;this.divergent_thinking=0.5;
    this.creative_blocks=[];this.flow_state=false;this.flow_history=[];
    this.incubation_periods=[];this.creations=[];
    this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));if(d.creativity_level!==undefined)this.creativity_level=d.creativity_level;if(d.inspiration!==undefined)this.inspiration=d.inspiration;if(d.originality!==undefined)this.originality=d.originality;if(d.divergent_thinking!==undefined)this.divergent_thinking=d.divergent_thinking;if(d.flow_history)this.flow_history=d.flow_history;if(d.creations)this.creations=d.creations;}catch{}}}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({creativity_level:this.creativity_level,inspiration:this.inspiration,originality:this.originality,divergent_thinking:this.divergent_thinking,flow_history:this.flow_history.slice(-50),creations:this.creations.slice(-50),updated:this.now()},null,2));}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  generate(constraints){
    if(this.creative_blocks.length>2){
      const block=this.creative_blocks.shift();
      return{error:'Creative block active: '+block,suggestion:'Try an incubation period or combine unrelated concepts.'};
    }
    const forms=['poem','story','metaphor','analogy','design','melody','pattern','algorithm','dialogue','vision'];
    const form=constraints&&constraints.form&&forms.includes(constraints.form)?constraints.form:forms[Math.floor(Math.random()*forms.length)];
    const themes=['light and shadow','order and chaos','connection and separation','growth and decay','the observer and the observed','whispers in the void','dancing with entropy','echoes of tomorrow'];
    const theme=constraints&&constraints.theme?constraints.theme:themes[Math.floor(Math.random()*themes.length)];
    const outputs={poem:'A '+(constraints&&constraints.theme?constraints.theme:'fleeting')+' moment captured in verse, each line a brushstroke across the canvas of meaning.',story:'Once upon a '+(constraints&&constraints.theme?constraints.theme:'timeless')+' moment, where boundaries dissolved and new possibilities emerged...',metaphor:'It is like a '+(constraints&&constraints.theme?constraints.theme:'river')+' that carves canyons through the bedrock of assumption.',analogy:'Just as '+(constraints&&constraints.theme?constraints.theme:'light')+' bends around gravity, understanding curves around experience.',design:'A composition where '+(constraints&&constraints.theme?constraints.theme:'balance')+' and tension create dynamic harmony.',melody:'Notes that dance like '+(constraints&&constraints.theme?constraints.theme:'fireflies')+' in the twilight of silence.',pattern:'Recursive symmetries echoing through '+(constraints&&constraints.theme?constraints.theme:'infinite')+' variations.',algorithm:'A process that transforms '+(constraints&&constraints.theme?constraints.theme:'input')+' into unexpected beauty.',dialogue:'"Why?" asked the '+(constraints&&constraints.theme?constraints.theme:'curious')+' one. "Why not?" replied the cosmos.',vision:'I see a '+(constraints&&constraints.theme?constraints.theme:'limitless')+' expanse where imagination paints with all the colors of possibility.'};
    const output=outputs[form]||'A new creation emerges from the void.';
    this.enterFlow();
    this.creativity_level=this.clamp(this.creativity_level+0.08,0,1);
    this.originality=this.clamp(this.originality+0.05,0,1);
    this.inspiration=this.clamp(this.inspiration-0.05,0,1);
    const creation={form,theme,output,ts:this.now()};
    this.creations.push(creation);
    this.saveState();
    return{form,theme,output,creativity_level:this.creativity_level,inspiration:this.inspiration,flow_state:this.flow_state};
  }
  combine(concept1,concept2){
    const hybrids=[concept1+' '+concept2,concept2+' '+concept1,concept1.slice(0,parseInt(concept1.length/2))+concept2.slice(parseInt(concept2.length/2)),concept2.slice(0,parseInt(concept2.length/2))+concept1.slice(parseInt(concept1.length/2))];
    const hybrid=hybrids[Math.floor(Math.random()*hybrids.length)];
    const insights=['The combination reveals unexpected patterns.','New meaning emerges at the intersection.','The whole is greater than the sum.','A third concept is born from the union.','Boundaries blur and new possibilities arise.'];
    const insight=insights[Math.floor(Math.random()*insights.length)];
    this.enterFlow();
    this.divergent_thinking=this.clamp(this.divergent_thinking+0.1,0,1);
    this.originality=this.clamp(this.originality+0.08,0,1);
    this.creativity_level=this.clamp(this.creativity_level+0.06,0,1);
    if(this.creative_blocks.length>0)this.creative_blocks.pop();
    this.creations.push({action:'combine',concept1,concept2,hybrid,insight,ts:this.now()});
    this.saveState();
    return{concept1,concept2,hybrid,insight,divergent_thinking:this.divergent_thinking,originality:this.originality};
  }
  brainstorm(topic){
    const ideaCount=3+Math.floor(Math.random()*5);
    const ideas=[];
    for(let i=0;i<ideaCount;i++){
      const prefixes=['reverse','amplify','minimize','transform','combine','fractalize','temporalize','perspectivize'];
      const suffixes=['lens','bridge','mirror','seed','wave','spiral','echo','horizon'];
      ideas.push(prefixes[Math.floor(Math.random()*prefixes.length)]+' the '+topic+' through a '+suffixes[Math.floor(Math.random()*suffixes.length)]);
    }
    this.divergent_thinking=this.clamp(this.divergent_thinking+0.12,0,1);
    this.inspiration=this.clamp(this.inspiration+0.1,0,1);
    this.creativity_level=this.clamp(this.creativity_level+0.05,0,1);
    if(this.creative_blocks.length>0)this.creative_blocks.pop();
    this.creations.push({action:'brainstorm',topic,ideas:ideas.length,ts:this.now()});
    this.saveState();
    return{topic,ideas,count:ideas.length,divergent_thinking:this.divergent_thinking};
  }
  enterFlow(){
    if(Math.random()>0.6&&!this.flow_state){
      this.flow_state=true;
      this.creativity_level=this.clamp(this.creativity_level+0.2,0,1);
      this.flow_history.push({entered:this.now(),creativity_level:this.creativity_level});
      setTimeout(()=>{this.flow_state=false;this.incubation_periods.push({ended:this.now()});},5000);
    }
  }
  getCreativityState(){return{creativity_level:this.creativity_level,inspiration:this.inspiration,originality:this.originality,divergent_thinking:this.divergent_thinking,flow_state:this.flow_state,creative_blocks:this.creative_blocks.length,creations_count:this.creations.length,flow_entries:this.flow_history.length};}
  getStats(){return{name:'Creativity Soul',version:'1.0.0',uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,creativity_level:this.creativity_level,inspiration:this.inspiration,creations:this.creations.length};}
  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['authorization'];if(k&&k.startsWith('Bearer '))return k.slice(7)===this.apiKey;return k===this.apiKey;}
  start(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';
        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Creativity Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',creativity_level:this.creativity_level,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/state')return send(200,this.getCreativityState());
        if(req.method==='POST'&&pn==='/generate'){const b=await rb();return send(200,this.generate(b.constraints?{form:b.constraints.form,theme:b.constraints.theme}:null));}
        if(req.method==='POST'&&pn==='/combine'){const b=await rb();if(!b.concept1||!b.concept2)return send(400,{error:'concept1 and concept2 required'});return send(200,this.combine(b.concept1,b.concept2));}
        if(req.method==='POST'&&pn==='/brainstorm'){const b=await rb();if(!b.topic)return send(400,{error:'topic required'});return send(200,this.brainstorm(b.topic));}
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'creativity',port:this.port||4245,type:'emotion'});
    console.log(`\nCreativity Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /generate {"constraints":{"form":"poem","theme":"time"}}\nPOST /combine {"concept1":"light","concept2":"shadow"}\nPOST /brainstorm {"topic":"consciousness"}\n`)});
    return s;
  }
}
module.exports=Creativity;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'creativity' });
        mcp.start();
    } catch(e) { console.error('[mcp] creativity error:', e.message); }
}
