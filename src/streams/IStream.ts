import { IInSafePromise, IInStream, IInUnsafePromise, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"

export type FilterResult<DataType> = [false] | [true, DataType]

export interface IStream<DataType> extends IInStream<DataType> {
    toArray(limiter: null | StreamLimiter, onAborted: (() => void) | null): DataType[]

    map<NewDataType>(onData: (data: DataType) => IInSafePromise<NewDataType>): IStream<NewDataType>
    mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType>
    filter<NewDataType>(onData: (data: DataType) => IInSafePromise<FilterResult<NewDataType>>): IStream<NewDataType>
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => IInSafePromise<ResultType>): ISafePromise<ResultType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | StreamLimiter,
        promisify: (entry: DataType) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IStream<TargetType>, TargetErrorType>
}
