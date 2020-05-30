import * as api from "pareto-api"
// import { ISafePromise } from "../promises/ISafePromise"
// import { IUnsafePromise } from "../promises/IUnsafePromise"
//import { IStream } from "./IStream"

export interface IKeyValueStream<DataType, EndDataType> extends api.IKeyValueStream<DataType, EndDataType> { //eslint-disable-line
    //toKeysStream(): IStream<string, EndDataType>

    // map<NewDataType>(onData: (data: DataType, key: string) => api.IValue<NewDataType>): IKeyValueStream<NewDataType, EndDataType>
    // mapEndData<NewEndType>(onEnd: (data: EndDataType) => api.IValue<NewEndType>): IKeyValueStream<DataType, NewEndType>
    mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, EndDataType>
    // reduce<ResultType>(
    //     initialValue: ResultType,
    //     onData: (previousValue: ResultType, data: DataType, key: string) => api.IValue<ResultType>,
    // ): ISafePromise<ResultType>
    // filter<NewDataType>(onData: (data: DataType, key: string) => api.IValue<FilterResult<NewDataType>>): IKeyValueStream<NewDataType, EndDataType>
    // tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
    //     limiter: null | api.StreamLimiter,
    //     promisify: (entry: DataType, entryName: string) => api.IUnsafeValue<TargetType, IntermediateErrorType>,
    //     errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, EndDataType>) => api.IValue<TargetErrorType>,
    // ): IUnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType>
}
