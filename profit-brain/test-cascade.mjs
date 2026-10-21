const testWindsurfCascade = async () => {
  console.log('=== TEST 1: GET FAST CONTEXT PINS ===');
  const res1 = await fetch('http://localhost:3000/api/profit/cascade/pins');
  const data1 = await res1.json();
  console.log('Pins count:', data1.pins?.length);
  console.log('Pinned items:', data1.pins?.map(p => `${p.label} (${p.path})`));

  console.log('\n=== TEST 2: ADD NEW CONTEXT PIN ===');
  const res2 = await fetch('http://localhost:3000/api/profit/cascade/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label: 'Soul Gun Armory DAG Matrix',
      path: 'WORKBENCH_COMPLETE/workbench/src/components/SoulGunArmoryTab.tsx',
      type: 'file'
    })
  });
  const data2 = await res2.json();
  console.log('Added Pin:', data2.success, data2.pin?.label);

  console.log('\n=== TEST 3: EXECUTE CASCADE FLOW STEP ===');
  const res3 = await fetch('http://localhost:3000/api/profit/cascade/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Synthesize Fast Context pin memory with Profit copilot execution loop.',
      model: 'auto/best-coding'
    })
  });
  const data3 = await res3.json();
  console.log('Cascade step success:', data3.success);
  console.log('Active Pins in Step:', data3.activePins);
  console.log('Cascade Task Title:', data3.task?.title);
  console.log('Cascade Reply Preview:\n', data3.reply ? data3.reply.slice(0, 300) + '...' : 'No response');
};

testWindsurfCascade();
