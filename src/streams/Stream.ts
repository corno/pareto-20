import * as api from "pareto-api"
import { ISafePromise, DataOrPromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise, result, handleDataOrPromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { FilterResult, IStream } from "./IStream"
import { streamifyArray } from "./streamifyArray"
import { wrap } from "../wrap"

/**
 * a function that can process a stream by implementing handlers for 'onData' and 'onEnd'
 */
export type ProcessStreamFunction<DataType, EndDataType> = (limiter: null | api.StreamLimiter, onData: api.OnData<DataType>, onEnd: (aborted: boolean, data: EndDataType) => void) => void

export class Stream<DataType, EndDataType> implements IStream<DataType, EndDataType> {
    public readonly processStream: ProcessStreamFunction<DataType, EndDataType>
    constructor(
        processStreamFunction: ProcessStreamFunction<DataType, EndDataType>,
    ) {
        this.processStream = processStreamFunction
    }
    public toArray(limiter: null | api.StreamLimiter, onAborted: (() => void) | null): DataType[] {
        const array: DataType[] = []
        this.processStream(
            limiter,
            data => {
                array.push(data)
                return [false]
            },
            aborted => {
                if (aborted && onAborted !== null) { onAborted() }
            }
        )
        return array
    }

    public map<NewDataType>(onData: (data: DataType) => DataOrPromise<NewDataType>): IStream<NewDataType, EndDataType> {
        return new Stream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    return wrap.DataOrPromise(onData(data)).mapResult(firstResult => {
                        const newResult = newOnData(firstResult)
                        if (typeof newResult === "boolean") {
                            return result(newResult)
                        } else {
                            return newResult
                        }
                    })
                },
                (aborted, endData) => newOnEnd(aborted, endData)
            )
        })
    }
    public mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType, EndDataType> {
        return new Stream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    return newOnData(onData(data))
                },
                (aborted, endData) => newOnEnd(aborted, endData)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType) => DataOrPromise<FilterResult<NewDataType>>,
    ): IStream<NewDataType, EndDataType> {
        return new Stream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const onDataResult = onData(data)
                    return wrap.DataOrPromise(onDataResult).mapResult(filterResult => {
                        if (filterResult[0]) {
                            const newResult = newOnData(filterResult[1])
                            if (typeof newResult === "boolean") {
                                return result(false)
                            } else {
                                return wrap.DataOrPromise(newResult).mapResult(() => {
                                    return result(false)
                                })
                            }
                        }
                        return result(false)
                    })

                },
                (aborted, endData) => newOnEnd(aborted, endData)
            )
        })
    }
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => DataOrPromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                data => {
                    return wrap.DataOrPromise(onData(currentValue, data)).mapResult(theResult => {
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
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType, EndDataType>) => DataOrPromise<TargetErrorType>
    ): IUnsafePromise<IStream<TargetType, EndDataType>, TargetErrorType> {
        return new UnsafePromise<IStream<TargetType, EndDataType>, TargetErrorType>((onError, onSuccess) => {
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
                (aborted, endData) => {
                    if (aborted || hasErrors) {
                        handleDataOrPromise( errorHandler(aborted, new Stream(streamifyArray(errors, endData))), theResult => {
                            onError(theResult)
                        })
                    } else {
                        onSuccess(new Stream(streamifyArray(results, endData)))
                    }
                }
            )
        })
    }
}
