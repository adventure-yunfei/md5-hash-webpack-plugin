"use strict";

var md5 = require("md5");

function compareModules(a,b) {
    if (a.id < b.id) {
        return -1;
    }
    if (a.id > b.id) {
        return 1;
    }
    return 0;
}

function getModuleSource (module) {
    return {
        id: module.id,
        source: (module._source || {})._value || '',
        dependencies: (module.dependencies || []).map(function(d){ return d.module ? d.module.id : ''; })
    };
}

function concatenateSource (result, module_source) {
    return result + '#' + module_source.id + '#' + module_source.source + (module_source.dependencies.join(','));
}

function chunkIdSource(chunk) {
    return '@' + (chunk.ids ? chunk.ids.join(',') : chunk.id) + '@';
}

function mapModules(chunk, fn) {
    // compatitable with webpack 1-3
    return chunk.mapModules ? chunk.mapModules(fn) : chunk.modules.map(fn);
}

function getHashes(chunks) {
    var _chunks = chunks;
    var _hashes = '';
    _chunks.forEach(function(chunk) {
        _hashes += chunk.hash;
        if (chunk.chunks && chunk.chunks.length > 0) {
            _hashes += getHashes(chunk.chunks);
        }
    });

    return _hashes;
}

function MD5HashPlugin () {

}

MD5HashPlugin.prototype.apply = function(compiler) {
    compiler.plugin("compilation", function(compilation) {
        compilation.plugin("chunk-hash", function(chunk, chunkHash) {
            var source = chunkIdSource(chunk) + mapModules(chunk, getModuleSource).sort(compareModules).reduce(concatenateSource, ''); // we provide an initialValue in case there is an empty module source. Ref: http://es5.github.io/#x15.4.4.21
            var child_hashes = '';
            if (chunk.entry && chunk.name && chunk.chunks && chunk.chunks.length > 0) {
                child_hashes = getHashes(chunk.chunks);
            }
            var chunk_hash = child_hashes === '' ? md5(source) : md5(source + child_hashes);
            chunkHash.digest = function () {
                return chunk_hash;
            };
        });
    });
};

module.exports = MD5HashPlugin;
