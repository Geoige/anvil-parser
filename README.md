# anvil-parser
Minecraft Anvil file parser in JS

## Usage
Get NBTs from an Anvil file ArrayBuffer
```
var nbts = anvilToNbt.getNbts(mca)
```
Parse NBT (requires pako.js in scope)
```
var parser = new nbtParser.NBTParser();
var result = parser.parse(nbt);
```
Using with FileReader
```
var reader = new FileReader();
reader.onload = function(e) {
  var nbts = anvilToNbt.getNbts(reader.result);
  var parser = new nbtParser.NBTParser();
  var result = parser.parse(nbts[0]);
  console.log(result);
};

reader.readAsArrayBuffer(file);
```
