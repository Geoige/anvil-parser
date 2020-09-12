var anvilToNbt = {};

var SECTOR = 4096;

anvilToNbt.getNbts = function (mcaRaw) {
	var mca = new Uint8Array(mcaRaw);
	var nbts = [];

	var offsets = [];
	for (let i = 0; i < SECTOR; i+=4) {
		var slice = new Uint8Array([0, ...mca.slice(i, i + 3)]);
		var offset = new DataView(slice.buffer).getUint32() * SECTOR;
		var chunkSize = new DataView(mca.buffer).getUint8(i + 3) * SECTOR;
		offsets.push(offset);
		if (offset === 0 && chunkSize === 0) continue;

		var nbt = anvilToNbt._getNbt(mca, offset);
		nbts.push(nbt);
	}

	return nbts;
};

anvilToNbt._getNbt = function (mca, offset) {
	var length = new DataView(new Uint8Array(mca.slice(offset, offset + 4)).buffer).getUint32();
	var compression = mca[offset + 4];
	if (compression !== 2) throw new Error('Invalid compression type');
	var dataOffset = offset + 5;
	var rem = length % SECTOR;
	var padding = (rem) ? SECTOR - (rem) : 0;
	var compressedData = new Uint8Array(mca.slice(dataOffset, dataOffset + length + padding));
	return compressedData;
};