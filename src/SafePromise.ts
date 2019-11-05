import { IInSafePromise, IInUnsafePromise, ISafePromise, IUnsafePromise } from "pareto"
import { UnsafePromise } from "./UnsafePromise"

export type SafeCallerFunction<ResultType> = (onResult: (result: ResultType) => void) => void

export class SafePromise<T> implements ISafePromise<T> {
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
    public mapResultRaw<NewType>(onResult: (result: T) => NewType): ISafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handle(res => {
                newOnResult(onResult(res))
            })

        })
    }
    public mapResult<NewType>(onResult: (result: T) => IInSafePromise<NewType>): ISafePromise<NewType> {
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
