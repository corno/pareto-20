import * as api from "pareto-api"
import { IUnsafePromise } from "./IUnsafePromise"

export type SafeCallerFunction<ResultType> = (onResult: (result: ResultType) => void) => void

export type DataOrPromise<Type> =
    | [Type]
    | api.ISafePromise<Type>

export interface ISafePromise<T> extends api.ISafePromise<T> {
    /**
     * change the result state
     * the callback should return a (safe) promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onResult
     */
    mapResult<NewType>(onResult: (result: T) => DataOrPromise<NewType>): ISafePromise<NewType>
    /**
     * change the success state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapResult'
     * @param onResult
     */
    mapResultRaw<NewType>(onResult: (result: T) => NewType): ISafePromise<NewType>
    /**
     * convert this promise into an unsafe promise in a success state
     * if this fails the new unsafe promise will be in an error state
     * @param callback
     */
    try<ResultType, ErrorType>(callback: (result: T) => api.IUnsafePromise<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType>
    /**
     * convert this safe promise to the JavaScript native Promise
     * only do this to interface with code that requires native Promises
     * @param promise
     */
    convertToNativePromise(): Promise<T>
}
