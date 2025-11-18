# anvil-parser
Minecraft Anvil file and NBT parser in JS

## Usage
Get NBTs from an Anvil file ArrayBuffer (requires pako.js in scope):
```
var nbts = anvilToNbt.getNbts(mca)
```
Parse NBT:
```
var parser = new nbtParser.NBTParser();
var result = parser.parse(nbt);
```

A working example is provided [here](./example/index.html).

## License
MIT [LICENSE](./LICENSE)