import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { IUnsafePromise } from "./IUnsafePromise"
import { result } from "./SafePromise"

export class UnsafePromise<ResultType, ErrorType> implements IUnsafePromise<ResultType, ErrorType> {
    private isCalled: boolean
    private readonly callerFunction: UnsafeCallerFunction<ResultType, ErrorType>
    constructor(callerFunction: UnsafeCallerFunction<ResultType, ErrorType>) {
        this.isCalled = false
        this.callerFunction = callerFunction
    }
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
    public mapResultRaw<NewResultType>(
        onSuccess: (result: ResultType) => NewResultType
    ) {
        return this.mapResult(data => result(onSuccess(data)))
    }
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
                }
            )
        })
    }
    public mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType, ) {
        return this.mapError(err => result(onError(err)))
    }
    public try<NewResultType>(
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>
    ) {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnError(err)
                },
                result => {
                    onSuccess(result).handleUnsafePromise(newOnError, newOnSuccess)
                }
            )
        })
    }
    public tryToCatch<NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>,
    ) {
        return new UnsafePromise<ResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleUnsafePromise(newOnError, newOnSuccess)
                },
                result => {
                    newOnSuccess(result)
                }
            )
        })
    }
    public invert() {
        return new UnsafePromise<ErrorType, ResultType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    newOnSuccess(err)
                },
                result => {
                    newOnError(result)
                }
            )
        })
    }
    public rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, NewErrorType>
    ) {
        return new UnsafePromise<NewResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handleUnsafePromise(
                err => {
                    onError(err).handleUnsafePromise(newOnError, newOnSuccess)
                },
                result => {
                    onSuccess(result).handleUnsafePromise(newOnError, newOnSuccess)
                }
            )
        })
    }
}

export type UnsafeCallerFunction<ResultType, ErrorType> = (onError: (error: ErrorType) => void, onResult: (result: ResultType) => void) => void

export type DefaultError = {
    "message": string
}


export function wrapUnsafeFunction<ResultType, ErrorType>(func: UnsafeCallerFunction<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType> {
    return new UnsafePromise(func)
}

export const success = <ResultType, ErrorType>(result: ResultType): IUnsafePromise<ResultType, ErrorType> => {
    const handler: UnsafeCallerFunction<ResultType, ErrorType> = (_onError: (error: ErrorType) => void, onSuccess: (result: ResultType) => void) => {
        onSuccess(result)
    }
    return new UnsafePromise<ResultType, ErrorType>(handler)
}
export const error = <ResultType, ErrorType>(err: ErrorType): IUnsafePromise<ResultType, ErrorType> => {
    const handler: UnsafeCallerFunction<ResultType, ErrorType> = (onError: (error: ErrorType) => void, _onSuccess: (result: ResultType) => void) => {
        onError(err)
    }
    return new UnsafePromise<ResultType, ErrorType>(handler)
}

export function wrap<SourceResultType, SourceErrorType>(promise: IInUnsafePromise<SourceResultType, SourceErrorType>): IUnsafePromise<SourceResultType, SourceErrorType> {
    return new UnsafePromise<SourceResultType, SourceErrorType>((onError, onSucces) => {
        promise.handleUnsafePromise(onError, onSucces)
    })
}
