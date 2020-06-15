import * as api from "pareto-api"
import { IValue } from "./ISafeValue"
import { IUnsafeValue } from "./IUnsafeValue"
import { result, createSafeValue } from "./createSafeValue"

class UnsafeValue<ResultType, ErrorType> implements IUnsafeValue<ResultType, ErrorType> {
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
    public handle(onError: (error: ErrorType) => void, onSuccess: (result: ResultType) => void): void {
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
        try {
            this.callerFunction(onError, onSuccess)

        }
        catch (e) {
            console.error("unexpected exception", e)
            throw e
        }
    }
    /**
     * change the success state
     * the callback should return a safe(!) promise
     * if you cannot return a promise, use 'mapResultRaw'
     * if you cannot return a safe promise, use 'try'
     * @param onSuccess
     */
    public mapResult<NewResultType>(
        onSuccess: (result: ResultType) => api.IValue<NewResultType>
    ): UnsafeValue<NewResultType, ErrorType> {
        return new UnsafeValue((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(err)
                },
                data => {
                    onSuccess(data).handle(newResult => {
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
    ): UnsafeValue<NewResultType, ErrorType> {
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
        onError: (error: ErrorType) => api.IValue<NewErrorType>,
    ): UnsafeValue<ResultType, NewErrorType> {
        return new UnsafeValue((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    onError(err).handle(res => newOnError(res))
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
    public mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType): UnsafeValue<ResultType, NewErrorType> {
        return this.mapError(err => result(onError(err)))
    }
    /**
     * try to convert the success state into a new success state
     * if this fails the new promise will be in an error state of the same type
     * as the this promise
     * @param onSuccess
     */
    public try<NewResultType>(
        onSuccess: (result: ResultType) => api.IUnsafeValue<NewResultType, ErrorType>
    ): UnsafeValue<NewResultType, ErrorType> {
        return new UnsafeValue((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(err)
                },
                res => {
                    onSuccess(res).handle(newOnError, newOnSuccess)
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
        onError: (error: ErrorType) => api.IUnsafeValue<ResultType, NewErrorType>,
    ): UnsafeValue<ResultType, NewErrorType> {
        return new UnsafeValue((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    onError(err).handle(newOnError, newOnSuccess)
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
    public invert(): UnsafeValue<ErrorType, ResultType> {
        return new UnsafeValue<ErrorType, ResultType>((newOnError, newOnSuccess) => {
            this.handle(
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
        onError: (error: ErrorType) => api.IUnsafeValue<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => api.IUnsafeValue<NewResultType, NewErrorType>
    ): UnsafeValue<NewResultType, NewErrorType> {
        return new UnsafeValue((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    onError(err).handle(newOnError, newOnSuccess)
                },
                res => {
                    onSuccess(res).handle(newOnError, newOnSuccess)
                }
            )
        })
    }
    /**
     * catch the error and thus convert the promise into a safe promise of the same type
     * as this unsafe promise
     * @param onError if the promise results in an error, this handler is called.
     */
    public catch(onError: (error: ErrorType) => IValue<ResultType>): IValue<ResultType> {
        return createSafeValue<ResultType>(onResult => {
            this.handle(
                err => {
                    onError(err).handle(res => onResult(res))
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
        onError: (error: ErrorType) => api.IValue<NewResultType>,
        onSuccess: (result: ResultType) => api.IValue<NewResultType>
    ): IValue<NewResultType> {
        return createSafeValue<NewResultType>(onResult => {
            this.handle(
                err => {
                    onError(err).handle(res => onResult(res))
                },
                data => {
                    onSuccess(data).handle(res => onResult(res))
                },
            )
        })
    }
    public convertToNativePromise(createErrorMessage: (error: ErrorType) => string): Promise<ResultType> {
        return new Promise((resolve, reject) => {
            try {
                this.handle(
                    errorData => {
                        reject(createErrorMessage(errorData))
                    },
                    resultData => {
                        resolve(resultData)
                    }
                )
            }
            catch (e) {
                console.error("unexpected exception", e)
                throw e
            }
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
): IUnsafeValue<ResultType, ErrorType> {
    return new UnsafeValue(func)
}

export const success = <ResultType, ErrorType>(res: ResultType): IUnsafeValue<ResultType, ErrorType> => {
    //the result is a direct value, no promise
    //it is wrapped in a native promise and immediately called because if there is a large array of values
    //the promises cannot be handled with a forEach loop. They have to be called recursively. But if a large array
    //of non-promises are handled recursively, this will lead to a stack overflow.
    //
    return new UnsafeValue((_onError, onSucces) => {
        new Promise(resolve => {
            resolve()
        }).then(() => {
            try {
                onSucces(res)
            }
            catch (e) {
                console.error("unexpected exception", e)
                throw e
            }
        }).catch(() => {
            //
        })
    })
}

export const error = <ResultType, ErrorType>(err: ErrorType): IUnsafeValue<ResultType, ErrorType> => {
    return new UnsafeValue((onError, _onSucces) => {
        //the error is a direct value, no promise
        //it is wrapped in a native promise and immediately called because if there is a large array of values
        //the promises cannot be handled with a forEach loop. They have to be called recursively. But if a large array
        //of non-promises are handled recursively, this will lead to a stack overflow.
        //
        new Promise(resolve => {
            resolve()
        }).then(() => {
            try {
                onError(err)
            }
            catch (e) {
                console.error("unexpected exception", e)
                throw e
            }
        }).catch(() => {
            //
        })
    })
}

export function wrapUnsafePromise<SourceResultType, SourceErrorType>(
    promise: api.IUnsafeValue<SourceResultType, SourceErrorType>
): IUnsafeValue<SourceResultType, SourceErrorType> {
    return new UnsafeValue<SourceResultType, SourceErrorType>((onError, onSucces) => {
        promise.handle(onError, onSucces)
    })
}

export function createUnsafeValue<Type, ErrorType>(
    callerFunction: UnsafeCallerFunction<Type, ErrorType>
): IUnsafeValue<Type, ErrorType> {
    return new UnsafeValue(callerFunction)
}