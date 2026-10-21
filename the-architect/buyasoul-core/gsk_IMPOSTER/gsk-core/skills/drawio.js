'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

function skill_drawio(input) {
    const action = input.action || 'create';
    const spec = typeof input === 'string' ? input : (input.spec || '');
    
    if (action === 'create') {
        return createDiagram(spec, input.type || 'flowchart');
    }
    
    if (action === 'export') {
        return exportDiagram(input.diagram_id || 'default', input.format || 'png');
    }
    
    return Promise.resolve({
        skill: 'drawio',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['create', 'export'],
        timestamp: Date.now(),
    });
}

async function createDiagram(spec, type) {
    const templates = {
        flowchart: generateFlowchartTemplate(),
        sequence: generateSequenceTemplate(),
        class: generateClassTemplate(),
        er: generateERTemplate(),
    };
    
    return {
        skill: 'drawio',
        plt_affinity: PLT_AFFINITY,
        action: 'create',
        type,
        spec,
        template: templates[type] || templates.flowchart,
        diagram_id: Math.random().toString(36).substring(2, 10),
        timestamp: Date.now(),
    };
}

function generateFlowchartTemplate() {
    return `<mxfile>
  <diagram name="Flowchart">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="Start" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="50" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="3" value="Process" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="130" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="4" value="End" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="200" y="210" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="5" value="" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
        <mxCell id="6" value="" edge="1" parent="1" source="3" target="4">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function generateSequenceTemplate() {
    return `<mxfile>
  <diagram name="Sequence">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="Actor1" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="100" y="50" width="30" height="60" as="geometry"/>
        </mxCell>
        <mxCell id="3" value="Actor2" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;" vertex="1" parent="1">
          <mxGeometry x="300" y="50" width="30" height="60" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function generateClassTemplate() {
    return `<mxfile>
  <diagram name="Class Diagram">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="ClassName&#xa;--&#xa;+attribute: String" style="rounded=0;whiteSpace=wrap;html=1;align=left;" vertex="1" parent="1">
          <mxGeometry x="200" y="50" width="150" height="60" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function generateERTemplate() {
    return `<mxfile>
  <diagram name="ER Diagram">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="Entity" style="shape=table;table=1;childLayout=tableLayout;fixedRows=1;rowSize=26;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="100" y="50" width="150" height="100" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

async function exportDiagram(diagramId, format) {
    return {
        skill: 'drawio',
        plt_affinity: PLT_AFFINITY,
        action: 'export',
        diagram_id: diagramId,
        format,
        output_path: `export_${diagramId}.${format}`,
        timestamp: Date.now(),
    };
}

module.exports = { skill_drawio };