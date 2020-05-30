import * as api from "pareto-api"
import { IValue, SafeCallerFunction } from "./ISafeValue"
import { IUnsafeValue } from "./IUnsafeValue"
import { UnsafeValue } from "./UnsafeValue"

export class Value<T> implements IValue<T> {
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
    /**
     * change the result state
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onResult
     */
    public mapResult<NewType>(onResult: (result: T) => api.IValue<NewType>): Value<NewType> {
        return new Value<NewType>(newOnResult => {
            this.handle(res => {
                onResult(res).handle(newOnResult)
            })

        })
    }
    /**
     * change the success state
     * the callback does not have to and should not return a promise
     * if you want to return a promise, use 'mapResult'
     * @param onResult
     */
    public mapResultRaw<NewType>(onResult: (result: T) => NewType): Value<NewType> {
        return new Value<NewType>(newOnResult => {
            this.handle(res => {
                newOnResult(onResult(res))
            })

        })
    }
    /**
     * convert this promise into an unsafe promise in a success state
     * if this fails the new unsafe promise will be in an error state
     * @param callback
     */
    public try<ResultType, ErrorType>(callback: (result: T) => api.IUnsafeValue<ResultType, ErrorType>): IUnsafeValue<ResultType, ErrorType> {
        return new UnsafeValue<ResultType, ErrorType>((onError, onSuccess) => {
            this.handle(res => {
                callback(res).handle(onError, onSuccess)
            })

        })
    }
    public convertToNativePromise(): Promise<T> {
        return new Promise<T>(resolve => {
            this.handle(
                resultData => {
                    resolve(resultData)
                }
            )
        })
    }
}

export function wrapSafeFunction<ResultType>(func: SafeCallerFunction<ResultType>): IValue<ResultType> {
    return new Value(func)
}

//If a Safe Value is required, but the result is already known
export const result = <ResultType>(res: ResultType): IValue<ResultType> => {
    return new Value(onResult => {
        new Promise(resolve => {
            resolve()
        }).then(() => {
            onResult(res)
        }).catch(() => {
            //
        })
    })
}