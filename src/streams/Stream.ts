import { IInSafePromise, IInUnsafePromise, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { FilterResult, IStream, ProcessStream } from "./IStream"
import { streamifyArray} from "./streamifyArray"

export class Stream<DataType> implements IStream<DataType> {
    public readonly processStream: ProcessStream<DataType>
    constructor(
        streamGetter: ProcessStream<DataType>,
    ) {
        this.processStream = streamGetter
    }
    public toArray(limiter: null | StreamLimiter, onAborted: (() => void) | null) {
        const array: DataType[] = []
        this.processStream(limiter, data => array.push(data), aborted => { if (aborted && onAborted !== null) { onAborted() } })
        return array
    }

    public map<NewDataType>(onData: (data: DataType) => IInSafePromise<NewDataType>): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => onData(data).handleSafePromise(result => newOnData(result, abort)),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public mapRaw<NewDataType>(onData: (data: DataType) => NewDataType): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => newOnData(onData(data), abort),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType) => IInSafePromise<FilterResult<NewDataType>>,
    ): IStream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => {
                    const filterResult = onData(data)
                    filterResult.handleSafePromise(result => {
                        if (result[0]) {
                            newOnData(result[1], abort)
                        }
                    })

                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => IInSafePromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                (data, _abort) => {
                    onData(currentValue, data).handleSafePromise(result => currentValue = result)
                },
                _aborted => {
                    onResult(currentValue)
                }
            )
        })
    }
    public tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | StreamLimiter,
        promisify: (entry: DataType) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IStream<TargetType>, TargetErrorType> {
        return new UnsafePromise<IStream<TargetType>, TargetErrorType>((onError, onSuccess) => {
            const results: TargetType[] = []
            const errors: IntermediateErrorType[] = []
            let hasErrors = false
            this.processStream(
                limiter,
                data => {
                    promisify(data).handleUnsafePromise(
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
                    if (aborted || hasErrors) {
                        errorHandler(aborted, new Stream(streamifyArray(errors))).handleSafePromise(result => {
                            onError(result)
                        })
                    } else {
                        onSuccess(new Stream(streamifyArray(results)))
                    }
                }
            )
        })
    }
}
