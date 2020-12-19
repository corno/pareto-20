import * as api from "pareto-api"
// import { ISafePromise } from "../promises/ISafePromise"
// import { IUnsafePromise } from "../promises/IUnsafePromise"
// import { SafePromise, result, handleDataOrPromise } from "../promises/SafePromise"
// import { UnsafePromise } from "../promises/UnsafePromise"
import { IKeyValueStream } from "./IKeyValueStream"
// import { Stream } from "./Stream"
// import { streamifyDictionary } from "./streamifyDictionary"
// import { wrap } from "../wrap"
// import { FilterResult } from "./IStream"

class KeyValueStream<DataType, EndDataType> implements IKeyValueStream<DataType, EndDataType> {
    public readonly handle: api.HandleKeyValueStreamFunction<DataType, EndDataType>
    constructor(
        processStreamFunction: api.HandleKeyValueStreamFunction<DataType, EndDataType>,
    ) {
        this.handle = processStreamFunction
    }
    // public toKeysStream(): Stream<string, EndDataType> {
    //     return new Stream<string, EndDataType>((limiter, onData, onEnd) => {
    //         this.handle(
    //             limiter,
    //             data => {
    //                 return onData(data.key)
    //             },
    //             (aborted, endData) => {
    //                 onEnd(aborted, endData)
    //             }
    //         )
    //     })
    // }


    // public map<NewDataType>(onData: (data: DataType, key: string) => api.IValue<NewDataType>): IKeyValueStream<NewDataType, EndDataType> {
    //     return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
    //         this.handle(
    //             newLimiter,
    //             data => {
    //                 const promise = wrap.Value(onData(data.value, data.key))
    //                 return promise.mapResult(theResult => {
    //                     return newOnData({ key: data.key, value: theResult })
    //                 })
    //             },
    //             (aborted, data) => newOnEnd(aborted, data)
    //         )
    //     })
    // }
    // public mapEndData<NewEndDataType>(convert: (data: EndDataType) => api.IValue<NewEndDataType>): IKeyValueStream<DataType, NewEndDataType> {
    //     return new KeyValueStream<DataType, NewEndDataType>((newLimiter, newOnData, newOnEnd) => {
    //         this.handle(
    //             newLimiter,
    //             newOnData,
    //             (aborted, data) => {
    //                 handleDataOrPromise(
    //                     convert(data),
    //                     newData => {
    //                         newOnEnd(aborted, newData)

    //                     }
    //                 )
    //             }
    //         )
    //     })
    // }
    public mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType, EndDataType> {
        return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newConsumer) => {
            this.handle(
                newLimiter,
                {
                    onData:
                        data => {
                            const dataResult = newConsumer.onData({ key: data.key, value: onData(data.value, data.key) })
                            return dataResult
                        },
                    onEnd: (aborted, data) => newConsumer.onEnd(aborted, data),
                }
            )
        })
    }
    // public filter<NewDataType>(
    //     onData: (data: DataType, key: string) => api.IValue<FilterResult<NewDataType>>,
    // ): KeyValueStream<NewDataType, EndDataType> {
    //     return new KeyValueStream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
    //         this.handle(
    //             newLimiter,
    //             data => {
    //                 const onDataResult = onData(data.value, data.key)
    //                 return wrap.Value(onDataResult).mapResult(filterResult => {
    //                     if (filterResult[0]) { //keep, don't filter out
    //                         return newOnData({
    //                             key: data.key,
    //                             value: filterResult[1],
    //                         })
    //                     }
    //                     return result(filterResult[1])
    //                 })
    //             },
    //             (aborted, endData) => newOnEnd(aborted, endData)
    //         )
    //     })
    // }
    // public reduce<ResultType>(
    //     initialValue: ResultType,
    //     onData: (previousValue: ResultType, data: DataType, key: string) => api.IValue<ResultType>,
    // ): ISafePromise<ResultType> {
    //     return new SafePromise<ResultType>(onResult => {
    //         let currentValue = initialValue
    //         this.handle(
    //             null, //no limiter
    //             data => {
    //                 return wrap.Value(onData(currentValue, data.value, data.key)).mapResult(theResult => {
    //                     currentValue = theResult[0]
    //                     return result(theResult[1])
    //                 })
    //             },
    //             _aborted => {
    //                 onResult(currentValue)
    //             }
    //         )
    //     })
    // }
    // public tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
    //     limiter: null | api.StreamLimiter,
    //     promisify: (entry: DataType, entryName: string) => api.IUnsafeValue<TargetType, IntermediateErrorType>,
    //     errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType, EndDataType>) => api.IValue<TargetErrorType>,
    // ): IUnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType> {
    //     return new UnsafePromise<IKeyValueStream<TargetType, EndDataType>, TargetErrorType>((onError, onSuccess) => {
    //         const results: { [key: string]: TargetType } = {}
    //         const errors: { [key: string]: IntermediateErrorType } = {}
    //         let hasErrors = false
    //         this.handle(
    //             limiter,
    //             data => {
    //                 return wrap.UnsafePromise(promisify(data.value, data.key)).reworkAndCatch(
    //                     error => {
    //                         hasErrors = true
    //                         errors[data.key] = error
    //                         return onData(data.value, data.key)
    //                     },
    //                     theResult => {
    //                         results[data.key] = theResult
    //                         return onData(data.value, data.key)
    //                     }
    //                 )
    //             },
    //             (aborted, endData) => {
    //                 if (aborted || hasErrors) {
    //                     handleDataOrPromise(
    //                         errorHandler(aborted, new KeyValueStream(streamifyDictionary(errors)).mapEndData(() => result(endData))),
    //                         theResult => {
    //                             onError(theResult)
    //                         })
    //                 } else {
    //                     onSuccess(new KeyValueStream(streamifyDictionary(results)).mapEndData(() => result(endData)))
    //                 }
    //             }
    //         )
    //     })
    // }
}

export function createKeyValueStream<DataType, EndDataType>(
    processStreamFunction: api.HandleKeyValueStreamFunction<DataType, EndDataType>,

): IKeyValueStream<DataType, EndDataType> {
    return new KeyValueStream(
        processStreamFunction
    )
}