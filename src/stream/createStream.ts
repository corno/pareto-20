import * as api from "pareto-api"
import { IStream } from "./IStream"
import { wrap } from "../wrap"
import { createValue, value } from "../value/createSafeValue"
import { success, error, createUnsafeValue } from "../value/createUnsafeValue"
import { IUnsafeValue } from "../value/IUnsafeValue"
import { IValue } from "../value/ISafeValue"
//import { IUnsafeValue } from "../values/IUnsafeValue"

// export type HandleStreamFunction<Data, EndData> = (
//     limiter: api.StreamLimiter,
//     onData: (data: Data) => api.IValue<boolean>,
//     onEnd: (aborted: boolean, endData: EndData) => api.IValue<null>
// ) => api.IUnsafeValue<null, null>;

class Stream<DataType, EndDataType>
    implements IStream<DataType, EndDataType> {
    public readonly handle: api.HandleStreamFunction<DataType, EndDataType>
    constructor(
        handleStreamFunction: api.HandleStreamFunction<DataType, EndDataType>,
    ) {
        this.handle = handleStreamFunction
    }
    // public toArray(
    //     limiter: null | api.StreamLimiter,
    // ): api.IUnsafeValue<DataType[], null> {
    //     const array: DataType[] = []
    //     return wrap.UnsafeDataOrPromise(this.handle(
    //         limiter,
    //         data => {
    //             array.push(data)
    //             return result(null)
    //         },
    //         _aborted => {
    //             return result(null)
    //         }
    //     )).try(aborted => {
    //         if (aborted) {
    //             return error(null)
    //         } else {
    //             return success(array)
    //         }
    //     })
    // }

    tryToConsume<ResultType, ErrorType>(
        limiter: api.StreamLimiter,
        consumer: {
            onData: (data: DataType) => api.IValue<boolean>
            onEnd: (aborted: boolean, endData: EndDataType) => api.IUnsafeValue<ResultType, ErrorType>
        },
    ): IUnsafeValue<ResultType, ErrorType> {
        return createUnsafeValue((onError, onResult) => {

            this.handle(
                limiter,
                {
                    onData: data => {
                        return consumer.onData(data)
                    },
                    onEnd: (aborted, endData) => {
                        return consumer.onEnd(aborted, endData).handle(
                            theError => {
                                onError(theError)
                            },
                            theResult => {
                                onResult(theResult)
                            }
                        )
                    },
                }
            )
        })
    }

    consume<ResultType>(
        limiter: api.StreamLimiter,
        consumer: {
            onData: (data: DataType) => api.IValue<boolean>
            onEnd: (aborted: boolean, endData: EndDataType) => api.IValue<ResultType>
        },
    ): IValue<ResultType> {
        return createValue(onResult => {

            this.handle(
                limiter,
                {
                    onData: data => {
                        return consumer.onData(data)
                    },
                    onEnd: (aborted, endData) => {
                        return consumer.onEnd(aborted, endData).handle(
                            theResult => {
                                onResult(theResult)
                            }
                        )
                    },
                }
            )
        })
    }
    public map<NewDataType>(convert: (data: DataType) => api.IValue<NewDataType>): IStream<NewDataType, EndDataType> {
        return new Stream<NewDataType, EndDataType>((newLimiter, newConsumer) => {
            let endDataX: EndDataType
            return this.tryToConsume(
                newLimiter,
                {
                    onData: data => {
                        return wrap.Value(convert(data)).mapResult(firstResult => {
                            return newConsumer.onData(firstResult)
                        })
                    },
                    onEnd: (_aborted, endData) => {
                        endDataX = endData
                        return value(null)
                    },
                }
            ).rework(
                () => {
                    newConsumer.onEnd(true, endDataX)
                    return error(null)
                },
                () => {
                    newConsumer.onEnd(false, endDataX)
                    return success(null)
                },
            )
        })
    }

    public mapEndData<NewEndDataType>(convert: (data: EndDataType) => api.IValue<NewEndDataType>): IStream<DataType, NewEndDataType> {
        return new Stream<DataType, NewEndDataType>((newLimiter, newConsumer) => {
            return this.handle(
                newLimiter,
                {
                    onData: data => newConsumer.onData(data),
                    onEnd: (aborted, data) => {
                        return wrap.Value(convert(data)).handle(
                            newEndData => {
                                newConsumer.onEnd(aborted, newEndData)
                            }
                        )
                    },
                }
            )
        })
    }
    // public mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType, EndDataType> {
    //     return new Stream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
    //         this.handle(
    //             newLimiter,
    //             data => {
    //                 return newOnData(onData(data))
    //             },
    //             (aborted, endData) => newOnEnd(aborted, endData)
    //         )
    //     })
    // }
    // public filter<NewDataType>(
    //     onData: (data: DataType) => api.IValue<FilterResult<NewDataType>>,
    // ): IStream<NewDataType, EndDataType> {
    //     return new Stream<NewDataType, EndDataType>((newLimiter, newOnData, newOnEnd) => {
    //         return this.handle(
    //             newLimiter,
    //             data => {
    //                 const onDataResult = onData(data)
    //                 return wrap.Value(onDataResult).mapResult(filterResult => {
    //                     if (filterResult[0]) {
    //                         return wrap.Value(newOnData(filterResult[1]))
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
    //     onData: (previousValue: ResultType, data: DataType) => api.IValue<ResultType>,
    // ): ISafePromise<ResultType> {
    //     let currentValue = initialValue
    //     return wrap.Value(this.handle(
    //         null, //no limiter
    //         data => {
    //             return wrap.Value(onData(currentValue, data)).mapResult(theResult => {
    //                 currentValue = theResult
    //                 return result(null)
    //             })
    //         },
    //         _aborted => {
    //             return result(null)
    //         }
    //     )).mapResult(() => {
    //         return result(currentValue)
    //     })
    // }
    // public tryAll<TargetType, IntermediateErrorType>(
    //     limiter: null | api.StreamLimiter,
    //     promisify: (data: DataType) => api.IUnsafeValue<TargetType, IntermediateErrorType>,
    // ): IUnsafePromise<
    //     IStream<TargetType, EndDataType>,
    //     {
    //         aborted: boolean
    //         errors: IStream<IntermediateErrorType, EndDataType>
    //     }
    // > {
    //     return new UnsafePromise<
    //         IStream<TargetType, EndDataType>,
    //         IUnsafePromise<
    //             IStream<TargetType, EndDataType>,
    //             {
    //                 aborted: boolean
    //                 errors: IStream<IntermediateErrorType, EndDataType>
    //             }
    //         >
    //     >((onError, onSuccess) => {
    //         const results: TargetType[] = []
    //         const errors: IntermediateErrorType[] = []
    //         let hasErrors = false
    //         this.handle(
    //             limiter,
    //             data => {
    //                 return wrap.UnsafePromise(promisify(data)).reworkAndCatch(
    //                     theError => {
    //                         hasErrors = true
    //                         errors.push(theError)
    //                         return onData(data)
    //                     },
    //                     theResult => {
    //                         results.push(theResult)
    //                         return onData(data)
    //                     }
    //                 )
    //             },
    //             (aborted, endData) => {
    //                 if (aborted || hasErrors) {
    //                     handleDataOrPromise(
    //                         errorHandler(
    //                             aborted,
    //                             new Stream(streamifyArray(errors)).mapEndData(() => result(endData))
    //                         ),
    //                         theResult => {
    //                             onError(theResult)
    //                         }
    //                     )
    //                 } else {
    //                     onSuccess(new Stream(streamifyArray(results)).mapEndData(() => result(endData)))
    //                 }
    //             }
    //         )
    //     })
    // }
    public mergeUnsafeValues<DataType2, ReturnType, EndDataType2, TargetType, IntermediateErrorType, ErrorType>(
        _limiter: null | api.StreamLimiter,
        _onData: (entry: DataType2) => [api.IUnsafeValue<TargetType, IntermediateErrorType>, ReturnType],
        _createError: (aborted: boolean, errors: IStream<IntermediateErrorType, EndDataType2>) => ErrorType,
    ): IUnsafeValue<IStream<TargetType, EndDataType2>, ErrorType> {
        throw new Error("IMPLEMENT ME")
        // return new UnsafePromise<IStream<TargetType, EndDataType>, ErrorType>((onError, onSuccess) => {
        //     let hasErrors = false
        //     const errors: IntermediateErrorType[] = []
        //     const results: TargetType[] = []
        //     stream.handle(
        //         limiter,
        //         data => {
        //             const rv = onData(
        //                 data
        //             )
        //             return wrap.UnsafePromise(rv[0]).reworkAndCatch(
        //                 error => {
        //                     hasErrors = true
        //                     errors.push(error)
        //                     return result(rv[1])
        //                 },
        //                 theResult => {
        //                     results.push(theResult)
        //                     return result(rv[1])
        //                 }
        //             )
        //         },
        //         (aborted, endData) => {
        //             if (hasErrors) {
        //                 onError(createError(aborted, new StaticStream(errors).mapEndData(() => result(endData))))
        //             } else {
        //                 onSuccess(new StaticStream(results).mapEndData(() => result( endData)))
        //             }
        //         }
        //     )
        // })

    }
}

export function createStream<DataType, EndDataType>(
    handleStreamFunction: api.HandleStreamFunction<DataType, EndDataType>,
): IStream<DataType, EndDataType> {
    return new Stream(handleStreamFunction)
}