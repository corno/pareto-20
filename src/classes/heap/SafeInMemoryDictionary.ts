import {
    IInSafeLooseDictionary,
    IInSafeStrictDictionary,
    IInUnsafePromise,
    SafeEntryAlreadyExistsError,
    SafeEntryDoesNotExistError,
    SafeTwoWayError,
} from "pareto-api"
import { streamifyArray } from "../../functions/streamifyArray"
import { streamifyDictionary } from "../../functions/streamifyDictionary"
import { IUnsafePromise } from "../../interfaces/IUnsafePromise"
import { result } from "../volatile/SafePromise"
import { error, success, wrap as wrapUnsafePromise } from "../volatile/UnsafePromise"
import { InMemoryReadOnlyDictionary } from "../volatile/InMemoryReadOnlyDictionary"
import { KeyValueStream } from "../volatile/KeyValueStream"
import { SafePromise } from "../volatile/SafePromise"
import { Stream } from "../volatile/Stream"

export class SafeInMemoryDictionary<StoredData, CreateData, OpenData> implements
    IInSafeStrictDictionary<CreateData, OpenData>,
    IInSafeLooseDictionary<CreateData, OpenData> {
    private readonly implementation: { [key: string]: StoredData }
    private readonly creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, null>
    private readonly opener: (storedData: StoredData, entryName: string) => OpenData
    private readonly copier: (storedData: StoredData) => StoredData
    private readonly deleter: (storedData: StoredData) => void
    constructor(
        dictionary: { [key: string]: StoredData },
        creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, null>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        this.implementation = dictionary
        this.creator = creator
        this.opener = opener
        this.copier = copier
        this.deleter = deleter
    }
    public toReadOnlyDictionary() {
        return new InMemoryReadOnlyDictionary(this.implementation, this.opener)
    }
    public toStream() {
        return new KeyValueStream<StoredData>(
            streamifyDictionary(this.implementation)
        ).mapDataRaw<OpenData>((entry, entryName) => this.opener(entry, entryName))
    }
    public copyEntry(sourceName: string, targetName: string): IUnsafePromise<null, SafeTwoWayError> {
        const source = this.implementation[sourceName]
        const doesNotExist = source === undefined
        const alreadyExists = this.implementation[targetName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error({ entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists })
        }
        this.implementation[targetName] = this.copier(source)
        return success(null)
    }
    public deleteEntry(entryName: string): IUnsafePromise<null, SafeEntryDoesNotExistError> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(null)
        }
        delete this.implementation[entryName]
        this.deleter(entry)
        return success(null)
    }
    public getKeys(): SafePromise<Stream<string>> {
        return result(
            new Stream<string>(streamifyArray(Object.keys(this.implementation)))
        )
    }
    public getEntry(entryName: string): IUnsafePromise<OpenData, SafeEntryDoesNotExistError> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(null)
        }
        return success(this.opener(entry, entryName))
    }
    public createEntry(entryName: string, createData: CreateData): IUnsafePromise<null, SafeEntryAlreadyExistsError> {
        if (this.implementation[entryName] !== undefined) {
            return error(null)
        }
        return wrapUnsafePromise(this.creator(createData, entryName)
        ).mapResultRaw(data => {
            this.implementation[entryName] = data
            return null
        })
    }
    public renameEntry(oldName: string, newName: string): IUnsafePromise<null, SafeTwoWayError> {
        const entry = this.implementation[oldName]
        const doesNotExist = entry === undefined
        const alreadyExists = this.implementation[newName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error({ entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists })
        }
        this.implementation[newName] = entry
        delete this.implementation[oldName]
        return success(null)
    }
}
