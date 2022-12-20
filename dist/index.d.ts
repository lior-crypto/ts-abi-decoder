import { AbiItem } from "web3-utils";
interface DecodeLog {
    name: string;
    events: DecodeEvent[];
    address: string;
}
interface DecodeEvent {
    name: string;
    type: string;
    value: string | DecodeEvent[];
}
export interface Log {
    address: string;
    data: string;
    topics: string[];
}
declare function _getABIs(): AbiItem[];
declare function _addABI(abiArray: AbiItem[]): void;
declare function _removeABI(abiArray: AbiItem[]): void;
declare function _getMethodIDs(): Record<string, any>;
declare function _decodeMethod(data: string): {
    name: string;
    params: {
        name: string;
        value: {
            [key: string]: any;
        };
        type: string;
    }[];
};
declare function _decodeLogs(logs: Log[]): DecodeLog[];
declare const _default: {
    getABIs: typeof _getABIs;
    addABI: typeof _addABI;
    getMethodIDs: typeof _getMethodIDs;
    decodeMethod: typeof _decodeMethod;
    decodeLogs: typeof _decodeLogs;
    removeABI: typeof _removeABI;
};
export default _default;
