import * as api from "pareto-api"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { IStream } from "./IStream"
import { StaticStream } from "./StaticStream"
import { Stream } from "./Stream"
import { wrap } from "../wrap"
import { result } from "../promises/SafePromise"

export function mergeStreamOfUnsafePromises<DataType, ReturnType, EndDataType, TargetType, IntermediateErrorType, ErrorType>(
    stream: api.IStream<DataType, ReturnType, EndDataType>,
    limiter: null | api.StreamLimiter,
    onData: (entry: DataType) => [api.UnsafeDataOrPromise<TargetType, IntermediateErrorType>, ReturnType],
    createError: (aborted: boolean, errors: Stream<IntermediateErrorType, boolean, EndDataType>) => ErrorType,
): IUnsafePromise<IStream<TargetType, boolean, EndDataType>, ErrorType> {
    return new UnsafePromise<IStream<TargetType, boolean, EndDataType>, ErrorType>((onError, onSuccess) => {
        let hasErrors = false
        const errors: IntermediateErrorType[] = []
        const results: TargetType[] = []
        stream.processStream(
            limiter,
            data => {
                const rv = onData(
                    data
                )
                return wrap.UnsafePromise(rv[0]).reworkAndCatch(
                    error => {
                        hasErrors = true
                        errors.push(error)
                        return result(rv[1])
                    },
                    theResult => {
                        results.push(theResult)
                        return result(rv[1])
                    }
                )
            },
            (aborted, endData) => {
                if (hasErrors) {
                    onError(createError(aborted, new StaticStream(errors).mapEndData(() => result(endData))))
                } else {
                    onSuccess(new StaticStream(results).mapEndData(() => result( endData)))
                }
            }
        )
    })
}
