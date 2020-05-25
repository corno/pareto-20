import * as api from "pareto-api"
import { ISafePromise } from "./ISafePromise"
import { IUnsafePromise } from "./IUnsafePromise"
import { result, SafePromise, handleDataOrPromise } from "./SafePromise"

export class UnsafePromise<ResultType, ErrorType> implements IUnsafePromise<ResultType, ErrorType> {
    private isCalled: boolean
    private readonly callerFunction: UnsafeCallerFunction<ResultType, ErrorType>
    constructor(callerFunction: UnsafeCallerFunction<ResultType, ErrorType>) {
        this.isCalled = false
        this.callerFunction = callerFunction
    }
    /**
     * use this function to start resolving the promise
     * this function is not pure and should only be called at the
     * outskirts of the program
     * @param onError
     * @param onSuccess
     */
    public handleUnsafePromise(onError: (error: ErrorType) => void, onSuccess: (result: ResultType) => void): void {
        if (this.isCalled) {
            // console.log("callerFunction")
            // console.log(this.callerFunction)
            // console.log("onError")
            // console.log(onError.toString())
            // console.log("onSuccess")
            // console.log(onSuccess.toString())
            throw new Error("already called")
        }
        this.isCalled = true
        this.callerFunction(onError, onSuccess)
    }
    /**
     * change the success state
     * the callback should return a safe(!) promise
     * if you cannot return a promise, use 'mapResultRaw'
     * if you cannot return a safe promise, use 'try'
     * @param onSuccess
     */
    public mapResult<NewResultType>(
        onSuccess: (result: ResultType) => api.DataOrPromise<NewResultType>
    ): UnsafePromise<NewResultType, ErrorType> {
        return new UnsafePromise((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnError(err)
                },
                data => {
                    handleDataOrPromise(onSuccess(data), newResult => {
                        newOnSuccess(newResult)
                    })
                }
            )
        })
    }
    /**
     * change the success state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapResult'
     * @param onSuccess
     */
    public mapResultRaw<NewResultType>(
        onSuccess: (result: ResultType) => NewResultType
    ): UnsafePromise<NewResultType, ErrorType> {
        return this.mapResult(data => result(onSuccess(data)))
    }
    /**
     * change the error state
     * the callback should return a safe(!) promise
     * if you cannot return a promise, use 'mapErrorRaw'
     * if you cannot return a safe promise, use 'tryToCatch'
     * @param onError
     */
    public mapError<NewErrorType>(
        onError: (error: ErrorType) => api.DataOrPromise<NewErrorType>,
    ): UnsafePromise<ResultType, NewErrorType> {
        return new UnsafePromise((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    handleDataOrPromise(onError(err), res => newOnError(res))
                },
                res => {
                    newOnSuccess(res)
                },
            )
        })
    }
    /**
     * change the error state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapError'
     * @param onError
     */
    public mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType): UnsafePromise<ResultType, NewErrorType> {
        return this.mapError(err => result(onError(err)))
    }
    /**
     * try to convert the success state into a new success state
     * if this fails the new promise will be in an error state of the same type
     * as the this promise
     * @param onSuccess
     */
    public try<NewResultType>(
        onSuccess: (result: ResultType) => api.UnsafeDataOrPromise<NewResultType, ErrorType>
    ): UnsafePromise<NewResultType, ErrorType> {
        return new UnsafePromise((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnError(err)
                },
                res => {
                    handleUnsafeDataOrPromise(onSuccess(res), newOnError, newOnSuccess)
                }
            )
        })
    }
    /**
     * try to catch the error. If it is successful, the resulting promise will be in the success
     * state (of the same type as this promise)
     * if it is not successful, the resulting promise will have a new error state
     * @param onError
     */
    public tryToCatch<NewErrorType>(
        onError: (error: ErrorType) => api.UnsafeDataOrPromise<ResultType, NewErrorType>,
    ): UnsafePromise<ResultType, NewErrorType> {
        return new UnsafePromise((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    handleUnsafeDataOrPromise(onError(err), newOnError, newOnSuccess)
                },
                res => {
                    newOnSuccess(res)
                }
            )
        })
    }
    /**
     * the error state becomes the success state and the success state becomes the error state
     * this can be useful when you need an existing function to fail
     * for example; use fs.access to validate that a file does not exist
     */
    public invert(): UnsafePromise<ErrorType, ResultType> {
        return new UnsafePromise<ErrorType, ResultType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnSuccess(err)
                },
                res => {
                    newOnError(res)
                }
            )
        })
    }
    /**
     * convert this unsafe promise into a new unsafe promise by
     * converting both the success state and the error state into new states
     * @param onError
     * @param onSuccess
     */
    public rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => api.UnsafeDataOrPromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => api.UnsafeDataOrPromise<NewResultType, NewErrorType>
    ): UnsafePromise<NewResultType, NewErrorType> {
        return new UnsafePromise((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    handleUnsafeDataOrPromise(onError(err), newOnError, newOnSuccess)
                },
                res => {
                    handleUnsafeDataOrPromise(onSuccess(res), newOnError, newOnSuccess)
                }
            )
        })
    }
    /**
     * catch the error and thus convert the promise into a safe promise of the same type
     * as this unsafe promise
     * @param onError if the promise results in an error, this handler is called.
     */
    public catch(onError: (error: ErrorType) => ResultType): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            this.handleUnsafePromise(
                err => {
                    onResult(onError(err))
                },
                res => {
                    onResult(res)
                },
            )
        })
    }
    /**
     * convert this unsafe promise into a safe promise by handling both the
     * success state and the error state
     * and converting them into a new state
     * @param onError
     * @param onSuccess
     */
    public reworkAndCatch<NewResultType>(
        onError: (error: ErrorType) => api.DataOrPromise<NewResultType>,
        onSuccess: (result: ResultType) => api.DataOrPromise<NewResultType>
    ): ISafePromise<NewResultType> {
        return new SafePromise<NewResultType>(onResult => {
            this.handleUnsafePromise(
                err => {
                    handleDataOrPromise(onError(err), res => onResult(res))
                },
                data => {
                    handleDataOrPromise(onSuccess(data), res => onResult(res))
                },
            )
        })
    }
    public convertToNativePromise(): Promise<ResultType> {
        return new Promise((resolve, reject) => {
            this.handleUnsafePromise(
                errorData => {
                    reject(errorData)
                },
                resultData => {
                    resolve(resultData)
                }
            )
        })
    }
}

export type UnsafeCallerFunction<ResultType, ErrorType> = (
    onError: (error: ErrorType) => void,
    onResult: (result: ResultType) => void
) => void

export type DefaultError = {
    "message": string
}


export function wrapUnsafeFunction<ResultType, ErrorType>(
    func: (
        onError: (error: ErrorType) => void,
        onResult: (result: ResultType) => void
    ) => void
): IUnsafePromise<ResultType, ErrorType> {
    return new UnsafePromise(func)
}

export const success = <ResultType, ErrorType>(res: ResultType): api.UnsafeDataOrPromise<ResultType, ErrorType> => {
    return [true, res]
}

export const error = <ResultType, ErrorType>(err: ErrorType): api.UnsafeDataOrPromise<ResultType, ErrorType> => {
    return [false, err]
}

export function wrapUnsafePromise<SourceResultType, SourceErrorType>(
    promise: api.UnsafeDataOrPromise<SourceResultType, SourceErrorType>
): IUnsafePromise<SourceResultType, SourceErrorType> {
    return new UnsafePromise<SourceResultType, SourceErrorType>((onError, onSucces) => {
        handleUnsafeDataOrPromise(promise, onError, onSucces)
    })
}

export function handleUnsafeDataOrPromise<Type, ErrorType>(
    dataOrPromise: api.UnsafeDataOrPromise<Type, ErrorType>,
    onError: (error: ErrorType) => void,
    onSuccess: (result: Type) => void,
): void {
    if (dataOrPromise instanceof Array) {
        if (dataOrPromise[0]) {
            onSuccess(dataOrPromise[1])
        } else {
            onError(dataOrPromise[1])
        }
    } else {
        dataOrPromise.handleUnsafePromise(onError, onSuccess)
    }
}