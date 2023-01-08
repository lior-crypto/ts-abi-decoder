import { AbiInput } from "web3-utils";
import { DecodeEvent, Input, Log } from "../types";
export declare const inputToString: (input: Input) => string;
export declare const tupleHandler: (ret: boolean, input: AbiInput) => string | Record<string, string> | Record<string, Record<string, string>>;
export declare const notindexedParser: (param: AbiInput, decodedData: any, logItem: Log, i: number) => DecodeEvent;
