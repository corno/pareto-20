import * as api from "pareto-api"
import { IValue, SafeCallerFunction } from "./ISafeValue"
import { IUnsafeValue } from "./IUnsafeValue"
import { createUnsafeValue } from "./createUnsafeValue"

class Value<T> implements IValue<T> {
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
    public handle(onResult: (result2: T) => void): void {
        if (this.isCalled) {
            // console.log("callerFunction")
            // console.log(this.callerFunction.toString())
            // console.log("onResult")
            // console.log(onResult.toString())
            throw new Error("already called")
        }
        this.isCalled = true
        try {
            this.callerFunction(onResult)

        }
        catch (e) {
            console.error("unexpected exception", e)
            throw e
        }
    }
    /**
     * change the result state
     * the callback should return a promise
     * if you do not want to return a promise, use 'mapResultRaw'
     * @param onResult
     */
    public mapResult<NewType>(onResult: (result2: T) => api.IValue<NewType>): Value<NewType> {
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
    public mapResultRaw<NewType>(onResult: (result2: T) => NewType): Value<NewType> {
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
    public try<ResultType, ErrorType>(callback: (result2: T) => api.IUnsafeValue<ResultType, ErrorType>): IUnsafeValue<ResultType, ErrorType> {
        return createUnsafeValue<ResultType, ErrorType>((onError, onSuccess) => {
            this.handle(res => {
                callback(res).handle(onError, onSuccess)
            })

        })
    }
    public convertToNativePromise(): Promise<T> {
        return new Promise<T>(resolve => {
            try {
                this.handle(
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

export function createValue<Type>(callerFunction: SafeCallerFunction<Type>): IValue<Type> {
    return new Value(callerFunction)
}

export function wrapSafeFunction<ResultType>(func: SafeCallerFunction<ResultType>): IValue<ResultType> {
    return createValue(func)
}

/**
 * use this if a (safe) Value is required, but the result is already known
 * @deprecated use 'value()' instead
 */
export const result = <ResultType>(res: ResultType): IValue<ResultType> => {
    return createValue(onResult => {
        new Promise<void>(resolve => {
            resolve()
        }).then(() => {
            try {
                onResult(res)
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


/**
 * use this if a (safe) Value is required, but the result is already known
 */
export const value = result