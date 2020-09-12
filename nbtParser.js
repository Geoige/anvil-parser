var nbtParser = {};

var TAG_End = 0;
var TAG_Byte = 1;
var TAG_Short = 2;
var TAG_Int = 3;
var TAG_Long = 4;
var TAG_Float = 5;
var TAG_Double = 6;
var TAG_Byte_Array = 7;
var TAG_String = 8;
var TAG_List = 9;
var TAG_Compound = 10;
var TAG_Int_Array = 11;
var TAG_Long_Array = 12;

var TYPE_SUFFIXES = {
	1: 'b',
	4: 'L',
	5: 'F',
	6: 'D'
};

function NBTParser () {
	this._reset();
}

nbtParser.NBTParser = NBTParser;

NBTParser.prototype.parse = function (deflatedBuf, options) {
	this._reset();
	if (!options) options = {};
	var buf = pako.inflate(deflatedBuf);
	if (options.mode === 'arrayBuffer') return buf;
	this.bufView = new DataView(buf.buffer);
	var parsed = this._parse();
	if (options.mode === 'tags') return parsed;
	if (options.mode === 'snbt') {
		if (options.indentation) this.snbt.indentation = options.indentation;
		return this._getSnbt(parsed);
	}
	return this._removeTags(parsed, options);
};

NBTParser.prototype._reset = function () {
	this.i = 0;
	this.skipNextName = false;
	this.bufView = null;
	this.textDecoder = new TextDecoder('utf-8');
	this.snbt = {
		indentation: '  ',
		level: 0
	};
};

NBTParser.prototype._parse = function () {
	var tag = this._getUint8();
	return this._parseTag(tag);
};

NBTParser.prototype._parseTag = function (tag) {
	if (tag === 0) return this._getTagEnd();
	if (tag === 1) return this._getTagByte();
	if (tag === 2) return this._getTagShort();
	if (tag === 3) return this._getTagInt();
	if (tag === 4) return this._getTagLong();
	if (tag === 5) return this._getTagFloat();
	if (tag === 6) return this._getTagDouble();
	if (tag === 7) return this._getTagByteArray();
	if (tag === 8) return this._getTagString();
	if (tag === 9) return this._getTagList();
	if (tag === 10) return this._getTagCompound();
	if (tag === 11) return this._getTagIntArray();
	if (tag === 12) return this._getTagLongArray();
	throw new Error('Unknown tag: ' + tag);
};

NBTParser.prototype._getName = function () {
	if (this.skipNextName) {
		this.skipNextName = false;
		return null;
	}
	var nameLen = this._getUint16();
	var nameBuf = this.bufView.buffer.slice(this.i, this.i + nameLen);
	var name = this.textDecoder.decode(nameBuf) || null;
	this.i += nameLen;
	return name;
};

NBTParser.prototype._getTagEnd = function () {
	return {
		tag: TAG_End
	};
};

NBTParser.prototype._getTagByte = function () {
	var name = this._getName();
	var value = this._getInt8();
	return {
		tag: TAG_Byte,
		name,
		value
	};
};

NBTParser.prototype._getTagShort = function () {
	var name = this._getName();
	var value = this._getInt16();
	return {
		tag: TAG_Short,
		name,
		value
	};
};

NBTParser.prototype._getTagInt = function () {
	var name = this._getName();
	var value = this._getInt32();
	return {
		tag: TAG_Int,
		name,
		value
	};
};

NBTParser.prototype._getTagLong = function () {
	var name = this._getName();
	var value = this._getBigInt64();
	return {
		tag: TAG_Long,
		name,
		value
	};
};

NBTParser.prototype._getTagFloat = function () {
	var name = this._getName();
	var value = this._getFloat32();
	return {
		tag: TAG_Float,
		name,
		value
	};
};

NBTParser.prototype._getTagDouble = function () {
	var name = this._getName();
	var value = this._getFloat64();
	return {
		tag: TAG_Double,
		name,
		value
	};
};

NBTParser.prototype._getTagByteArray = function () {
	var name = this._getName();
	var size = this._getInt32();
	var value = [];

	for(var j = 0; j < size; j++) {
		value.push(this._getInt8());
	}

	return {
		tag: TAG_Byte_Array,
		name,
		value
	};
};

NBTParser.prototype._getTagString = function () {
	var name = this._getName();
	var size = this._getUint16();
	var strBuf = this.bufView.buffer.slice(this.i, this.i + size);
	var value = this.textDecoder.decode(strBuf) || null;
	this.i += size;

	return {
		tag: TAG_String,
		name,
		value
	};
};

NBTParser.prototype._getTagList = function () {
	var name = this._getName();
	var payloadTag = this._getUint8();
	var size = this._getUint32();
	var value = [];

	for (var j = 0; j < size; j++) {
		this.skipNextName = true;
		var next = this._parseTag(payloadTag);
		value.push(next);
	}

	return {
		tag: TAG_List,
		name,
		value
	};
};

NBTParser.prototype._getTagCompound = function () {
	var name = this._getName();

	var value = {};
	while (true) {
		var next = this._parse();
		if (next.tag === TAG_End) {
			return {
				tag: TAG_Compound,
				name,
				value: value
			};
		}
		if (!next.name) throw new Error('Missing name in compound tag');
		value[next.name] = next;
	}
};

NBTParser.prototype._getTagIntArray = function () {
	var name = this._getName();
	var size = this._getInt32();
	var value = [];

	for(var j = 0; j < size; j++) {
		value.push(this._getInt32());
	}

	return {
		tag: TAG_Int_Array,
		name,
		value
	};
};

NBTParser.prototype._getTagLongArray = function () {
	var name = this._getName();
	var size = this._getInt32();
	var value = [];

	for(var j = 0; j < size; j++) {
		value.push(this._getBigInt64());
	}

	return {
		tag: TAG_Long_Array,
		name,
		value
	};
};

NBTParser.prototype._getUint8 = function () {
	var value = this.bufView.getUint8(this.i);
	this.i += 1;
	return value;
};

NBTParser.prototype._getUint16 = function () {
	var value = this.bufView.getUint16(this.i);
	this.i += 2;
	return value;
};

NBTParser.prototype._getUint32 = function () {
	var value = this.bufView.getUint32(this.i);
	this.i += 4;
	return value;
};

NBTParser.prototype._getInt8 = function () {
	var value = this.bufView.getInt8(this.i);
	this.i += 1;
	return value;
};

NBTParser.prototype._getInt16 = function () {
	var value = this.bufView.getInt16(this.i);
	this.i += 2;
	return value;
};

NBTParser.prototype._getInt32 = function () {
	var value = this.bufView.getInt32(this.i);
	this.i += 4;
	return value;
};

NBTParser.prototype._getBigInt64 = function () {
	var value = this.bufView.getBigInt64(this.i);
	this.i += 8;
	return value;
};

NBTParser.prototype._getFloat32 = function () {
	var value = this.bufView.getFloat32(this.i);
	this.i += 4;
	return value;
};

NBTParser.prototype._getFloat64 = function () {
	var value = this.bufView.getFloat64(this.i);
	this.i += 8;
	return value;
};

NBTParser.prototype._removeTags = function (parsed) {
	if (!parsed) return;
	if (parsed.tag === TAG_Compound) {
		var entries = Object.entries(parsed.value);
		var compound = {};
		entries.forEach(([key, value]) => {
			compound[key] = this._removeTags(value);
		})
		return compound;
	}
	if (parsed.tag === TAG_List) {
		return parsed.value.map(val => this._removeTags(val));
	}
	return parsed.value;
};

NBTParser.prototype._getSnbt = function (parsed) {
	if (!parsed) return '';

	if (parsed.tag === TAG_Byte_Array) {
		var str = '';
		if (!parsed.name) str += this._indent();
		var values = parsed.value;
		str += '[B;';
		if (values.length) str += ' ' + values.join(', ');
		str += ']';
		return str;
	}

	if (parsed.tag === TAG_String) {
		return '"' + parsed.value + '"';
	}

	if (parsed.tag === TAG_List) {
		var str = '';
		if (!parsed.name) str += this._indent();
		if (parsed.value.length === 0) return str += '[]';
		str += '[\n';
		this.snbt.level++;
		var i = 0;
		for (var i = 0; i < parsed.value.length; i++) {
			if (i === parsed.value.length) {
				str += this._getSnbt(parsed.value[i]) + '\n';
			} else {
				str += this._getSnbt(parsed.value[i]) + ',\n';
			}
		}
		this.snbt.level--;
		str += this._indent() + ']';
		return str;
	}

	if (parsed.tag === TAG_Compound) {
		var str = '';
		if (!parsed.name) str += this._indent();
		if (Object.keys(parsed.value).length === 0) return str += '{}';
		str += '{\n';
		var entries = Object.entries(parsed.value);
		this.snbt.level++;
		var i = 0;
		entries.forEach(([ key, value ]) => {
			i++;
			str += this._indent() + key + ': ';
			if (i === entries.length) {
				str += this._getSnbt(value) + '\n';
			} else {
				str += this._getSnbt(value) + ',\n';
			}
		});
		this.snbt.level--;
		str += this._indent() + '}';
		return str;
	}

	if (parsed.tag === TAG_Int_Array) {
		var str = '';
		if (!parsed.name) str += this._indent();
		var values = parsed.value;
		str += '[I;';
		if (values.length) str += ' ' + values.join(', ');
		str += ']';
		return str;
	}

	if (parsed.tag === TAG_Long_Array) {
		var str = '';
		if (!parsed.name) str += this._indent();
		var values = parsed.value;
		str += '[L;';
		if (values.length) str += ' ' + values.map(v => v + 'L').join(', ');
		str += ']';
		return str;
	}

	var tagSuffix = TYPE_SUFFIXES[parsed.tag] || '';
	return '' + parsed.value + tagSuffix;
};

NBTParser.prototype._indent = function () {
	return Array(this.snbt.level).fill(this.snbt.indentation || ' ').join('');
};
