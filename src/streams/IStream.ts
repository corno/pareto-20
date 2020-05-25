import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { DataOrPromise } from "pareto-api"

export type FilterResult<DataType, FilterOutDataType> = [false, FilterOutDataType] | [true, DataType]

export interface IStream<DataType, ReturnType, EndDataType> extends api.IStream<DataType, ReturnType, EndDataType> {
    toArray(
        limiter: null | api.StreamLimiter,
        onAborted: (() => void) | null,
        onData: (data: DataType) => DataOrPromise<ReturnType>,
    ): DataType[]

    map<NewDataType>(onData: (data: DataType) => api.DataOrPromise<NewDataType>): IStream<NewDataType, ReturnType, EndDataType>
    mapEndData<NewEndType>(onEnd: (data: EndDataType) => api.DataOrPromise<NewEndType>): IStream<DataType, ReturnType, NewEndType>
    mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType, ReturnType, EndDataType>
    filter<NewDataType>(onData: (data: DataType) => api.DataOrPromise<FilterResult<NewDataType, ReturnType>>): IStream<NewDataType, ReturnType, EndDataType>
    reduce<ResultType>(
        initialValue: ResultType,
        onData: (previousValue: ResultType, data: DataType) => api.DataOrPromise<[ResultType, ReturnType]>,
    ): ISafePromise<ResultType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType) => api.UnsafeDataOrPromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType, boolean, EndDataType>) => api.DataOrPromise<TargetErrorType>,
        onData: (data: DataType) => DataOrPromise<ReturnType>,
    ): IUnsafePromise<IStream<TargetType, boolean, EndDataType>, TargetErrorType>
}
