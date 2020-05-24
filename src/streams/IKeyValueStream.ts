import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { IStream, FilterResult } from "./IStream"

export interface IKeyValueStream<DataType, EndDataType> extends api.IKeyValueStream<DataType, EndDataType> {
    toKeysStream(): IStream<string, EndDataType>

    map<NewDataType>(onData: (data: DataType, key: string) => api.ISafePromise<NewDataType>): IKeyValueStream<NewDataType, EndDataType>
    mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, EndDataType>
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => api.ISafePromise<ResultType>): ISafePromise<ResultType>
    filter<NewDataType>(onData: (data: DataType, key: string) => api.ISafePromise<FilterResult<NewDataType>>): IKeyValueStream<NewDataType, EndDataType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType, entryName: string) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, EndDataType>) => api.ISafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType>
}
