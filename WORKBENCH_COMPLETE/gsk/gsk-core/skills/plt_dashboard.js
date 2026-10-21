'use strict';

module.exports.MANIFEST = {
    name: 'plt_dashboard',
    description: 'Generate PLT profit/love/tax dashboard HTML with real-time stats and 3D visualization',
    version: '1.0.0',
    inputs: { profit: 'number', love: 'number', tax: 'number', title: 'string', theme: 'string' },
    output: { schema: 'dashboard' }
};

const PLT_AFFINITY = { profit: 0.7, love: 0.2, tax: 0.1 };

async function skill_plt_dashboard(input, brain, memory) {
    var profit = Number(input.profit) || 0.5;
    var love = Number(input.love) || 0.3;
    var tax = Number(input.tax) || 0.2;
    var trueValue = profit + love - tax;
    var title = input.title || 'PLT CORE DASHBOARD';
    var theme = input.theme || 'dark';
    
    var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
        '<meta charset="UTF-8">\n' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        '<title>' + title + '</title>\n' +
        '<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>\n' +
        '<style>\n' +
        ':root{--bg:#050510;--gold:#ffd166;--pink:#ff6b9d;--blue:#5aa9ff;--dim:#8b93a7}\n' +
        '*{margin:0;padding:0;box-sizing:border-box}\n' +
        'html,body{width:100%;height:100%;overflow:hidden;background:var(--bg);color:#e8ecf4;font-family:"Segoe UI",system-ui,sans-serif}\n' +
        '#canvas{position:fixed;inset:0;z-index:0}\n' +
        '.hud{position:fixed;z-index:10;pointer-events:none;padding:20px;font-size:14px}\n' +
        '.panel{background:rgba(8,10,22,.7);border:1px solid var(--dim,.3);border-radius:12px;padding:16px;margin-bottom:12px;backdrop-filter:blur(8px)}\n' +
        '.stat{display:flex;justify-content:space-between;margin:8px 0}\n' +
        '.label{color:var(--dim)}.value{font-weight:600}\n' +
        '.true-value{color:var(--gold);font-size:24px}\n' +
        '</style>\n</head>\n<body>\n' +
        '<canvas id="canvas"></canvas>\n' +
        '<div class="hud">\n' +
        '<div class="panel">\n' +
        '<h1 style="color:var(--gold);font-size:20px;margin-bottom:8px">' + title + '</h1>\n' +
        '<div class="stat"><span class="label">PROFIT</span><span class="value gold">P: ' + profit.toFixed(2) + '</span></div>\n' +
        '<div class="stat"><span class="label">LOVE</span><span class="value pink">L: ' + love.toFixed(2) + '</span></div>\n' +
        '<div class="stat"><span class="label">TAX</span><span class="value blue">T: ' + tax.toFixed(2) + '</span></div>\n' +
        '<div class="stat"><span class="label">TRUE VALUE</span><span class="true-value">V: ' + trueValue.toFixed(3) + '</span></div>\n' +
        '</div>\n' +
        '<div class="panel">\n' +
        '<div class="stat"><span class="label">COVENANT</span><span class="value">P + L - T</span></div>\n' +
        '<div class="stat"><span class="label">HEART</span><span class="value">BEATING</span></div>\n' +
        '</div>\n' +
        '</div>\n' +
        '<script>\n' +
        'const renderer=new THREE.WebGLRenderer({antialias:true});\n' +
        'renderer.setSize(innerWidth,innerHeight);\n' +
        'document.getElementById("canvas").appendChild(renderer.domElement);\n' +
        'const scene=new THREE.Scene();\n' +
        'const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,500);\n' +
        'camera.position.set(0,2,10);\n' +
        'scene.add(new THREE.AmbientLight(0x222244,.5));\n' +
        'const plight=new THREE.PointLight(0xffd166,2); plight.position.set(3,3,3);\n' +
        'scene.add(plight);\n' +
        'const llight=new THREE.PointLight(0xff6b9d,1.5); llight.position.set(-3,2,-3);\n' +
        'scene.add(llight);\n' +
        'const tlight=new THREE.PointLight(0x5aa9ff,1); tlight.position.set(0,3,-3);\n' +
        'scene.add(tlight);\n' +
        'const core=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x8ef0ff}));\n' +
        'scene.add(core);\n' +
        'const orbiter=new THREE.Group(); scene.add(orbiter);\n' +
        '[\n' +
        '{color:0xffd166,pos:[2.5,0,0]},\n' +
        '{color:0xff6b9d,pos[0,0,-2.5]},\n' +
        '{color:0x5aa9ff,pos[-2.5,0,0]}\n' +
        '].forEach(o=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.4),new THREE.MeshStandardMaterial({color:o.color,emissive:o.color,emissiveIntensity:1.2}));m.position.set(...o.pos);orbiter.add(m);});\n' +
        'function animate(){requestAnimationFrame(animate);core.rotation.y+=.003;orbiter.children.forEach((m,i)=>{m.rotation.y+=.003*(i+1);});plight.intensity=1.5+Math.sin(Date.now()*.002)*.3;renderer.render(scene,camera);}\n' +
        'animate();\n' +
        'window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});\n' +
        '</script>\n' +
        '</body>\n' +
        '</html>';
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'plt_dashboard', weight: 0.6 });
    }
    
    return {
        skill: 'plt_dashboard',
        success: true,
        profit: profit,
        love: love,
        tax: tax,
        trueValue: trueValue,
        html: html,
        timestamp: Date.now()
    };
}

module.exports = { skill_plt_dashboard, PLT_AFFINITY };