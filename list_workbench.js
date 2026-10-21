import fs from 'fs';

const zipPath = 'C:\\Users\\uncom\\Downloads\\BUYaSOUL-Workbench-v1.0.0.zip';
const buf = fs.readFileSync(zipPath);

// Parse ZIP central directory
const eocd = buf.lastIndexOf('PK\x05\x06');
if (eocd !== -1) {
  const numEntries = buf.readUInt16LE(eocd + 10);
  const centralDirOffset = buf.readUInt32LE(eocd + 16);
  
  let offset = centralDirOffset;
  for (let i = 0; i < numEntries; i++) {
    const entryNameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const entryName = buf.slice(offset + 46, offset + 46 + entryNameLen).toString('utf8');
    console.log(`[${i}] ${entryName}`);
    
    offset += 46 + entryNameLen + extraLen + commentLen;
  }
}
