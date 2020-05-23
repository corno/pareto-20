import * as api from "pareto-api"
import { SafePromise } from "../promises/SafePromise"
import { UnsafePromise } from "../promises/UnsafePromise"
import { KeyValueStream } from "../streams/KeyValueStream"
import { Stream } from "../streams/Stream"
import { streamifyDictionary } from "../streams/streamifyDictionary"
import { ILookup } from "./ILookup"
import { IKeyValueStream } from "../streams/IKeyValueStream"

// function arrayToDictionary<Type>(array: Type[], keys: string[]) {
//     const dictionary: { [key: string]: Type } = {}
//     array.forEach((element, index) => dictionary[keys[index]] = element)
//     return new BaseDictionary<Type>(dictionary)
// }

export class BaseDictionary<StoredData> {
    protected readonly implementation: { [key: string]: StoredData }
    constructor(
        dictionary: { [key: string]: StoredData },
    ) {
        this.implementation = dictionary
    }
    public toStream<StreamType>(callback: (entry: StoredData, entryName: string) => StreamType): IKeyValueStream<StreamType> {
        return new KeyValueStream<StoredData>(
            streamifyDictionary(this.implementation)
        ).mapRaw<StreamType>((entry, entryName) => callback(entry, entryName))
    }
    public toKeysStream(): Stream<string> {
        return new Stream<string>((_limiter, onData, onEnd) => {
            //FIX implement limiter and abort
            const keys = Object.keys(this.implementation)
            let index = 0
            function processNext() {
                if (index < keys.length) {
                    const key = keys[index]
                    const result = onData(key)
                    function handleResult(abort: boolean) {
                        if (abort) {
                            onEnd(true)
                        } else {
                            processNext()
                        }
                    }
                    if (typeof result === "boolean") {
                        handleResult(result)
                    } else {
                        result.handleSafePromise(promiseResult => {
                            handleResult(promiseResult)
                        })
                    }
                    index += 1
                    processNext()
                } else {
                    onEnd(false)
                }

            }
            processNext()
            index += 1
        })
    }
    public toLookup<NewType>(callback: (entry: StoredData, entryName: string) => NewType): ILookup<NewType> {
        return {
            getEntry: (entryName: string): UnsafePromise<NewType, null> => {
                return new UnsafePromise<NewType, null>((onError, onSuccess) => {
                    const entry = this.implementation[entryName]
                    if (entry === undefined) {
                        onError(null)
                    } else {
                        onSuccess(callback(entry, entryName))
                    }
                })
            },
        }
    }
    public match<SupportType, TargetType, NewErrorType>(
        lookup: api.ISafeLookup<SupportType>,
        resultCreator: (main: StoredData, support: SupportType, key: string) => TargetType,
        missingEntriesErrorCreator: (errors: BaseDictionary<StoredData>) => NewErrorType
    ): UnsafePromise<BaseDictionary<TargetType>, NewErrorType> {
        return new UnsafePromise<BaseDictionary<TargetType>, NewErrorType>((onError, onSuccess) => {
            const resultDictionary: { [key: string]: TargetType } = {}
            const errorDictionary: { [key: string]: StoredData } = {}
            let hasErrors = false
            //FIX make this work asynchronously
            const keys = Object.keys(this.implementation)
            keys.forEach(key => {
                const entry = this.implementation[key]
                lookup.getEntry(key).handleUnsafePromise(
                    _err => {
                        hasErrors = true
                        errorDictionary[key] = entry
                    },
                    supportEntry => {
                        resultDictionary[key] = resultCreator(entry, supportEntry, key)
                    }
                )
            })
            if (hasErrors) {
                onError(missingEntriesErrorCreator(new BaseDictionary(errorDictionary)))
            } else {
                onSuccess(new BaseDictionary(resultDictionary))
            }
        })
    }
    public reduce<ResultType>(initialValue: ResultType, callback: (previousValue: ResultType, entry: StoredData, entryName: string) => api.ISafePromise<ResultType>): SafePromise<ResultType> {
        return new SafePromise<ResultType>(onResult => {
            const keys = Object.keys(this.implementation)
            let currentValue = initialValue
            let currentIndex = 0
            while (currentIndex !== keys.length) {
                const currentKey = keys[currentIndex]
                const currentEntry = this.implementation[currentKey]
                callback(currentValue, currentEntry, currentKey).handleSafePromise(result => {
                    currentValue = result
                })
                currentIndex += 1
            }
            onResult(currentValue)
        })
    }
}
