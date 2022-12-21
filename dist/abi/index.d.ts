import { AbiItem } from "web3-utils";
import { DecodeData, DecodeLog, Log } from "../types";
export declare const getABIs: () => AbiItem[];
export declare const addABI: (abiArray: AbiItem[]) => void;
export declare const decodeData: (data: string) => DecodeData;
export declare const decodeLogs: (logs: Log[]) => DecodeLog[];
export declare const decodeLog: (logItem: Log) => DecodeLog | undefined;
