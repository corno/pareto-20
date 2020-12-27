
import * as api from "pareto-api"
import { IStream } from "../stream/IStream"
import { value, createSafeValue } from "../value/createSafeValue"
import { wrap } from "../wrap"
import { createStream } from "../stream/createStream"
import { IArray } from "./IArray"
import { IValue } from "../value/ISafeValue"
import { IUnsafeValue } from "../value/IUnsafeValue"
import { createUnsafeValue } from "../value/createUnsafeValue"

type State = {
    index: number
    mustAbort: boolean
}

function loopUntilEndOrPromise<ElementType>(
    array: ElementType[],
    state: State,
    handler: api.IStreamHandler<ElementType, null>,
): api.IValue<boolean> {
    while (true) {
        if (state.mustAbort) {
            return value(true)
        }
        if (state.index === array.length) {
            return value(false) //end reached
        }
        const onDataResult = handler.onData(array[state.index])
        state.index += 1

        return wrap.Value(onDataResult).mapResult(mustAbort => {
            if (mustAbort) {
                state.mustAbort = true
                return value(true)
            }
            return loopUntilEndOrPromise(
                array,
                state,
                handler,
            )
        })
    }
}

function pushData<ElementType>(
    theArray: ElementType[],
    consumer: api.IStreamHandler<ElementType, null>,
    isLimited: boolean
): void {
    const state: State = {
        index: 0,
        mustAbort: false,
    }
    wrap.Value(loopUntilEndOrPromise(
        theArray,
        state,
        consumer
    )).handle(
        aborted => {
            consumer.onEnd((aborted || isLimited), null)
        }
    )
}


class MyArray<ElementType> implements IArray<ElementType> {
    private readonly imp: ElementType[]
    constructor(raw: ElementType[]) {
        this.imp = raw
    }
    public streamify(
    ): IStream<ElementType, null> {
        return createStream((
            limiter: null | api.StreamLimiter,
            handler: api.IStreamHandler<ElementType, null>,
        ): void => {
            if (limiter !== null && limiter.maximum < this.imp.length) {
                if (limiter.abortEarly) {
                    handler.onEnd(true, null)
                } else {
                    pushData(this.imp.slice(0, limiter.maximum), handler, true)
                }
            } else {
                pushData(this.imp, handler, false)
            }
        })
    }
    public mergeSafeValues<ResultType>(
        callback: (element: ElementType) => IValue<ResultType>,
    ): IValue<ResultType[]> {
        let isExecuted = false
        const execute = (onResult: (results2: ResultType[]) => void) => {
            if (isExecuted === true) {
                throw new Error("all promise is already executed")
            }
            isExecuted = true
            let resolvedCount = 0
            const results: ResultType[] = []

            const wrapup = () => {

                if (resolvedCount > this.imp.length) {
                    throw new Error("promises are called back more than once")
                }
                if (resolvedCount === this.imp.length) {
                    onResult(results)
                }
            }
            if (this.imp.length === 0) {
                wrapup()
            } else {
                this.imp.forEach((element, index) => {
                    (() => {
                        callback(element).handle(
                            theResult => {
                                results[index] = theResult
                                resolvedCount += 1
                                wrapup()
                            }
                        )
                    })()
                })
            }
        }
        return createSafeValue<ResultType[]>(execute)
    }
    public mergeUnsafeValues<ResultType, ErrorType>(
        callback: (element: ElementType) => IUnsafeValue<ResultType, ErrorType>,
    ): IUnsafeValue<ResultType[], ErrorType[]> {
        let isExecuted = false
        const execute = (onErrors: (errors2: ErrorType[]) => void, onSuccess: (results2: ResultType[]) => void) => {
            if (isExecuted === true) {
                throw new Error("all promise is already executed")
            }
            isExecuted = true
            let resolvedCount = 0
            const results: ResultType[] = []
            const errors: ErrorType[] = []

            const wrapup = () => {

                if (resolvedCount > this.imp.length) {
                    const err = new Error("promises are called back more than once")
                    throw err
                }
                if (resolvedCount === this.imp.length) {
                    if (errors.length > 0) {
                        onErrors(errors)
                    } else {
                        onSuccess(results)
                    }
                }
            }
            if (this.imp.length === 0) {
                wrapup()
            } else {
                this.imp.forEach((element, index) => {
                    (() => {
                        callback(element).handle(
                            error => {
                                errors.push(error)
                                resolvedCount += 1
                                wrapup()
                            },
                            theResult => {
                                results[index] = theResult
                                resolvedCount += 1
                                wrapup()
                            }
                        )
                    })()
                })
            }
        }
        return createUnsafeValue(execute)
    }
}

export function createArray<Type>(raw: Type[]): IArray<Type> {
    return new MyArray(raw)
}