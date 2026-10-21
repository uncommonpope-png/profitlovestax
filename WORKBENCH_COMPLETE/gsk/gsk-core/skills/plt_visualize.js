'use strict';

module.exports.MANIFEST = {
    name: 'plt_visualize',
    description: 'Generate PLT Profit/Love/Tax visualization - Sankey diagram, radar chart, value triangles',
    version: '1.0.0',
    inputs: { profit: 'number', love: 'number', tax: 'number', format: 'string', size: 'string' },
    output: { schema: 'visualization' }
};

const PLT_AFFINITY = { profit: 0.8, love: 0.1, tax: 0.1 };

async function skill_plt_visualize(input, brain, memory) {
    var profit = Number(input.profit) || 0.5;
    var love = Number(input.love) || 0.3;
    var tax = Number(input.tax) || 0.2;
    var format = input.format || 'sankey';
    var size = input.size || 'md';
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'plt_visualize', weight: 0.7 });
    }
    
    if (format === 'sankey') {
        var width = size === 'lg' ? 600 : size === 'sm' ? 300 : 400;
        var html = '<div class="plt-sankey" style="width:' + width + 'px;height:' + width + 'px;border:1px solid #333;">' +
            '<svg viewBox="0 0 ' + width + ' ' + width + '" style="width:100%;height:100%;">' +
            '<defs>' +
            '<linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#ffd166"/>' +
            '<stop offset="100%" stop-color="#ffaa00"/>' +
            '</linearGradient>' +
            '<linearGradient id="lGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#ff6b9d"/>' +
            '<stop offset="100%" stop-color="#ff3d81"/>' +
            '</linearGradient>' +
            '<linearGradient id="tGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#5aa9ff"/>' +
            '<stop offset="100%" stop-color="#2d7dff"/>' +
            '</linearGradient>' +
            '</defs>' +
            '<text x="20" y="30" font-size="12" fill="#fff">PLT Flow</text>' +
            '<rect x="20" y="50" width="80" height="160" fill="url(#pGrad)" opacity="0.8"/>' +
            '<text x="30" y="220" font-size="10" fill="#fff">P: ' + profit.toFixed(2) + '</text>' +
            '<rect x="120" y="50" width="80" height="160" fill="url(#lGrad)" opacity="0.8"/>' +
            '<text x="130" y="220" font-size="10" fill="#fff">L: ' + love.toFixed(2) + '</text>' +
            '<rect x="220" y="50" width="80" height="160" fill="url(#tGrad)" opacity="0.8"/>' +
            '<text x="230" y="220" font-size="10" fill="#fff">T: ' + tax.toFixed(2) + '</text>' +
            '<line x1="120" y1="210" x2="220" y2="60" stroke="#fff" stroke-width="2" marker-end="url(#arrow)"/>' +
            '<line x1="220" y1="210" x2="120" y2="60" stroke="#fff" stroke-width="2" marker-start="url(#arrow)"/>' +
            '<text x="175" y="40" font-size="14" fill="#0f0" text-anchor="middle">TRUE VALUE = ' + (profit + love - tax).toFixed(2) + '</text>' +
            '</svg></div>' +
            '<style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} .plt-sankey{animation:pulse 2s infinite}</style>';
        return { skill: 'plt_visualize', success: true, format: 'sankey', html: html };
    }
    
    if (format === 'radar') {
        var radarHtml = '<div class="plt-radar" style="width:' + (size === 'lg' ? 300 : size === 'sm' ? 150 : 200) + 'px;height:' + (size === 'lg' ? 300 : size === 'sm' ? 150 : 200) + 'px;">' +
            '<canvas id="pltRadar" width="' + (size === 'lg' ? 300 : size === 'sm' ? 150 : 200) + '" height="' + (size === 'lg' ? 300 : size === 'sm' ? 150 : 200) + '"></canvas>' +
            '<script>var ctx = document.getElementById(\'pltRadar\').getContext(\'2d\');' +
            'var centerX = ctx.canvas.width/2, centerY = ctx.canvas.height/2;' +
            'var maxVal = 1; // PLT scaled to 1' +
            'function drawRadar(points, color, label){' +
            'ctx.beginPath(); ctx.moveTo(centerX, centerY);' +
            'points.forEach(function(p, i){ var a = (i/points.length)*Math.PI*2 - Math.PI/2; ctx.lineTo(centerX+p.x*Math.cos(a), centerY+p.y*Math.sin(a)); });' +
            'ctx.closePath(); ctx.fillStyle = color+"\'+(0.3);' + (1 - tax.toFixed(2)); // True value = P+L-T" +
            'ctx.fill(); ctx.stroke();' +
            'ctx.fillStyle = "#fff"; ctx.font="10px Arial"; ctx.fillText(label, centerX, centerY-60);' +
            '}' +
            'var p = [{x:0,y:0},{x:' + profit + ',y:0},{x:1,y:' + love + '},{x:0,y:1},{x:0,y:0}];' +
            'drawRadar(p, "#ffd166", "P+L-T="+(profit+love-tax).toFixed(2));' +
            '</script></div>';
        return { skill: 'plt_visualize', success: true, format: 'radar', html: radarHtml };
    }
    
    return { skill: 'plt_visualize', success: false, error: 'Unknown format: ' + format };
}

module.exports = { skill_plt_visualize, PLT_AFFINITY };