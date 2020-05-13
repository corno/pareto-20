import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { ISafePromise } from "./ISafePromise"
import { IUnsafePromise } from "./IUnsafePromise"
import { result, SafePromise } from "./SafePromise"

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
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onSuccess
     */
    public mapResult<NewResultType>(
        onSuccess: (result: ResultType) => IInSafePromise<NewResultType>
    ) {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnError(err)
                },
                data => {
                    onSuccess(data).handleSafePromise(newResult => {
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
    ) {
        return this.mapResult(data => result(onSuccess(data)))
    }
    /**
     * change the error state
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapErrorRaw'
     * @param onError
     */
    public mapError<NewErrorType>(
        onError: (error: ErrorType) => IInSafePromise<NewErrorType>,
    ) {
        return new UnsafePromise<ResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleSafePromise(res => newOnError(res))
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
    public mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType) {
        return this.mapError(err => result(onError(err)))
    }
    /**
     * try to convert the success state into a new success state
     * if this fails the new promise will be in an error state of the same type
     * as the this promise
     * @param onSuccess
     */
    public try<NewResultType>(
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>
    ) {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnError(err)
                },
                res => {
                    onSuccess(res).handleUnsafePromise(newOnError, newOnSuccess)
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
        onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>,
    ) {
        return new UnsafePromise<ResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleUnsafePromise(newOnError, newOnSuccess)
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
    public invert() {
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
        onError: (error: ErrorType) => IInUnsafePromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, NewErrorType>
    ) {
        return new UnsafePromise<NewResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleUnsafePromise(newOnError, newOnSuccess)
                },
                res => {
                    onSuccess(res).handleUnsafePromise(newOnError, newOnSuccess)
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
        onError: (error: ErrorType) => IInSafePromise<NewResultType>,
        onSuccess: (result: ResultType) => IInSafePromise<NewResultType>
    ): ISafePromise<NewResultType> {
        return new SafePromise<NewResultType>(onResult => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleSafePromise(res => onResult(res))
                },
                data => {
                    onSuccess(data).handleSafePromise(res => onResult(res))
                },
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

export const success = <ResultType, ErrorType>(res: ResultType): IUnsafePromise<ResultType, ErrorType> => {
    const handler: UnsafeCallerFunction<ResultType, ErrorType> = (
        _onError: (error: ErrorType) => void,
        onSuccess: (result: ResultType) => void
    ) => {
        onSuccess(res)
    }
    return new UnsafePromise<ResultType, ErrorType>(handler)
}

export const error = <ResultType, ErrorType>(err: ErrorType): IUnsafePromise<ResultType, ErrorType> => {
    const handler: UnsafeCallerFunction<ResultType, ErrorType> = (
        onError: (error: ErrorType) => void,
        _onSuccess: (result: ResultType) => void
    ) => {
        onError(err)
    }
    return new UnsafePromise<ResultType, ErrorType>(handler)
}

export function wrapUnsafePromise<SourceResultType, SourceErrorType>(
    promise: IInUnsafePromise<SourceResultType, SourceErrorType>
): IUnsafePromise<SourceResultType, SourceErrorType> {
    return new UnsafePromise<SourceResultType, SourceErrorType>((onError, onSucces) => {
        promise.handleUnsafePromise(onError, onSucces)
    })
}
