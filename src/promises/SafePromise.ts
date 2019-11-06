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
    public handleSafePromise(onResult: (result: T) => void): void {
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


    public mapResult<NewType>(onResult: (result: T) => SafePromise<NewType>): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handleSafePromise(res => {
                onResult(res).handleSafePromise(newOnResult)
            })

        })
    }
    public mapResultRaw<NewType>(onResult: (result: T) => NewType): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handleSafePromise(res => {
                newOnResult(onResult(res))
            })

        })
    }
    public try<ResultType, ErrorType>(callback: (result: T) => IInUnsafePromise<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType> {
        return new UnsafePromise<ResultType, ErrorType>((onError, onSuccess) => {
            this.handleSafePromise(res => {
                callback(res).handleUnsafePromise(onError, onSuccess)
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
