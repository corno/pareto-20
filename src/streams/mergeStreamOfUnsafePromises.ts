import * as api from "pareto-api"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { IStream } from "./IStream"
import { StaticStream } from "./StaticStream"
import { Stream } from "./Stream"
import { wrap } from "../wrap"
import { result } from "../promises/SafePromise"

export function mergeStreamOfUnsafePromises<DataType, EndDataType, TargetType, IntermediateErrorType, ErrorType>(
    stream: api.IStream<DataType, EndDataType>,
    limiter: null | api.StreamLimiter,
    promisify: (entry: DataType) => api.IUnsafePromise<TargetType, IntermediateErrorType>,
    createError: (aborted: boolean, errors: Stream<IntermediateErrorType, EndDataType>) => ErrorType,
    abortOnError: boolean,
): IUnsafePromise<IStream<TargetType, EndDataType>, ErrorType> {
    return new UnsafePromise<IStream<TargetType, EndDataType>, ErrorType>((onError, onSuccess) => {
        let hasErrors = false
        const errors: IntermediateErrorType[] = []
        const results: TargetType[] = []
        stream.processStream(
            limiter,
            data => {
                return wrap.UnsafePromise(promisify(
                    data
                )).reworkAndCatch(
                    error => {
                        hasErrors = true
                        errors.push(error)
                        return result(abortOnError)
                    },
                    theResult => {
                        results.push(theResult)
                        return result(false)
                    }
                )
            },
            (aborted, endData) => {
                if (hasErrors) {
                    onError(createError(aborted, new StaticStream(errors, endData)))
                } else {
                    onSuccess(new StaticStream(results, endData))
                }
            }
        )
    })
}
