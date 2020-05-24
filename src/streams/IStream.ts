import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"

export type FilterResult<DataType> = [false] | [true, DataType]

export interface IStream<DataType, EndDataType> extends api.IStream<DataType, EndDataType> {
    toArray(limiter: null | api.StreamLimiter, onAborted: (() => void) | null): DataType[]

    map<NewDataType>(onData: (data: DataType) => api.ISafePromise<NewDataType>): IStream<NewDataType, EndDataType>
    mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType, EndDataType>
    filter<NewDataType>(onData: (data: DataType) => api.ISafePromise<FilterResult<NewDataType>>): IStream<NewDataType, EndDataType>
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => api.ISafePromise<ResultType>): ISafePromise<ResultType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType, EndDataType>) => api.ISafePromise<TargetErrorType>
    ): IUnsafePromise<IStream<TargetType, EndDataType>, TargetErrorType>
}
