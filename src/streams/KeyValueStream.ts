import { IInSafePromise, IInUnsafePromise, KeyValuePair, StreamLimiter } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { SafePromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { IKeyValueStream } from "./IKeyValueStream"
import { Stream } from "./Stream"
import { streamifyDictionary } from "./streamifyDictionary"

type OnData<DataType> = (data: KeyValuePair<DataType>, abort: () => void) => void

export type KeyValueStreamGetter<DataType> = (limiter: null | StreamLimiter, onData: OnData<DataType>, onEnd: (aborted: boolean) => void) => void

// tslint:disable-next-line: max-classes-per-file
export class KeyValueStream<DataType> implements IKeyValueStream<DataType> {
    public readonly processStream: (limiter: null | StreamLimiter, onData: OnData<DataType>, onEnd: (aborted: boolean) => void) => void
    constructor(
        streamGetter: KeyValueStreamGetter<DataType>,
    ) {
        this.processStream = streamGetter
    }
    public toKeysStream() {
        return new Stream<string>((limiter, onData, onEnd) => {
            this.processStream(limiter, (data, abort) => onData(data.key, abort), onEnd)
        })
    }


    public map<NewDataType>(onData: (data: DataType, key: string) => IInSafePromise<NewDataType>): IKeyValueStream<NewDataType> {
        return new KeyValueStream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => onData(data.value, data.key).handleSafePromise(result => newOnData({ key: data.key, value: result }, abort)),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public mapRaw<NewDataType>(onData: (data: DataType, key: string) => NewDataType): IKeyValueStream<NewDataType> {
        return new KeyValueStream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => newOnData({ key: data.key, value: onData(data.value, data.key) }, abort),
                aborted => newOnEnd(aborted)
            )
        })
    }
    public filter<NewDataType>(
        onData: (data: DataType, key: string) => [false] | [true, IInSafePromise<NewDataType>],
    ): KeyValueStream<NewDataType> {
        return new KeyValueStream<NewDataType>((newLimiter, newOnData, newOnEnd) => {
            this.processStream(
                newLimiter,
                (data, abort) => {
                    const filterResult = onData(data.value, data.key)
                    if (filterResult[0]) {
                        filterResult[1].handleSafePromise(result => newOnData({ key: data.key, value: result }, abort))
                    }
                },
                aborted => newOnEnd(aborted)
            )
        })
    }
    public reduce<ResultType>(initialValue: ResultType, onData: (previousValue: ResultType, data: DataType, key: string) => IInSafePromise<ResultType>): ISafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            let currentValue = initialValue
            this.processStream(
                null, //no limiter
                (data, _abort) => {
                    onData(currentValue, data.value, data.key).handleSafePromise(result => {
                        currentValue = result
                    })
                },
                _aborted => {
                    onResult(currentValue)
                }
            )
        })
    }
    public tryAll<TargetType, IntermediateErrorType, TargetErrorType>(
        limiter: null | StreamLimiter,
        promisify: (entry: DataType, entryName: string) => IInUnsafePromise<TargetType, IntermediateErrorType>,
        errorHandler: (aborted: boolean, errors: IKeyValueStream<IntermediateErrorType>) => IInSafePromise<TargetErrorType>
    ): IUnsafePromise<IKeyValueStream<TargetType>, TargetErrorType> {
        return new UnsafePromise<IKeyValueStream<TargetType>, TargetErrorType>((onError, onSuccess) => {
            const results: { [key: string]: TargetType } = {}
            const errors: { [key: string]: IntermediateErrorType } = {}
            let hasErrors = false
            this.processStream(
                limiter,
                data => {
                    promisify(data.value, data.key).handleUnsafePromise(
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
                        errorHandler(aborted, new KeyValueStream(streamifyDictionary(errors))).handleSafePromise(result => {
                            onError(result)
                        })
                    } else {
                        onSuccess(new KeyValueStream(streamifyDictionary(results)))
                    }
                }
            )
        })
    }
}
