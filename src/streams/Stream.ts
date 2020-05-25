import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise, result, handleDataOrPromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { FilterResult, IStream } from "./IStream"
import { streamifyArray } from "./streamifyArray"
import { wrap } from "../wrap"
import { DataOrPromise } from "pareto-api"

/**
 * a function that can process a stream by implementing handlers for 'onData' and 'onEnd'
 */
export type ProcessStreamFunction<DataType, ReturnType, EndDataType> = (
    limiter: null | api.StreamLimiter,
    onData: api.OnData<DataType, ReturnType>,
    onEnd: (aborted: boolean, data: EndDataType) => void
) => void

export class Stream<DataType, ReturnType, EndDataType> implements IStream<DataType, ReturnType, EndDataType> {
    public readonly processStream: ProcessStreamFunction<DataType, ReturnType, EndDataType>
    constructor(
        processStreamFunction: ProcessStreamFunction<DataType, ReturnType, EndDataType>,
    ) {
        this.processStream = processStreamFunction
    }
    public toArray(
        limiter: null | api.StreamLimiter,
        onAborted: (() => void) | null,
        onData: (data: DataType) => DataOrPromise<ReturnType>,
    ): DataType[] {
        const array: DataType[] = []
        this.processStream(
            limiter,
            data => {
                array.push(data)
                return onData(data)
            },
            aborted => {
                if (aborted && onAborted !== null) { onAborted() }
            }
        )
        return array
    }

    public map<NewDataType>(convert: (data: DataType) => api.DataOrPromise<NewDataType>): IStream<NewDataType, ReturnType, EndDataType> {
        return new Stream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    return wrap.DataOrPromise(convert(data)).mapResult(firstResult => {
                        return newOnData(firstResult)
                    })
                },
                (aborted, endData) => newOnEnd(aborted, endData)
            )
        })
    }

    public mapEndData<NewEndDataType>(convert: (data: EndDataType) => api.DataOrPromise<NewEndDataType>): IStream<DataType, ReturnType, NewEndDataType> {
        return new Stream<DataType, ReturnType, NewEndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                newOnData,
                (aborted, data) => {
                    handleDataOrPromise(
                        convert(data),
                        newData => {
                            newOnEnd(aborted, newData)

                        }
                    )
                }
            )
        })
    }
    public mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType, ReturnType, EndDataType> {
        return new Stream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
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
        onData: (data: DataType) => api.DataOrPromise<FilterResult<NewDataType, ReturnType>>,
    ): IStream<NewDataType, ReturnType, EndDataType> {
        return new Stream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const onDataResult = onData(data)
                    return wrap.DataOrPromise(onDataResult).mapResult(filterResult => {
                        if (filterResult[0]) {
                            return wrap.DataOrPromise(newOnData(filterResult[1]))
                        }
                        return result(filterResult[1])
                    })

                },
                (aborted, endData) => newOnEnd(aborted, endData)
            )
        })
    }
    public reduce<ResultType>(
        initialValue: ResultType,
        onData: (previousValue: ResultType, data: DataType) => api.DataOrPromise<[ResultType, ReturnType]>,
    ): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                data => {
                    return wrap.DataOrPromise(onData(currentValue, data)).mapResult(theResult => {
                        currentValue = theResult[0]
                        return result(theResult[1])
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
        promisify: (entry: DataType) => api.UnsafeDataOrPromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType, boolean, EndDataType>) => api.DataOrPromise<TargetErrorType>,
        onData: (data: DataType) => DataOrPromise<ReturnType>,
    ): IUnsafePromise<IStream<TargetType, boolean, EndDataType>, TargetErrorType> {
        return new UnsafePromise<IStream<TargetType, boolean, EndDataType>, TargetErrorType>((onError, onSuccess) => {
            const results: TargetType[] = []
            const errors: IntermediateErrorType[] = []
            let hasErrors = false
            this.processStream(
                limiter,
                data => {
                    return wrap.UnsafePromise(promisify(data)).reworkAndCatch(
                        error => {
                            hasErrors = true
                            errors.push(error)
                            return onData(data)
                        },
                        theResult => {
                            results.push(theResult)
                            return onData(data)
                        }
                    )
                },
                (aborted, endData) => {
                    if (aborted || hasErrors) {
                        handleDataOrPromise(
                            errorHandler(
                                aborted,
                                new Stream(streamifyArray(errors)).mapEndData(() => result(endData))
                            ),
                            theResult => {
                                onError(theResult)
                            }
                        )
                    } else {
                        onSuccess(new Stream(streamifyArray(results)).mapEndData(() => result(endData)))
                    }
                }
            )
        })
    }
}
