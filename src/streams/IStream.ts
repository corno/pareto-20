import { IInSafePromise, IInStream, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"

export type FilterResult<DataType> = [false] | [true, DataType]


export type StreamGetter<DataType> = (limiter: StreamLimiter, onData: (data: DataType, abort: () => void) => void, onEnd: (aborted: boolean) => void) => void


export interface IStream<DataType> extends IInStream<DataType> {
    mapDataRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType>
    filterRaw<NewDataType>(onData: (data: DataType) => FilterResult<NewDataType>, ): IStream<NewDataType>
    filter<NewDataType>(onData: (data: DataType) => IInSafePromise<FilterResult<NewDataType>>): IStream<NewDataType>
    reduceRaw<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => ResultType): ISafePromise<ResultType>
    toArray(limiter: StreamLimiter, onAborted: (() => void) | null): DataType[]
}
