import * as api from "pareto-api"
import { ISafePromise, DataOrPromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise, result, handleDataOrPromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { IKeyValueStream } from "./IKeyValueStream"
import { Stream } from "./Stream"
import { streamifyDictionary } from "./streamifyDictionary"
import { KeyValuePair } from "pareto-api"
import { wrap } from "../wrap"
import { FilterResult } from "./IStream"

type OnData<DataType> = api.OnData<KeyValuePair<DataType>>

export type ProcessKeyValueStreamFunction<DataType, EndDataType> = (limiter: null | api.StreamLimiter, onData: OnData<DataType>, onEnd: (aborted: boolean, data: EndDataType) => void) => void

export class KeyValueStream<DataType, EndDataType> implements IKeyValueStream<DataType, EndDataType> {
    public readonly processStream: ProcessKeyValueStreamFunction<DataType, EndDataType>
    constructor(
        processStreamFunction: ProcessKeyValueStreamFunction<DataType, EndDataType>,
    ) {
        this.processStream = processStreamFunction
    }
    public toKeysStream(): Stream<string, EndDataType> {
        return new Stream<string, EndDataType>((limiter, onData, onEnd) => {
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


    public map<NewDataType>(onData: (data: DataType, key: string) => DataOrPromise<NewDataType>): IKeyValueStream<NewDataType, EndDataType> {
        return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
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
    public mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, EndDataType> {
        return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
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
        onData: (data: DataType, key: string) => DataOrPromise<FilterResult<NewDataType>>,
    ): KeyValueStream<NewDataType, EndDataType> {
        return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                data => {
                    const onDataResult = onData(data.value, data.key)
                    return wrap.DataOrPromise(onDataResult).mapResult(filterResult => {
                        if (filterResult[0]) {
                            const newResult = newOnData({
                                key: data.key,
                                value: filterResult[1],
                            })
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
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType, key: string) => DataOrPromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                data => {
                    return wrap.DataOrPromise(onData(currentValue, data.value, data.key)).mapResult(theResult => {
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
        promisify: (entry: DataType, entryName: string) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, EndDataType>) => DataOrPromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType> {
        return new UnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType>((onError, onSuccess) => {
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
                            return result(false)
                        },
                        theResult => {
                            results[data.key] = theResult
                            return result(false)
                        }
                    )
                },
                (aborted, endData) => {
                    if (aborted || hasErrors) {
                        handleDataOrPromise(
                            errorHandler(aborted, new KeyValueStream(streamifyDictionary(errors, endData))),
                            theResult => {
                                onError(theResult)
                            })
                    } else {
                        onSuccess(new KeyValueStream(streamifyDictionary(results, endData)))
                    }
                }
            )
        })
    }
}
