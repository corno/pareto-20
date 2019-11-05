import { IInSafePromise, IInUnsafePromise, KeyValuePair, StreamLimiter } from "pareto-api"
import { streamifyDictionary } from "../../functions/streamifyDictionary"
import { IKeyValueStream } from "../../interfaces/IKeyValueStream"
import { ISafePromise } from "../../interfaces/ISafePromise"
import { IUnsafePromise } from "../../interfaces/IUnsafePromise"
import { SafePromise } from "./SafePromise"
import { Stream } from "./Stream"
import { UnsafePromise } from "./UnsafePromise"

type OnData<DataType> = (data: KeyValuePair<DataType>, abort: () => void) => void

export type KeyValueStreamGetter<DataType> = (limiter: StreamLimiter, onData: OnData<DataType>, onEnd: (aborted: boolean) => void) => void

// tslint:disable-next-line: max-classes-per-file
export class KeyValueStream<DataType> implements IKeyValueStream<DataType> {
    public readonly process: (limiter: StreamLimiter, onData: OnData<DataType>, onEnd: (aborted: boolean) => void) => void
    constructor(
        streamGetter: KeyValueStreamGetter<DataType>,
    ) {
        this.process = streamGetter
    }
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType, key: string) => IInSafePromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.process(
                null, //no limiter
                (data, _abort) => {
                    onData(currentValue, data.value, data.key).handle(result => {
                        currentValue = result
                    })
                },
                _aborted => {
                    onResult(currentValue)
                }
            )
        })
    }
    public mapDataRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType> {
        return new KeyValueStream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.process(
                newLimiter,
                (data, abort) => newOnData({ key: data.key, value: onData(data.value, data.key) }, abort),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: StreamLimiter,
        promisify: (entry: DataType, entryName: string) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType>, TargetErrorType> {
        return new UnsafePromise<IKeyValueStream<TargetType>, TargetErrorType>((onError, onSuccess) => {
            const results: { [key: string]: TargetType } = {}
            const errors: { [key: string]: IntermediateErrorType } = {}
            let hasErrors = false
            this.process(
                limiter,
                data => {
                    promisify(data.value, data.key).handle(
                        error => {
                            hasErrors = true
                            errors[data.key] = error
                        },
                        result => {
                            results[data.key] = result
                        }
                    )
                },
                aborted => {
                    if (aborted || hasErrors) {
                        errorHandler(aborted, new KeyValueStream(streamifyDictionary(errors))).handle(result => {
                            onError(result)
                        })
                    } else {
                        onSuccess(new KeyValueStream(streamifyDictionary(results)))
                    }
                }
            )
        })

    }

    public filterRaw<NewDataType>(
        onData: (data: DataType, key: string) => [false] | [true, NewDataType],
    ): KeyValueStream<NewDataType> {
        return new KeyValueStream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.process(
                newLimiter,
                (data, abort) => {
                    const filterResult = onData(data.value, data.key)
                    if (filterResult[0]) {
                        newOnData({ key: data.key, value: filterResult[1] }, abort)
                    }
                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public toKeysStream() {
        return new Stream<string>((limiter, onData, onEnd) => {
            this.process(limiter, (data, abort) => onData(data.key, abort), onEnd)
        })
    }
}
