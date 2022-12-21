"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeLog = exports.decodeLogs = exports.decodeData = exports.addABI = exports.getABIs = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
const web3_utils_1 = require("web3-utils");
const utils_1 = require("../utils");
const GlobalData = {
    ABIs: [],
    Ids: {},
};
const getABIs = () => {
    return GlobalData.ABIs;
};
exports.getABIs = getABIs;
const addABI = (abiArray) => {
    if (Array.isArray(abiArray)) {
        abiArray.map(function (abi) {
            if (abi && abi.name && abi.inputs) {
                const signature = (0, web3_utils_1.sha3)(abi.name + "(" + abi.inputs.map(utils_1.inputToString).join(",") + ")");
                if (signature) {
                    if (abi.type === "event") {
                        GlobalData.Ids[signature.slice(2)] = abi;
                    }
                    else {
                        GlobalData.Ids[signature.slice(2, 10)] = abi;
                    }
                }
            }
        });
        GlobalData.ABIs = GlobalData.ABIs.concat(abiArray);
    }
    else {
        throw new Error("Expected ABI array, got " + typeof abiArray);
    }
};
exports.addABI = addABI;
const decodeData = (data) => {
    const methodID = data.slice(2, 10);
    const abiItem = GlobalData.Ids[methodID];
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
};
exports.decodeData = decodeData;
const decodeLogs = (logs) => {
    return logs
        .filter((log) => log.topics.length > 0)
        .map((logItem) => {
        const methodID = logItem.topics[0].slice(2);
        const method = GlobalData.Ids[methodID];
        if (method) {
            return createDecodeLog(method, logItem);
        }
    })
        .filter((decoded) => decoded);
};
exports.decodeLogs = decodeLogs;
const decodeLog = (logItem) => {
    if (!(logItem || logItem.topics.length))
        return undefined;
    const methodID = logItem.topics[0].slice(2);
    const method = GlobalData.Ids[methodID];
    if (method) {
        return createDecodeLog(method, logItem);
    }
    return undefined;
};
exports.decodeLog = decodeLog;
const createDecodeLog = (method, logItem) => {
    const logData = logItem.data;
    const decodedParams = [];
    let dataIndex = 0;
    let topicsIndex = 1;
    const dataTypes = [];
    method.inputs.map((input) => {
        if (!input.indexed) {
            if (input.type === "tuple" && input.components) {
                const tupleType = {};
                const tupleValue = {};
                input.components.forEach((comp) => {
                    tupleValue[comp.name] = comp.type;
                });
                tupleType[input.name] = tupleValue;
                dataTypes.push(tupleType);
            }
            else
                dataTypes.push(input.type);
        }
    });
    const abi = web3_eth_abi_1.default; // a bug in the web3-eth-abi types
    const decodedData = abi.decodeParameters(dataTypes, logData.slice(2));
    // Loop topic and data to get the params
    method.inputs.map((param) => {
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
        if (param.type === "tuple") {
            decodedP.value = [];
            param.components.forEach((comp, index) => {
                decodedP.value.push({
                    name: comp.name,
                    value: decodedData[dataIndex - 1][index],
                    type: comp.type,
                });
            });
        }
        decodedParams.push(decodedP);
    });
    return {
        name: method.name,
        events: decodedParams,
        address: logItem.address,
    };
};
