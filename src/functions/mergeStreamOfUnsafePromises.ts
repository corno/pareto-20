import { IInStream, IInUnsafePromise, StreamLimiter } from "pareto-api"
import { StaticStream } from "../classes/builders/StaticStream"
import { Stream } from "../classes/volatile/Stream"
import { UnsafePromise } from "../classes/volatile/UnsafePromise"
import { IStream } from "../interfaces/IStream"
import { IUnsafePromise } from "../interfaces/IUnsafePromise"

export function mergeStreamOfUnsafePromises<DataType, TargetType, IntermediateErrorType, ErrorType>(
    stream: IInStream<DataType>,
    limiter: StreamLimiter,
    promisify: (entry: DataType) => IInUnsafePromise<TargetType, IntermediateErrorType>,
    createError: (aborted: boolean, errors: Stream<IntermediateErrorType>) => ErrorType
): IUnsafePromise<IStream<TargetType>, ErrorType> {
    return new UnsafePromise<IStream<TargetType>, ErrorType>((onError, onSuccess) => {
        let hasErrors = false
        const errors: IntermediateErrorType[] = []
        const results: TargetType[] = []
        stream.process(
            limiter,
            data => {
                promisify(data).handle(
                    error => {
                        hasErrors = true
                        errors.push(error)
                    },
                    result => {
                        results.push(result)
                    }
                )
            },
            aborted => {
                if (hasErrors) {
                    onError(createError(aborted, new StaticStream(errors)))
                } else {
                    onSuccess(new StaticStream(results))
                }
            }
        )
    })
}
