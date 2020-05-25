import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise, result, handleDataOrPromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { IKeyValueStream } from "./IKeyValueStream"
import { Stream } from "./Stream"
import { streamifyDictionary } from "./streamifyDictionary"
import { KeyValuePair, DataOrPromise } from "pareto-api"
import { wrap } from "../wrap"
import { FilterResult } from "./IStream"

type OnData<DataType, ReturnType> = api.OnData<KeyValuePair<DataType>, ReturnType>

export type ProcessKeyValueStreamFunction<DataType, ReturnType, EndDataType> = (
    limiter: null | api.StreamLimiter,
    onData: OnData<DataType, ReturnType>,
    onEnd: (aborted: boolean, data: EndDataType) => void
) => void

export class KeyValueStream<DataType, ReturnType, EndDataType> implements IKeyValueStream<DataType, ReturnType, EndDataType> {
    public readonly processStream: ProcessKeyValueStreamFunction<DataType, ReturnType, EndDataType>
    constructor(
        processStreamFunction: ProcessKeyValueStreamFunction<DataType, ReturnType, EndDataType>,
    ) {
        this.processStream = processStreamFunction
    }
    public toKeysStream(): Stream<string, ReturnType, EndDataType> {
        return new Stream<string, ReturnType, EndDataType>((limiter, onData, onEnd) => {
            this.processStream(
                limiter,
                data => {
                    return onData(data.key)
                },
                (aborted, endData) => {
                    onEnd(aborted, endData)
                }
            )
        })
    }


    public map<NewDataType>(onData: (data: DataType, key: string) => api.DataOrPromise<NewDataType>): IKeyValueStream<NewDataType, ReturnType, EndDataType> {
        return new KeyValueStream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const promise = wrap.DataOrPromise(onData(data.value, data.key))
                    return promise.mapResult(theResult => {
                        return newOnData({ key: data.key, value: theResult })
                    })
                },
                (aborted, data) => newOnEnd(aborted, data)
            )
        })
    }
    public mapEndData<NewEndDataType>(convert: (data: EndDataType) => api.DataOrPromise<NewEndDataType>): IKeyValueStream<DataType, ReturnType, NewEndDataType> {
        return new KeyValueStream<DataType, ReturnType, NewEndDataType>((newLimiter, newOnData, newOnEnd) => {
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
    public mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, ReturnType, EndDataType> {
        return new KeyValueStream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const dataResult = newOnData({ key: data.key, value: onData(data.value, data.key) })
                    return dataResult
                },
                (aborted, data) => newOnEnd(aborted, data)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType, key: string) => api.DataOrPromise<FilterResult<NewDataType, ReturnType>>,
    ): KeyValueStream<NewDataType, ReturnType, EndDataType> {
        return new KeyValueStream<NewDataType, ReturnType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const onDataResult = onData(data.value, data.key)
                    return wrap.DataOrPromise(onDataResult).mapResult(filterResult => {
                        if (filterResult[0]) { //keep, don't filter out
                            return newOnData({
                                key: data.key,
                                value: filterResult[1],
                            })
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
        onData: (previousValue: ResultType, data: DataType, key: string) => api.DataOrPromise<[ResultType, ReturnType]>,
    ): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                data => {
                    return wrap.DataOrPromise(onData(currentValue, data.value, data.key)).mapResult(theResult => {
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
        promisify: (entry: DataType, entryName: string) => api.UnsafeDataOrPromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, boolean, EndDataType>) => api.DataOrPromise<TargetErrorType>,
        onData: (data: DataType, key: string) => DataOrPromise<ReturnType>,
    ): IUnsafePromise<IKeyValueStream<TargetType, boolean, EndDataType>, TargetErrorType> {
        return new UnsafePromise<IKeyValueStream<TargetType, boolean, EndDataType>, TargetErrorType>((onError, onSuccess) => {
            const results: { [key: string]: TargetType } = {}
            const errors: { [key: string]: IntermediateErrorType } = {}
            let hasErrors = false
            this.processStream(
                limiter,
                data => {
                    return wrap.UnsafePromise(promisify(data.value, data.key)).reworkAndCatch(
                        error => {
                            hasErrors = true
                            errors[data.key] = error
                            return onData(data.value, data.key)
                        },
                        theResult => {
                            results[data.key] = theResult
                            return onData(data.value, data.key)
                        }
                    )
                },
                (aborted, endData) => {
                    if (aborted || hasErrors) {
                        handleDataOrPromise(
                            errorHandler(aborted, new KeyValueStream(streamifyDictionary(errors)).mapEndData(() => result(endData))),
                            theResult => {
                                onError(theResult)
                            })
                    } else {
                        onSuccess(new KeyValueStream(streamifyDictionary(results)).mapEndData(() => result(endData)))
                    }
                }
            )
        })
    }
}
