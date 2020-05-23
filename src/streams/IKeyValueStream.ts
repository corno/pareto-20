import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { IStream, FilterResult } from "./IStream"

export interface IKeyValueStream<DataType> extends api.IKeyValueStream<DataType> {
    toKeysStream(): IStream<string>

    map<NewDataType>(onData: (data: DataType, key: string) => api.ISafePromise<NewDataType>): IKeyValueStream<NewDataType>
    mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType>
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => api.ISafePromise<ResultType>): ISafePromise<ResultType>
    filter<NewDataType>(onData: (data: DataType, key: string) => api.ISafePromise<FilterResult<NewDataType>>): IKeyValueStream<NewDataType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType, entryName: string) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType>) => api.ISafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType>, TargetErrorType>
}
