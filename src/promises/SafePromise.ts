import * as api from "pareto-api"
import { ISafePromise, SafeCallerFunction, DataOrPromise } from "./ISafePromise"
import { IUnsafePromise } from "./IUnsafePromise"
import { UnsafePromise } from "./UnsafePromise"

export class SafePromise<T> implements ISafePromise<T> {
    private readonly callerFunction: SafeCallerFunction<T>
    private isCalled = false
    constructor(callerFunction: SafeCallerFunction<T>) {
        this.callerFunction = callerFunction
    }
    /**
     * use this function to start resolving the promise
     * this function is not pure and should only be called at the
     * outskirts of the program
     * @param onResult
     */
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
    /**
     * change the result state
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onResult
     */
    public mapResult<NewType>(onResult: (result: T) => SafePromise<NewType>): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handleSafePromise(res => {
                onResult(res).handleSafePromise(newOnResult)
            })

        })
    }
    /**
     * change the success state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapResult'
     * @param onResult
     */
    public mapResultRaw<NewType>(onResult: (result: T) => NewType): SafePromise<NewType> {
        return new SafePromise<NewType>(newOnResult => {
            this.handleSafePromise(res => {
                newOnResult(onResult(res))
            })

        })
    }
    /**
     * convert this promise into an unsafe promise in a success state
     * if this fails the new unsafe promise will be in an error state
     * @param callback
     */
    public try<ResultType, ErrorType>(callback: (result: T) => api.IUnsafePromise<ResultType, ErrorType>): IUnsafePromise<ResultType, ErrorType> {
        return new UnsafePromise<ResultType, ErrorType>((onError, onSuccess) => {
            this.handleSafePromise(res => {
                callback(res).handleUnsafePromise(onError, onSuccess)
            })

        })
    }
    public convertToNativePromise(): Promise<T> {
        return new Promise<T>(resolve => {
            this.handleSafePromise(
                resultData => {
                    resolve(resultData)
                }
            )
        })
    }
}

export function wrapSafeFunction<ResultType>(func: SafeCallerFunction<ResultType>): ISafePromise<ResultType> {
    return new SafePromise(func)
}

//If a Safe Promise is required, but the result is already known
export const result = <ResultType>(res: ResultType): DataOrPromise<ResultType> => {
    return [res]
}


export function handleDataOrPromise<Type>(
    dataOrPromise: DataOrPromise<Type>,
    onResult: (data: Type) => void
): void {
    if (dataOrPromise instanceof Array) {
        onResult(dataOrPromise[0])
    } else {
        handleDataOrPromise(dataOrPromise, onResult)
    }
}