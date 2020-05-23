import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise, result } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { FilterResult, IStream } from "./IStream"
import { streamifyArray } from "./streamifyArray"
import { wrap } from "../wrap"

/**
 * a function that can process a stream by implementing handlers for 'onData' and 'onEnd'
 */
export type ProcessStreamFunction<DataType> = (limiter: null | api.StreamLimiter, onData: api.OnData<DataType>, onEnd: (aborted: boolean) => void) => void

export class Stream<DataType> implements IStream<DataType> {
    public readonly processStream: ProcessStreamFunction<DataType>
    constructor(
        processStreamFunction: ProcessStreamFunction<DataType>,
    ) {
        this.processStream = processStreamFunction
    }
    public toArray(limiter: null | api.StreamLimiter, onAborted: (() => void) | null): DataType[] {
        const array: DataType[] = []
        this.processStream(
            limiter,
            data => {
                array.push(data)
                return false
            },
            aborted => {
                if (aborted && onAborted !== null) { onAborted() }
            }
        )
        return array
    }

    public map<NewDataType>(onData: (data: DataType) => api.ISafePromise<NewDataType>): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    return wrap.SafePromise(onData(data)).mapResult(firstResult => {
                        const newResult = newOnData(firstResult)
                        if (typeof newResult === "boolean") {
                            return result(newResult)
                        } else {
                            return newResult
                        }
                    })
                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    return newOnData(onData(data))
                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType) => api.ISafePromise<FilterResult<NewDataType>>,
    ): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const onDataResult = onData(data)
                    return wrap.SafePromise(onDataResult).mapResult(filterResult => {
                        if (filterResult[0]) {
                            const newResult = newOnData(filterResult[1])
                            if (typeof newResult === "boolean") {
                                return result(false)
                            } else {
                                return wrap.SafePromise(newResult).mapResult(() => {
                                    return result(false)
                                })
                            }
                        }
                        return result(false)
                    })

                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => api.ISafePromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                data => {
                    return wrap.SafePromise(onData(currentValue, data)).mapResult(theResult => {
                        currentValue = theResult
                        return result(false)
                    })
                },
                _aborted => {
                    onResult(currentValue)
                }
            )
        })
    }
    public tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | api.StreamLimiter,
        promisify: (entry: DataType) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType>) => api.ISafePromise<TargetErrorType>
    ): IUnsafePromise<IStream<TargetType>, TargetErrorType> {
        return new UnsafePromise<IStream<TargetType>, TargetErrorType>((onError, onSuccess) => {
            const results: TargetType[] = []
            const errors: IntermediateErrorType[] = []
            let hasErrors = false
            this.processStream(
                limiter,
                data => {
                    return wrap.UnsafePromise( promisify(data)).reworkAndCatch(
                        error => {
                            hasErrors = true
                            errors.push(error)
                            return result(false)
                        },
                        theResult => {
                            results.push(theResult)
                            return result(false)
                        }
                    )
                },
                aborted => {
                    if (aborted || hasErrors) {
                        errorHandler(aborted, new Stream(streamifyArray(errors))).handleSafePromise(theResult => {
                            onError(theResult)
                        })
                    } else {
                        onSuccess(new Stream(streamifyArray(results)))
                    }
                }
            )
        })
    }
}
