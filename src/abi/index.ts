import BN from "bn.js";
import { ABIs, DecodeData, DecodeEvent, DecodeLog, Log } from "types";
import abiCoder, { AbiCoder } from "web3-eth-abi";
import { AbiItem, sha3 } from "web3-utils";

import { inputToString } from "../utils";

const GlobalData: ABIs = {
  ABIs: [],
  Ids: {},
};

export const getABIs = () => {
  return GlobalData.ABIs;
};

export const addABI = (abiArray: AbiItem[]) => {
  if (Array.isArray(abiArray)) {
    abiArray.map(function (abi) {
      if (abi && abi.name && abi.inputs) {
        const signature = sha3(abi.name + "(" + abi.inputs.map(inputToString).join(",") + ")");
        if (signature) {
          if (abi.type === "event") {
            GlobalData.Ids[signature.slice(2)] = abi;
          } else {
            GlobalData.Ids[signature.slice(2, 10)] = abi;
          }
        }
      }
    });

    GlobalData.ABIs = GlobalData.ABIs.concat(abiArray);
  } else {
    throw new Error("Expected ABI array, got " + typeof abiArray);
  }
};

export const decodeData = (data: string) => {
  const methodID = data.slice(2, 10);
  const abiItem = GlobalData.Ids[methodID];
  if (abiItem) {
    const abi = abiCoder as unknown; // a bug in the web3-eth-abi types
    const decoded = (abi as AbiCoder).decodeParameters(abiItem.inputs, data.slice(10));

    const retData: DecodeData = {
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
          parsedParam = param.map((val: string) => new BN(val).toString());
        } else {
          parsedParam = new BN(param).toString();
        }
      }

      // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
      if (isAddress) {
        const isArray = Array.isArray(param);

        if (isArray) {
          parsedParam = param.map((_: string) => _.toLowerCase());
        } else {
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

export const decodeLogs = (logs: Log[]): DecodeLog[] => {
  return logs
    .filter((log) => log.topics.length > 0)
    .map((logItem) => {
      const methodID = logItem.topics[0].slice(2);
      const method = GlobalData.Ids[methodID];
      if (method) {
        return createDecodeLog(method, logItem);
      }
    })
    .filter((decoded) => decoded) as DecodeLog[];
};

export const decodeLog = (logItem: Log): DecodeLog | undefined => {
  if (!(logItem || logItem.topics.length)) return undefined;
  const methodID = logItem.topics[0].slice(2);
  const method = GlobalData.Ids[methodID];
  if (method) {
    return createDecodeLog(method, logItem);
  }
  return undefined;
};

const createDecodeLog = (method: AbiItem, logItem: Log) => {
  const logData = logItem.data;
  const decodedParams: DecodeEvent[] = [];
  let dataIndex = 0;
  let topicsIndex = 1;
  const dataTypes: Record<string, Record<string, string>>[] & string[] = [];
  method.inputs.map((input) => {
    if (!input.indexed) {
      if (input.type === "tuple" && input.components) {
        const tupleType: Record<string, Record<string, string>> = {};
        const tupleValue: Record<string, string> = {};
        input.components.forEach((comp) => {
          tupleValue[comp.name] = comp.type;
        });
        tupleType[input.name] = tupleValue;
        dataTypes.push(tupleType);
      } else dataTypes.push(input.type);
    }
  });
  const abi = abiCoder as unknown; // a bug in the web3-eth-abi types

  const decodedData = (abi as AbiCoder).decodeParameters(dataTypes, logData.slice(2));

  // Loop topic and data to get the params
  method.inputs.map((param) => {
    const decodedP: DecodeEvent = {
      name: param.name,
      type: param.type,
      value: "",
    };

    if (param.indexed) {
      decodedP.value = logItem.topics[topicsIndex];
      topicsIndex++;
    } else {
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
        decodedP.value = new BN(decodedP.value.slice(2), 16).toString(10);
      } else {
        decodedP.value = new BN(decodedP.value.toString()).toString(10);
      }
    }
    if (param.type === "tuple") {
      decodedP.value = [];
      param.components.forEach((comp, index) => {
        (decodedP.value as any).push({
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
  } as DecodeLog;
};
