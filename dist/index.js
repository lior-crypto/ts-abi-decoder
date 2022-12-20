"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bn_js_1 = __importDefault(require("bn.js"));
const web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
const web3_utils_1 = require("web3-utils");
// getNumbers = () =>{
// }
const state = {
    savedABIs: [],
    methodIDs: {},
    keepNonDecodedLogs: null,
};
function _getABIs() {
    return state.savedABIs;
}
function _typeToString(input) {
    if (input.type === "tuple" && input.components) {
        return "(" + input.components.map(_typeToString).join(",") + ")";
    }
    return input.type;
}
function _addABI(abiArray) {
    if (Array.isArray(abiArray)) {
        // Iterate new abi to generate method id"s
        abiArray.map(function (abi) {
            if (abi && abi.name && abi.inputs) {
                const signature = (0, web3_utils_1.sha3)(abi.name + "(" + abi.inputs.map(_typeToString).join(",") + ")");
                if (signature) {
                    if (abi.type === "event") {
                        state.methodIDs[signature.slice(2)] = abi;
                    }
                    else {
                        state.methodIDs[signature.slice(2, 10)] = abi;
                    }
                }
            }
        });
        state.savedABIs = state.savedABIs.concat(abiArray);
    }
    else {
        throw new Error("Expected ABI array, got " + typeof abiArray);
    }
}
function _removeABI(abiArray) {
    if (Array.isArray(abiArray)) {
        // Iterate new abi to generate method id"s
        abiArray.map(function (abi) {
            if (abi && abi.name && abi.inputs) {
                const signature = (0, web3_utils_1.sha3)(abi.name +
                    "(" +
                    abi.inputs
                        .map(function (input) {
                        return input.type;
                    })
                        .join(",") +
                    ")");
                if (signature) {
                    if (abi.type === "event") {
                        if (state.methodIDs[signature.slice(2)]) {
                            delete state.methodIDs[signature.slice(2)];
                        }
                    }
                    else {
                        if (state.methodIDs[signature.slice(2, 10)]) {
                            delete state.methodIDs[signature.slice(2, 10)];
                        }
                    }
                }
            }
        });
    }
    else {
        throw new Error("Expected ABI array, got " + typeof abiArray);
    }
}
function _getMethodIDs() {
    return state.methodIDs;
}
function _decodeMethod(data) {
    const methodID = data.slice(2, 10);
    const abiItem = state.methodIDs[methodID];
    if (abiItem) {
        const abi = web3_eth_abi_1.default; // a bug in the web3-eth-abi types
        const decoded = abi.decodeParameters(abiItem.inputs, data.slice(10));
        const retData = {
            name: abiItem.name,
            params: [],
        };
        for (let i = 0; i < decoded.__length__; i++) {
            const param = decoded[i];
            let parsedParam = param;
            const isUint = abiItem.inputs[i].type.indexOf("uint") === 0;
            const isInt = abiItem.inputs[i].type.indexOf("int") === 0;
            const isAddress = abiItem.inputs[i].type.indexOf("address") === 0;
            if (isUint || isInt) {
                const isArray = Array.isArray(param);
                if (isArray) {
                    parsedParam = param.map((val) => new bn_js_1.default(val).toString());
                }
                else {
                    parsedParam = new bn_js_1.default(param).toString();
                }
            }
            // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
            if (isAddress) {
                const isArray = Array.isArray(param);
                if (isArray) {
                    parsedParam = param.map((_) => _.toLowerCase());
                }
                else {
                    parsedParam = param.toLowerCase();
                }
            }
            retData.params.push({
                name: abiItem.inputs[i].name,
                value: parsedParam,
                type: abiItem.inputs[i].type,
            });
        }
        return retData;
    }
}
function _decodeLogs(logs) {
    return logs
        .filter((log) => log.topics.length > 0)
        .map((logItem) => {
        const methodID = logItem.topics[0].slice(2);
        const method = state.methodIDs[methodID];
        if (method) {
            const logData = logItem.data;
            const decodedParams = [];
            let dataIndex = 0;
            let topicsIndex = 1;
            const dataTypes = [];
            method.inputs.map(function (input) {
                if (!input.indexed) {
                    if (input.type === "tuple" && input.components) {
                        const tupleType = {};
                        const tupleValue = {};
                        for (let i = 0; i < input.components.length; ++i)
                            tupleValue[input.components[i].name] = input.components[i].type;
                        tupleType[input.components.name] = tupleValue;
                        dataTypes.push(tupleType);
                    }
                    else
                        dataTypes.push(input.type);
                }
            });
            const abi = web3_eth_abi_1.default; // a bug in the web3-eth-abi types
            const decodedData = abi.decodeParameters(dataTypes, logData.slice(2));
            // Loop topic and data to get the params
            method.inputs.map(function (param) {
                const decodedP = {
                    name: param.name,
                    type: param.type,
                    value: "",
                };
                if (param.indexed) {
                    decodedP.value = logItem.topics[topicsIndex];
                    topicsIndex++;
                }
                else {
                    decodedP.value = decodedData[dataIndex];
                    dataIndex++;
                }
                if (param.type === "address" && typeof decodedP.value === "string") {
                    decodedP.value = decodedP.value.toLowerCase();
                    // 42 because len(0x) + 40
                    if (decodedP.value.length > 42) {
                        const toRemove = decodedP.value.length - 42;
                        const temp = decodedP.value.split("");
                        temp.splice(2, toRemove);
                        decodedP.value = temp.join("");
                    }
                }
                if (param.type === "uint256" || param.type === "uint8" || param.type === "int") {
                    // ensure to remove leading 0x for hex numbers
                    if (typeof decodedP.value === "string" && decodedP.value.startsWith("0x")) {
                        decodedP.value = new bn_js_1.default(decodedP.value.slice(2), 16).toString(10);
                    }
                    else {
                        decodedP.value = new bn_js_1.default(decodedP.value.toString()).toString(10);
                    }
                }
                decodedParams.push(decodedP);
            });
            return {
                name: method.name,
                events: decodedParams,
                address: logItem.address,
            };
        }
    })
        .filter((decoded) => decoded);
}
exports.default = {
    getABIs: _getABIs,
    addABI: _addABI,
    getMethodIDs: _getMethodIDs,
    decodeMethod: _decodeMethod,
    decodeLogs: _decodeLogs,
    removeABI: _removeABI,
};
