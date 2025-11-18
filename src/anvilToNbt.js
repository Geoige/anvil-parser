const anvilToNbt = {}

const SECTOR = 4096

anvilToNbt.getNbts = function (mcaRaw) {
	const mca = new Uint8Array(mcaRaw)
	const nbts = []
	if (mca.byteLength === 0) return nbts

	for (let i = 0; i < SECTOR; i+=4) {
		const slice = new Uint8Array([0, ...mca.slice(i, i + 3)])
		const offset = new DataView(slice.buffer).getUint32() * SECTOR
		const chunkSize = new DataView(mca.buffer).getUint8(i + 3) * SECTOR
		if (offset === 0 && chunkSize === 0) continue
		const length = new DataView(new Uint8Array(mca.slice(offset, offset + 4)).buffer).getUint32() - 1
		const compression = mca[offset + 4]
		if (compression !== 2) throw new Error('Invalid compression type')
		const dataOffset = offset + 5
		const compressedData = new Uint8Array(mca.slice(dataOffset, dataOffset + length))
		const nbt = pako.inflate(compressedData)
		nbts.push(nbt)
	}

	return nbts
}