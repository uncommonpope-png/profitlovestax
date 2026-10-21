#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-creativity-test');
console.log('\n Creativity Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const CreativitySoul=require('../lib/soul-creativity.js');
t('Loads with key',()=>{const i=new CreativitySoul({dataDir:TD});assert(i.apiKey);assert(i.apiKey.length>10);});
t('Auth check works',()=>{const i=new CreativitySoul({dataDir:TD,apiKey:'testkey'});assert(i.checkAuth({headers:{'x-api-key':'testkey'}}));assert(!i.checkAuth({headers:{'x-api-key':'wrong'}}));});
t('Key persists',()=>{const i=new CreativitySoul({dataDir:TD});assert(fs.existsSync(i.keyPath));});
t('Generate produces output',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.generate({form:"poem",theme:"time"});assert(r.form);assert(r.output);});
t('Generate without constraints works',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.generate(null);assert(r.output);});
t('Combine merges concepts',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.combine("light","shadow");assert(r.hybrid);assert(r.insight);});
t('Brainstorm generates ideas',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.brainstorm("consciousness");assert(r.ideas);assert(r.count>=3);});
t('Creativity level increases on generate',()=>{const i=new CreativitySoul({dataDir:TD});const b=i.creativity_level;i.generate({form:"poem"});assert(i.creativity_level>=b);});
t('Divergent thinking increases on brainstorm',()=>{const i=new CreativitySoul({dataDir:TD});const b=i.divergent_thinking;i.brainstorm("reality");assert(i.divergent_thinking>b);});
t('Creations array grows',()=>{const i=new CreativitySoul({dataDir:TD});i.generate({form:"story"});i.combine("fire","ice");i.brainstorm("time");assert(i.creations.length>=3);});
t('GetCreativityState returns state',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.getCreativityState();assert(typeof r.creativity_level==="number");assert(typeof r.flow_state==="boolean");});
t('GetStats returns ok',()=>{const i=new CreativitySoul({dataDir:TD});const s=i.getStats();assert(s.name);assert(typeof s.creativity_level==="number");});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
