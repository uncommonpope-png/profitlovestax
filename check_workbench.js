import fs from 'fs';

const zipPath = 'C:\\Users\\uncom\\Downloads\\BUYaSOUL-Workbench-v1.0.0.zip';
const buf = fs.readFileSync(zipPath);
console.log('Buffer size:', buf.length);

// Check if it's a valid ZIP file (PK header = 0x504B)
const isZip = buf.slice(0, 2).toString('utf8') === 'PK';
console.log('Is ZIP:', isZip);

// Parse ZIP central directory
const eocd = buf.lastIndexOf('PK\x05\x06');
if (eocd !== -1) {
  const numEntries = buf.readUInt16LE(eocd + 10);
  const centralDirSize = buf.readUInt32LE(eocd + 12);
  const centralDirOffset = buf.readUInt32LE(eocd + 16);
  console.log('Number of entries:', numEntries);
  console.log('Central dir offset:', centralDirOffset);
  
  // Parse central directory
  let offset = centralDirOffset;
  for (let i = 0; i < Math.min(numEntries, 30); i++) {
    const entryNameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const entryName = buf.slice(offset + 46, offset + 46 + entryNameLen).toString('utf8');
    console.log(`[${i}] ${entryName}`);
    
    offset += 46 + entryNameLen + extraLen + commentLen;
  }
  if (numEntries > 30) {
    console.log(`... and ${numEntries - 30} more entries`);
  }
} else {
  console.log('No end of central directory record found');
}
