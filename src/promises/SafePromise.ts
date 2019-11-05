import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { ISafePromise, SafeCallerFunction } from "./ISafePromise"
import { IUnsafePromise } from "./IUnsafePromise"
import { UnsafePromise } from "./UnsafePromise"

export class SafePromise<T> implements IInSafePromise<T> {
    private readonly callerFunction: SafeCallerFunction<T>
    private isCalled = false
    constructor(callerFunction: SafeCallerFunction<T>) {
        this.callerFunction = callerFunction
    }
    public handle(onResult: (result: T) => void): void {
        if (this.isCalled) {
            // console.log("callerFunction")
            // console.log(this.callerFunction.toString())
            // console.log("onResult")
            // console.log(onResult.toString())
            throw new Error("already called")
        }
        this.isCalled = true
        this.callerFunction(onResult)
    }
    public mapResultRaw<NewType>(onResult: (result: T) => NewType): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handle(res => {
                newOnResult(onResult(res))
            })

        })
    }
    public mapResult<NewType>(onResult: (result: T) => SafePromise<NewType>): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handle(res => {
                onResult(res).handle(newOnResult)
            })

        })
    }
    public try<ResultType, ErrorType>(callback: (result: T) => IInUnsafePromise<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType> {
        return new UnsafePromise<ResultType, ErrorType>((onError, onSuccess) => {
            this.handle(res => {
                callback(res).handle(onError, onSuccess)
            })

        })
    }
}

export function wrapSafeFunction<ResultType>(func: SafeCallerFunction<ResultType>): ISafePromise<ResultType> {
    return new SafePromise(func)
}

//If a Safe Promise is required, but the result is already known
export const result = <ResultType>(res: ResultType): SafePromise<ResultType> => {
    const handler: SafeCallerFunction<ResultType> = (onResult: (result: ResultType) => void) => {
        onResult(res)
    }
    return new SafePromise<ResultType>(handler)
}
