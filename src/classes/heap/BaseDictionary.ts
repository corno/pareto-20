import {
    IInSafePromise,
} from "pareto-api"
import { streamifyDictionary } from "../../functions/streamifyDictionary"
import { ILookup } from "../../interfaces/ILookup"
import { KeyValueStream } from "../volatile/KeyValueStream"
import { SafePromise } from "../volatile/SafePromise"
import { Stream } from "../volatile/Stream"
import { UnsafePromise } from "../volatile/UnsafePromise"

// function arrayToDictionary<Type>(array: Type[], keys: string[]) {
//     const dictionary: { [key: string]: Type } = {}
//     array.forEach((element, index) => dictionary[keys[index]] = element)
//     return new ReadOnlyDictionary<Type>(dictionary)
// }

export class BaseDictionary<StoredData, OpenData> {
    protected readonly implementation: { [key: string]: StoredData }
    protected readonly opener: (storedData: StoredData, entryName: string) => OpenData
    constructor(
        dictionary: { [key: string]: StoredData },
        opener: (storedData: StoredData, entryName: string) => OpenData,
    ) {
        this.implementation = dictionary
        this.opener = opener
    }
    public toStream() {
        return new KeyValueStream<StoredData>(
            streamifyDictionary(this.implementation)
        ).mapDataRaw<OpenData>((entry, entryName) => this.opener(entry, entryName))
    }
    public toKeysStream() {
        return new Stream<string>((_limiter, onData, onEnd) => {
            //FIX implement limiter and abort
            Object.keys(this.implementation).forEach(key => onData(key, () => { }))
            onEnd(false)
        })
    }
    public forEach(callback: (entry: OpenData, entryName: string) => void) {
        Object.keys(this.implementation).forEach(entryName => callback(this.opener(this.implementation[entryName], entryName), entryName))
    }
    public reduceRaw<ResultType>(initialValue: ResultType, callback: (previousValue: ResultType, entry: OpenData, entryName: string) => ResultType) {
        return Object.keys(this.implementation).reduce((previousValue, entryName) => callback(previousValue, this.opener(this.implementation[entryName], entryName), entryName), initialValue)
    }
    public reduce<ResultType>(initialValue: ResultType, callback: (previousValue: ResultType, entry: OpenData, entryName: string) => IInSafePromise<ResultType>) {
        return new SafePromise<ResultType>(onResult => {
            const keys = Object.keys(this.implementation)
            let currentValue = initialValue
            let currentIndex = 0
            while (currentIndex !== keys.length) {
                const currentKey = keys[currentIndex]
                const currentEntry = this.implementation[currentKey]
                callback(currentValue, opener(currentEntry), currentKey).handle(result => {
                    currentValue = result
                })
                currentIndex += 1
            }
            onResult(currentValue)
        })
    }
    public toLookup<NewType>(callback: (entry: OpenData, entryName: string) => NewType): ILookup<NewType> {
        return {
            getEntry: (entryName: string) => {
                return new UnsafePromise<NewType, null>((onError, onSuccess) => {
                    const entry = this.implementation[entryName]
                    if (entry === undefined) {
                        onError(null)
                    } else {
                        onSuccess(callback(this.opener(entry, entryName), entryName))
                    }
                })
            },
        }
    }
    // public map_x<NewType>(callback: (entry: OpenData, entryName: string) => NewType) {
    //     const keys = Object.keys(this.implementation)
    //     const entriesArray = keys.map(entryName => callback(this.opener(this.implementation[entryName], entryName), entryName))
    //     return arrayToDictionary(entriesArray, keys)
    // }
    // public mergeUnsafePromises_x<TargetType, NewErrorType>(promisify: (entry: OpenData, entryName: string) => IInUnsafePromise<TargetType, NewErrorType>) {
    //     const keys = Object.keys(this.implementation)
    //     const array = keys.map(key => promisify(this.opener(this.implementation[key], key), key))
    //     return mergeArrayOfUnsafePromises(array).mapErrorRaw(errors =>
    //         arrayToDictionary(errors, keys)
    //     ).mapResultRaw(results =>
    //         arrayToDictionary(results, keys)
    //     )
    // }
    // public mergeSafePromises_x<TargetType>(promisify: (entry: OpenData, entryName: string) => IInSafePromise<TargetType>) {
    //     const keys = Object.keys(this.implementation)
    //     const array = keys.map(key => promisify(this.opener(this.implementation[key], key), key))
    //     return mergeArrayOfSafePromises(array).mapResultRaw(results =>
    //         arrayToDictionary(results, keys)
    //     )
    // }
}
