import * as api from "pareto-api"
import { IUnsafeValue } from "../value/IUnsafeValue"
import { IValue } from "../value/ISafeValue"
import { IStreamConsumer, IUnsafeStreamConsumer } from "./IStreamConsumer"

export type FilterResult<DataType> = [false] | [true, DataType]

export interface IStream<DataType, EndDataType> //eslint-disable-line
    extends api.IStream<DataType, EndDataType> {
    // toArray(
    //     limiter: null | api.StreamLimiter,
    //     onAborted: (() => void) | null,
    // ): api.IUnsafeValue<DataType[], null>

    /**
     * trying to consuming a stream transforms the stream into an IUnsafeValue.
     * @param limiter
     * @param consumer
     */
    tryToConsume<ResultType, ErrorType>(
        limiter: api.StreamLimiter,
        consumer: IUnsafeStreamConsumer<DataType, EndDataType, ResultType, ErrorType>
    ): IUnsafeValue<ResultType, ErrorType>
    /**
     * consuming a stream transforms the stream into an IUnsafeValue.
     * @param limiter
     * @param consumer
     */
    consume<ResultType>(
        limiter: api.StreamLimiter,
        consumer: IStreamConsumer<DataType, EndDataType, ResultType>
    ): IValue<ResultType>
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
    mergeUnsafeValues<DataType2, ReturnType, TargetType, IntermediateErrorType, ErrorType>(
        _limiter: null | api.StreamLimiter,
        _onData: (entry: DataType2) => [api.IUnsafeValue<TargetType, IntermediateErrorType>, ReturnType],
        _createError: (aborted: boolean, errors: IStream<IntermediateErrorType, EndDataType>) => ErrorType,
    ): IUnsafeValue<IStream<TargetType, EndDataType>, ErrorType>
}
