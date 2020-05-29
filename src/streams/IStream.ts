import * as api from "pareto-api"
import { IUnsafeValue } from "../values/IUnsafeValue"
//import { ISafePromise } from "../promises/ISafePromise"
//import { IUnsafePromise } from "../promises/IUnsafePromise"

export type FilterResult<DataType> = [false] | [true, DataType]

export interface IStream<DataType, EndDataType> //eslint-disable-line
    extends api.IStream<DataType, EndDataType> {
    // toArray(
    //     limiter: null | api.StreamLimiter,
    //     onAborted: (() => void) | null,
    // ): api.IUnsafeValue<DataType[], null>

    processStream2<ResultType>(
        limiter: api.StreamLimiter,
        onData: (data: DataType) => api.IValue<boolean>, //
        onEnd: (aborted: boolean, endData: EndDataType) => api.IValue<ResultType>
    ): IUnsafeValue<ResultType, null>
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
}
