import * as api from "pareto-api"
import { Value } from "../values/SafeValue"
import { UnsafeValue } from "../values/UnsafeValue"
import { KeyValueStream } from "../streams/KeyValueStream"
import { streamifyDictionary } from "../streams/streamifyDictionary"
import { ILookup } from "./ILookup"
import { IKeyValueStream } from "../streams/IKeyValueStream"
import { streamifyArray } from "../streams/streamifyArray"
import { IStream } from "pareto-api"

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
    public toStream<StreamType>(
        callback: (entry: StoredData, entryName: string) => StreamType,
    ): IKeyValueStream<StreamType, null> {
        return new KeyValueStream<StoredData, null>(
            streamifyDictionary(this.implementation)
        ).mapRaw<StreamType>((entry, entryName) => callback(entry, entryName))
    }
    public toKeysStream(
    ): IStream<string, null> {
        return streamifyArray(Object.keys(this.implementation))
    }
    public toLookup<NewType>(callback: (entry: StoredData, entryName: string) => NewType): ILookup<NewType> {
        return {
            getEntry: (entryName: string): UnsafeValue<NewType, null> => {
                return new UnsafeValue<NewType, null>((onError, onSuccess) => {
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
    ): api.IUnsafeValue<BaseDictionary<TargetType>, NewErrorType> {
        return new UnsafeValue<BaseDictionary<TargetType>, NewErrorType>((onError, onSuccess) => {
            const resultDictionary: { [key: string]: TargetType } = {}
            const errorDictionary: { [key: string]: StoredData } = {}
            let hasErrors = false
            //FIX make this work asynchronously
            const keys = Object.keys(this.implementation)
            keys.forEach(key => {
                const entry = this.implementation[key]
                lookup.getEntry(key).handle(
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
    public reduce<ResultType>(
        initialValue: ResultType,
        callback: (previousValue: ResultType, entry: StoredData, entryName: string) => api.IValue<ResultType>,
    ): api.IValue<ResultType> {
        return new Value<ResultType>(onResult => {
            const keys = Object.keys(this.implementation)
            let currentValue = initialValue
            let currentIndex = 0
            while (currentIndex !== keys.length) {
                const currentKey = keys[currentIndex]
                const currentEntry = this.implementation[currentKey]
                callback(currentValue, currentEntry, currentKey).handle(result => {
                    currentValue = result
                })
                currentIndex += 1
            }
            onResult(currentValue)
        })
    }
}
