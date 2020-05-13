import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { ISafePromise } from "./ISafePromise"

export interface IUnsafePromise<ResultType, ErrorType> extends IInUnsafePromise<ResultType, ErrorType> {
    /**
     * change the success state
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onSuccess
     */
    mapResult<NewResultType>(
        onSuccess: (result: ResultType) => IInSafePromise<NewResultType>
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
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapErrorRaw'
     * @param onError
     */
    mapError<NewErrorType>(
        onError: (error: ErrorType) => IInSafePromise<NewErrorType>
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
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>
    ): IUnsafePromise<NewResultType, ErrorType>
    /**
     * try to catch the error. If it is successful, the resulting promise will be in the success
     * state (of the same type as this promise)
     * if it is not successful, the resulting promise will have a new error state
     * @param onError
     */
    tryToCatch<NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>
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
     * @param onError
     * @param onSuccess
     */
    rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, NewErrorType>
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
        onError: (error: ErrorType) => IInSafePromise<NewResultType>,
        onSuccess: (result: ResultType) => IInSafePromise<NewResultType>
    ): ISafePromise<NewResultType>
}
