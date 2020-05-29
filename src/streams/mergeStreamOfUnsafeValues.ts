import * as api from "pareto-api"
import { IUnsafeValue } from "../values/IUnsafeValue"
// import { UnsafePromise } from "../promises/UnsafePromise"
import { IStream } from "./IStream"
// import { StaticStream } from "./StaticStream"
import { Stream } from "./Stream"
// import { wrap } from "../wrap"
// import { result } from "../promises/SafePromise"

export function mergeStreamOfUnsafeValues<DataType, ReturnType, EndDataType, TargetType, IntermediateErrorType, ErrorType>(
    _stream: api.IStream<DataType, EndDataType>,
    _limiter: null | api.StreamLimiter,
    _onData: (entry: DataType) => [api.IUnsafeValue<TargetType, IntermediateErrorType>, ReturnType],
    _createError: (aborted: boolean, errors: Stream<IntermediateErrorType, EndDataType>) => ErrorType,
): IUnsafeValue<IStream<TargetType, EndDataType>, ErrorType> {
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
