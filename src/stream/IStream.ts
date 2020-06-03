import * as api from "pareto-api"
import { IUnsafeValue } from "../value/IUnsafeValue"
//import { ISafePromise } from "../promises/ISafePromise"
//import { IUnsafePromise } from "../promises/IUnsafePromise"

export type FilterResult<DataType> = [false] | [true, DataType]

export interface IStream<DataType, EndDataType> //eslint-disable-line
    extends api.IStream<DataType, EndDataType> {
    // toArray(
    //     limiter: null | api.StreamLimiter,
    //     onAborted: (() => void) | null,
    // ): api.IUnsafeValue<DataType[], null>

    toUnsafeValue<ResultType, ErrorType>(
        limiter: api.StreamLimiter,
        consumer: {
            onData: (data: DataType) => api.IValue<boolean>
            onEnd: (aborted: boolean, endData: EndDataType) => api.IUnsafeValue<ResultType, ErrorType>
        }
    ): IUnsafeValue<ResultType, ErrorType>
    map<NewDataType>(
        onData: (data: DataType) => api.IValue<NewDataType>
    ): IStream<NewDataType, EndDataType>
    mapEndData<NewEndType>(
        onEnd: (data: EndDataType) => api.IValue<NewEndType>
    ): IStream<DataType, NewEndType>
    // mapRaw<NewDataType>(
    //     onData: (data: DataType) => NewDataType
    // ): IStream<NewDataType, EndDataType>
    // filter<NewDataType>(
    //     onData: (data: DataType) => api.IValue<FilterResult<NewDataType>>
    // ): IStream<NewDataType, EndDataType>
    // reduce<ResultType>(
    //     initialValue: ResultType,
    //     onData: (previousValue: ResultType, data: DataType) => api.IValue<ResultType>,
    // ): ISafePromise<ResultType>
    // tryAll<TargetType, IntermediateErrorType>(
    //     limiter: null | api.StreamLimiter,
    //     promisify: (data: DataType) => api.IUnsafeValue<TargetType, IntermediateErrorType>,
    // ): IUnsafePromise<
    //     IStream<TargetType, EndDataType>,
    //     {
    //         aborted: boolean
    //         errors: IStream<IntermediateErrorType, EndDataType>
    //     }
    // >
    mergeUnsafeValues<DataType, ReturnType, EndDataType, TargetType, IntermediateErrorType, ErrorType>(
        _limiter: null | api.StreamLimiter,
        _onData: (entry: DataType) => [api.IUnsafeValue<TargetType, IntermediateErrorType>, ReturnType],
        _createError: (aborted: boolean, errors: IStream<IntermediateErrorType, EndDataType>) => ErrorType,
    ): IUnsafeValue<IStream<TargetType, EndDataType>, ErrorType>
}
