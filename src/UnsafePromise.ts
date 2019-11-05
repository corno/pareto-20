import { IInSafePromise, IInUnsafePromise, IUnsafePromise } from "pareto"

export type UnsafeCallerFunction<ResultType, ErrorType> = (onError: (error: ErrorType) => void, onResult: (result: ResultType) => void) => void

export type DefaultError = {
    "message": string
}

export class UnsafePromise<ResultType, ErrorType> implements IUnsafePromise<ResultType, ErrorType> {
    private isCalled: boolean
    private readonly callerFunction: UnsafeCallerFunction<ResultType, ErrorType>
    constructor(callerFunction: UnsafeCallerFunction<ResultType, ErrorType>) {
        this.isCalled = false
        this.callerFunction = callerFunction
    }
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
        this.callerFunction(onError, onSuccess)
    }
    public mapResultRaw<NewResultType>(onSuccess: (result: ResultType) => NewResultType): IUnsafePromise<NewResultType, ErrorType> {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(err)
                },
                result => {
                    newOnSuccess(onSuccess(result))
                }
            )
        })
    }
    public mapResult<NewResultType>(onSuccess: (result: ResultType) => IInSafePromise<NewResultType>): IUnsafePromise<NewResultType, ErrorType> {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(err)
                },
                result => {
                    onSuccess(result).handle(newResult => {
                        newOnSuccess(newResult)
                    })
                }
            )
        })
    }
    public mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType ): IUnsafePromise<ResultType, NewErrorType> {
        return new UnsafePromise<ResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(onError(err))
                },
                result => {
                    newOnSuccess(result)
                }
            )
        })
    }
    public try<NewResultType>(onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>): IUnsafePromise<NewResultType, ErrorType> {
        return new UnsafePromise<NewResultType, ErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    newOnError(err)
                },
                result => {
                    onSuccess(result).handle(newOnError, newOnSuccess)
                }
            )
        })
    }
    public tryToCatch<NewErrorType>(onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>): IUnsafePromise<ResultType, NewErrorType> {
        return new UnsafePromise<ResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    onError(err).handle(newOnError, newOnSuccess)
                },
                result => {
                    newOnSuccess(result)
                }
            )
        })
    }
    public invert(): IUnsafePromise<ErrorType, ResultType> {
        return new UnsafePromise<ErrorType, ResultType>((newOnError, newOnSuccess) => {
            this.handle(
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
    ): IUnsafePromise<NewResultType, NewErrorType> {
        return new UnsafePromise<NewResultType, NewErrorType>((newOnError, newOnSuccess) => {
            this.handle(
                err => {
                    onError(err).handle(newOnError, newOnSuccess)
                },
                result => {
                    onSuccess(result).handle(newOnError, newOnSuccess)
                }
            )
        })
    }
}


export function wrapUnsafeFunction<ResultType, ErrorType>(func: UnsafeCallerFunction<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType> {
    return new UnsafePromise(func)
}
