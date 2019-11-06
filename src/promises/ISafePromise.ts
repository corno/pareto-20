import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { IUnsafePromise } from "./IUnsafePromise"

export type SafeCallerFunction<ResultType> = (onResult: (result: ResultType) => void) => void

export interface ISafePromise<T> extends IInSafePromise<T> {
    mapResult<NewType>(onResult: (result: T) => ISafePromise<NewType>): ISafePromise<NewType>
    mapResultRaw<NewType>(onResult: (result: T) => NewType): ISafePromise<NewType>
    try<ResultType, ErrorType>(callback: (result: T) => IInUnsafePromise<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType>
}
