import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { IStream, FilterResult } from "./IStream"
import { DataOrPromise } from "pareto-api"

export interface IKeyValueStream<DataType, ReturnType, EndDataType> extends api.IKeyValueStream<DataType, ReturnType, EndDataType> {
    toKeysStream(): IStream<string, ReturnType, EndDataType>

    map<NewDataType>(onData: (data: DataType, key: string) => api.DataOrPromise<NewDataType>): IKeyValueStream<NewDataType, ReturnType, EndDataType>
    mapEndData<NewEndType>(onEnd: (data: EndDataType) => api.DataOrPromise<NewEndType>): IKeyValueStream<DataType, ReturnType, NewEndType>
    mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, ReturnType, EndDataType>
    reduce<ResultType>(
        initialValue: ResultType,
        onData: (previousValue: ResultType, data: DataType, key: string) => api.DataOrPromise<[ResultType, ReturnType]>,
    ): ISafePromise<ResultType>
    filter<NewDataType>(onData: (data: DataType, key: string) => api.DataOrPromise<FilterResult<NewDataType, ReturnType>>): IKeyValueStream<NewDataType, ReturnType, EndDataType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType, entryName: string) => api.UnsafeDataOrPromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, boolean, EndDataType>) => api.DataOrPromise<TargetErrorType>,
        onData: (data: DataType, key: string) => DataOrPromise<ReturnType>,
    ): IUnsafePromise<IKeyValueStream<TargetType, boolean, EndDataType>, TargetErrorType>
}
