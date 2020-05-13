import { IInKeyValueStream, IInSafePromise, IInUnsafePromise, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { IStream } from "./IStream"

export interface IKeyValueStream<DataType> extends IInKeyValueStream<DataType> {
    toKeysStream(): IStream<string>

    map<NewDataType>(onData: (data: DataType, key: string) => IInSafePromise<NewDataType>): IKeyValueStream<NewDataType>
    mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType>
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => IInSafePromise<ResultType>): ISafePromise<ResultType>
    filter<NewDataType>(onData: (data: DataType, key: string) => [false] | [true, IInSafePromise<NewDataType>]): IKeyValueStream<NewDataType>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | StreamLimiter,
        promisify: (entry: DataType, entryName: string) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType>, TargetErrorType>
}
