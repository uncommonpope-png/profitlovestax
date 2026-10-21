const nestedJSON = JSON.stringify({
    tool: 'edit_file',
    args: {
        path: 'test.js',
        new_string: 'function greet() {\n  return {msg: "hello"};\n}\nfunction farewell() {\n  return "bye";\n}'
    }
});
console.log('JSON length:', nestedJSON.length);
console.log('JSON:', nestedJSON);
console.log('---');
const regex = /\{.*?\}/;
const m = nestedJSON.match(regex);
console.log('lazy match:', m ? m[0] : 'no match');
console.log('lazy match length:', m ? m[0].length : 0);
console.log('full json length:', nestedJSON.length);
console.log('match is same as full?', m && m[0].length === nestedJSON.length ? 'YES (truncation did NOT happen)' : 'NO (truncation DID happen)');
