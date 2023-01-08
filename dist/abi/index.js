"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeLog = exports.decodeLogs = exports.decodeData = exports.addABI = exports.getTopic = exports.getABIs = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
const web3_utils_1 = require("web3-utils");
const utils_1 = require("../utils");
const GlobalData = {
    ABIs: [],
    Ids: {},
    topics: {},
};
const getABIs = () => {
    return GlobalData.ABIs;
};
exports.getABIs = getABIs;
const getTopic = (event) => {
    return GlobalData.topics[event];
};
exports.getTopic = getTopic;
const addABI = async (abiArray) => {
    if (Array.isArray(abiArray)) {
        abiArray.map(function (abi) {
            if (abi && abi.name && abi.inputs) {
                // console.log(abi.name);
                GlobalData.topics[abi.name] = abi.name + "(" + abi.inputs.map(utils_1.inputToString).join(",") + ")";
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
    const dataTypes = [];
    method.inputs.map((input) => {
        if (!input.indexed) {
            dataTypes.push((0, utils_1.tupleHandler)(false, input));
        }
    });
    const decodedParams = [];
    const abi = web3_eth_abi_1.default; // a bug in the web3-eth-abi types
    const decodedData = abi.decodeParameters(dataTypes, logData.slice(2));
    let count = 0;
    method.inputs.forEach((param, index) => {
        if (!param.indexed) {
            decodedParams.push((0, utils_1.notindexedParser)(param, decodedData, logItem, index - count));
        }
        else {
            decodedParams.push((0, utils_1.notindexedParser)(param, logItem.topics[index + 1], logItem, index));
            count++;
        }
    });
    return {
        name: method.name,
        events: decodedParams,
        address: logItem.address,
    };
};
