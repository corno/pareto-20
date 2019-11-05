import { IInKeyValueStream, IInSafePromise, IInUnsafePromise, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { IStream } from "./IStream"


// tslint:disable-next-line: max-classes-per-file
export interface IKeyValueStream<DataType> extends IInKeyValueStream<DataType> {
    reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => IInSafePromise<ResultType>): ISafePromise<ResultType>
    mapDataRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType>
    filterRaw<NewDataType>(onData: (data: DataType, key: string) => [false] | [true, NewDataType]): IKeyValueStream<NewDataType>
    toKeysStream(): IStream<string>
    tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: StreamLimiter,
        promisify: (entry: DataType, entryName: string) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType>, TargetErrorType>
}
