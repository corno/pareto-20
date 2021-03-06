import * as api from "pareto-api"
import { createValue } from "../value/createSafeValue"
import { createUnsafeValue } from "../value/createUnsafeValue"
import { createKeyValueStream } from "../stream/createKeyValueStream"
import { streamifyDictionary } from "../stream/streamifyDictionary"
import { ILookup } from "./ILookup"
import { IKeyValueStream } from "../stream/IKeyValueStream"
import { createArray } from "../array/createArray"
import { IStream } from "pareto-api"
import { IUnsafeValue } from "../value/IUnsafeValue"

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
        return createKeyValueStream<StoredData, null>(
            streamifyDictionary(this.implementation)
        ).mapRaw<StreamType>((entry, entryName) => callback(entry, entryName))
    }
    public toKeysStream(
    ): IStream<string, null> {
        return createArray(Object.keys(this.implementation)).streamify()
    }
    public toLookup<NewType>(callback: (entry: StoredData, entryName: string) => NewType): ILookup<NewType> {
        return {
            getEntry: (entryName: string): IUnsafeValue<NewType, null> => {
                return createUnsafeValue<NewType, null>((onError, onSuccess) => {
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
        return createUnsafeValue<BaseDictionary<TargetType>, NewErrorType>((onError, onSuccess) => {
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
        return createValue<ResultType>(onResult => {
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
