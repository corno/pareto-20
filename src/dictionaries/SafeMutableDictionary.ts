import {
    IInSafeLooseDictionary,
    IInSafeStrictDictionary,
    IInUnsafePromise,
    SafeEntryAlreadyExistsError,
    SafeEntryDoesNotExistError,
    SafeTwoWayError,
} from "pareto-api"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { result, SafePromise } from "../promises/SafePromise"
import { error, success, wrap as wrapUnsafePromise } from "../promises/UnsafePromise"
import { KeyValueStream } from "../streams/KeyValueStream"
import { Stream } from "../streams/Stream"
import { streamifyArray } from "../streams/streamifyArray"
import { streamifyDictionary } from "../streams/streamifyDictionary"
import { BaseDictionary } from "./BaseDictionary"

export class IntSafeMutableDictionary<StoredData, CreateData, OpenData> extends BaseDictionary<StoredData, OpenData> implements
    IInSafeStrictDictionary<CreateData, OpenData>,
    IInSafeLooseDictionary<CreateData, OpenData> {
    private readonly creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, null>
    private readonly copier: (storedData: StoredData) => StoredData
    private readonly deleter: (storedData: StoredData) => void
    constructor(
        dictionary: { [key: string]: StoredData },
        creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, null>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super(dictionary, opener)
        this.creator = creator
        this.copier = copier
        this.deleter = deleter
    }
    public derive<NewOpenData>(
        opener: (storedData: StoredData, entryName: string) => NewOpenData,
    ) {
        return new IntSafeMutableDictionary<StoredData, CreateData, NewOpenData>(
            this.implementation,
            this.creator,
            opener,
            this.copier,
            this.deleter
        )
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

// tslint:disable-next-line: max-classes-per-file
export class SafeMutableDictionary<StoredData, CreateData, OpenData> extends IntSafeMutableDictionary<StoredData, CreateData, OpenData> {
    constructor(
        creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, null>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super({}, creator, opener, copier, deleter)
    }
}
