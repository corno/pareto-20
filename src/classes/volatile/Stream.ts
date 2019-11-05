import { IInSafePromise, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../../interfaces/ISafePromise"
import { FilterResult, IStream, StreamGetter } from "../../interfaces/IStream"
import { SafePromise } from "./SafePromise"

export class Stream<DataType> implements IStream<DataType> {
    public readonly process: StreamGetter<DataType>
    constructor(
        streamGetter: StreamGetter<DataType>,
    ) {
        this.process = streamGetter
    }
    public mapDataRaw<NewDataType>(onData: (data: DataType) => NewDataType): Stream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.process(
                newLimiter,
                (data, abort) => newOnData(onData(data), abort),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public filterRaw<NewDataType>(
        onData: (data: DataType) => FilterResult<NewDataType>,
    ): Stream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.process(
                newLimiter,
                (data, abort) => {
                    const filterResult = onData(data)
                    if (filterResult[0]) {
                        newOnData(filterResult[1], abort)
                    }
                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType) => IInSafePromise<FilterResult<NewDataType>>,
    ): Stream<NewDataType> {
        return new Stream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.process(
                newLimiter,
                (data, abort) => {
                    const filterResult = onData(data)
                    filterResult.handle(result => {
                        if (result[0]) {
                            newOnData(result[1], abort)
                        }
                    })

                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public reduceRaw<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType) => ResultType): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.process(
                null, //no limiter
                (data, _abort) => {
                    currentValue = onData(currentValue, data)
                },
                _aborted => {
                    onResult(currentValue)
                }
            )
        })
    }
    public toArray(limiter: StreamLimiter, onAborted: (() => void) | null) {
        const array: DataType[] = []
        this.process(limiter, data => array.push(data), aborted => { if (aborted && onAborted !== null) { onAborted() } })
        return array
    }
}
