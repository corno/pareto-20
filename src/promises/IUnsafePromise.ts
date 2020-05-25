import * as api from "pareto-api"
import { ISafePromise } from "./ISafePromise"

export interface IUnsafePromise<ResultType, ErrorType> extends api.IUnsafePromise<ResultType, ErrorType> {
    /**
     * change the success state
     * the callback should return a safe(!) promise
     * if you cannot return a promise, use 'mapResultRaw'
     * if you cannot return a safe promise, use 'try'
     * @param onSuccess
     */
    mapResult<NewResultType>(
        onSuccess: (result: ResultType) => api.DataOrPromise<NewResultType>
    ): IUnsafePromise<NewResultType, ErrorType>
    /**
     * change the success state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapResult'
     * @param onSuccess
     */
    mapResultRaw<NewResultType>(
        onSuccess: (result: ResultType) => NewResultType
    ): IUnsafePromise<NewResultType, ErrorType>
    /**
     * change the error state
     * the callback should return a safe(!) promise
     * if you cannot return a promise, use 'mapErrorRaw'
     * if you cannot return a safe promise, use 'tryToCatch'
     * @param onError
     */
    mapError<NewErrorType>(
        onError: (error: ErrorType) => api.DataOrPromise<NewErrorType>
    ): IUnsafePromise<ResultType, NewErrorType>
    /**
     * change the error state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapError'
     * @param onError
     */
    mapErrorRaw<NewErrorType>(
        onError: (error: ErrorType) => NewErrorType
    ): IUnsafePromise<ResultType, NewErrorType>
    /**
     * try to convert the success state into a new success state
     * if this fails the new promise will be in an error state of the same type
     * as the this promise
     * @param onSuccess
     */
    try<NewResultType>(
        onSuccess: (result: ResultType) => api.UnsafeDataOrPromise<NewResultType, ErrorType>
    ): IUnsafePromise<NewResultType, ErrorType>
    /**
     * try to catch the error. If it is successful, the resulting promise will be in the success
     * state (of the same type as this promise)
     * if it is not successful, the resulting promise will have a new error state
     * @param onError
     */
    tryToCatch<NewErrorType>(
        onError: (error: ErrorType) => api.UnsafeDataOrPromise<ResultType, NewErrorType>
    ): IUnsafePromise<ResultType, NewErrorType>
    /**
     * the error state becomes the success state and the success state becomes the error state
     * this can be useful when you need an existing function to fail
     * for example; use fs.access to validate that a file does not exist
     */
    invert(): IUnsafePromise<ErrorType, ResultType>
    /**
     * convert this unsafe promise into a new unsafe promise by
     * converting both the success state and the error state into new states
     * success states can become error states and vice versa
     * if either the type of the success state or the error state stays the same
     * it is preferred to use a combination of 'try' and 'tryToCatch' instead of this method
     * @param onError
     * @param onSuccess
     */
    rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => api.UnsafeDataOrPromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => api.UnsafeDataOrPromise<NewResultType, NewErrorType>
    ): IUnsafePromise<NewResultType, NewErrorType>
    /**
     * catch the error and thus convert the promise into a safe promise of the same type
     * as this unsafe promise
     * @param onError if the promise results in an error, this handler is called.
     */
    catch(onError: (error: ErrorType) => ResultType, ): ISafePromise<ResultType>
    /**
     * convert this unsafe promise into a safe promise by handling both the
     * success state and the error state
     * and converting them into a new state
     * @param onError
     * @param onSuccess
     */
    reworkAndCatch<NewResultType>(
        onError: (error: ErrorType) => api.DataOrPromise<NewResultType>,
        onSuccess: (result: ResultType) => api.DataOrPromise<NewResultType>
    ): ISafePromise<NewResultType>
    /**
     * convert this unsafe promise to the JavaScript native Promise
     * only do this to interface with code that requires native Promises
     * @param promise
     */
    convertToNativePromise(): Promise<ResultType>
}
