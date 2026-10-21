import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

const zipPath = 'C:\\Users\\uncom\\Downloads\\BUYaSOUL-Workbench-v1.0.0.zip';
const outputDir = 'C:\\Users\\uncom\\Downloads\\BUYaSOUL-Workbench';
const buf = fs.readFileSync(zipPath);

// Parse ZIP entries and extract all files
const eocdOffset = buf.lastIndexOf('PK\x05\x06');
const numEntries = buf.readUInt16LE(eocdOffset + 10);
const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);

// Parse central directory to get file info
const files = [];
let offset = centralDirOffset;
for (let i = 0; i < numEntries; i++) {
  const compMethod = buf.readUInt16LE(offset + 10);
  const compSize = buf.readUInt32LE(offset + 20);
  const nameLen = buf.readUInt16LE(offset + 28);
  const extraLen = buf.readUInt16LE(offset + 30);
  const commentLen = buf.readUInt16LE(offset + 32);
  const localHeaderOffset = buf.readUInt32LE(offset + 42);
  const entryName = buf.slice(offset + 46, offset + 46 + nameLen).toString('utf8');
  
  files.push({
    name: entryName,
    compMethod: compMethod,
    compSize: compSize,
    localHeaderOffset: localHeaderOffset,
  });
  
  offset += 46 + nameLen + extraLen + commentLen;
}

// Extract each file
files.forEach(file => {
  const localOffset = file.localHeaderOffset;
  // Parse local file header
  const nameLen = buf.readUInt16LE(localOffset + 26);
  const extraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + nameLen + extraLen;
  const compData = buf.slice(dataStart, dataStart + file.compSize);
  
  let fileData;
  if (file.compMethod === 0) {
    // Stored (no compression)
    fileData = compData;
  } else if (file.compMethod === 8) {
    // Deflate
    fileData = zlib.inflateRawSync(compData);
  } else {
    console.log(`Unknown compression method ${file.compMethod} for ${file.name}`);
    return;
  }
  
  const outPath = path.join(outputDir, file.name);
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, fileData);
  console.log(`Extracted: ${file.name} (${fileData.length} bytes)`);
});

console.log('\nExtraction complete!');
