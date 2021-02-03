/* eslint
    "max-classes-per-file": off
*/
import * as api from "pareto-api"
import { createValue } from "../value/createSafeValue"
import { error, success, wrapUnsafePromise } from "../value/createUnsafeValue"
import { IStream } from "../stream/IStream"
import { createArray } from "../array/createArray"
import { BaseDictionary } from "./BaseDictionary"

export class IntSafeMutableDictionary<StoredData, CreateData, OpenData> extends BaseDictionary<StoredData> implements
    api.ISafeStrictDictionary<CreateData, OpenData>,
    api.ISafeLooseDictionary<CreateData, OpenData> {
    private readonly creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, null>
    private readonly opener: (storedData: StoredData, entryName: string) => OpenData
    private readonly copier: (storedData: StoredData) => StoredData
    private readonly deleter: (storedData: StoredData) => void
    constructor(
        dictionary: { [key: string]: StoredData },
        creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, null>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super(dictionary)
        this.creator = creator
        this.opener = opener
        this.copier = copier
        this.deleter = deleter
    }
    public derive<NewOpenData>(
        opener: (storedData: StoredData, entryName: string) => NewOpenData,
    ): IntSafeMutableDictionary<StoredData, CreateData, NewOpenData> {
        return new IntSafeMutableDictionary(
            this.implementation,
            this.creator,
            opener,
            this.copier,
            this.deleter
        )
    }
    public copyEntry(
        sourceName: string, targetName: string
    ): api.IUnsafeValue<null, api.SafeTwoWayError> {
        const source = this.implementation[sourceName]
        const doesNotExist = source === undefined
        const alreadyExists = this.implementation[targetName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error({ entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists })
        }
        this.implementation[targetName] = this.copier(source)
        return success(null)
    }
    public deleteEntry(
        entryName: string
    ): api.IUnsafeValue<null, api.SafeEntryDoesNotExistError> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(null)
        }
        delete this.implementation[entryName]
        this.deleter(entry)
        return success(null)
    }
    public getKeys(
    ): api.IValue<IStream<string, null>> {
        return createValue(onResult => {
            //FIXME this shouldn't be a promise
            onResult(createArray(Object.keys(this.implementation)).streamify())
        })
    }
    public getEntry(
        entryName: string
    ): api.IUnsafeValue<OpenData, api.SafeEntryDoesNotExistError> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(null)
        }
        return success(this.opener(entry, entryName))
    }
    public createEntry(
        entryName: string,
        createData: CreateData
    ): api.IUnsafeValue<null, api.SafeEntryAlreadyExistsError> {
        if (this.implementation[entryName] !== undefined) {
            return error(null)
        }
        return wrapUnsafePromise(this.creator(createData, entryName)
        ).mapResultRaw(data => {
            this.implementation[entryName] = data
            return null
        })
    }
    public renameEntry(
        oldName: string, newName: string
    ): api.IUnsafeValue<null, api.SafeTwoWayError> {
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

export class SafeMutableDictionary<StoredData, CreateData, OpenData> extends IntSafeMutableDictionary<StoredData, CreateData, OpenData> {
    constructor(
        creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, null>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super({}, creator, opener, copier, deleter)
    }
}
