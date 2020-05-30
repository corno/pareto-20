/* eslint
    "max-classes-per-file": off
*/
import * as api from "pareto-api"
import { error, success, wrapUnsafePromise } from "../value/UnsafeValue"
import { Stream } from "../stream/Stream"
import { createArray } from "../array/Array"
import { BaseDictionary } from "./BaseDictionary"

export class IntUnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> extends
 BaseDictionary<StoredData> implements
    api.IUnsafeLooseDictionary<CreateData, OpenData, CustomErrorType>,
    api.IUnsafeStrictDictionary<CreateData, OpenData, CustomErrorType> {
    private readonly creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, CustomErrorType>
    private readonly opener: (storedData: StoredData, entryName: string) => OpenData
    private readonly copier: (storedData: StoredData) => StoredData
    private readonly deleter: (storedData: StoredData) => void
    constructor(
        dictionary: { [key: string]: StoredData },
        creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, CustomErrorType>,
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
    ): IntUnsafeMutableDictionary<StoredData, CreateData, NewOpenData, CustomErrorType> {
        return new IntUnsafeMutableDictionary(
            this.implementation,
            this.creator,
            opener,
            this.copier,
            this.deleter
        )
    }
    public getEntry(entryName: string): api.IUnsafeValue<OpenData, api.UnsafeEntryDoesNotExistError<CustomErrorType>> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(["entry does not exist"])
        }
        return success(this.opener(entry, entryName))
    }
    public copyEntry(sourceName: string, targetName: string): api.IUnsafeValue<null, api.UnsafeTwoWayError<CustomErrorType>> {
        const source = this.implementation[sourceName]
        const doesNotExist = source === undefined
        const alreadyExists = this.implementation[targetName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error(["twoway", { entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists }])
        }
        this.implementation[targetName] = this.copier(source)
        return success(null)
    }
    public deleteEntry(entryName: string): api.IUnsafeValue<null, api.UnsafeEntryDoesNotExistError<CustomErrorType>> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(["entry does not exist"])
        }
        delete this.implementation[entryName]
        this.deleter(entry)
        return success(null)
    }
    public getKeys(
    ): api.IUnsafeValue<Stream<string, null>, CustomErrorType> {
        return success(
            createArray(Object.keys(this.implementation)).streamify()
        )
    }
    public createEntry(
        entryName: string,
        createData: CreateData
    ): api.IUnsafeValue<null, api.UnsafeEntryAlreadyExistsError<CustomErrorType>> {
        if (this.implementation[entryName] !== undefined) {
            return error(["entry already exists"])
        }
        return wrapUnsafePromise(this.creator(createData, entryName)
        ).mapErrorRaw<api.UnsafeEntryAlreadyExistsError<CustomErrorType>>(customError =>
            ["custom", customError]
        ).mapResultRaw(data => {
            this.implementation[entryName] = data
            return null
        })
    }
    public renameEntry(
        oldName: string,
        newName: string
    ): api.IUnsafeValue<null, api.UnsafeTwoWayError<CustomErrorType>> {
        const entry = this.implementation[oldName]
        const doesNotExist = entry === undefined
        const alreadyExists = this.implementation[newName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error(["twoway", { entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists }])
        }
        this.implementation[newName] = entry
        delete this.implementation[oldName]
        return success(null)
    }
}

export class UnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> extends IntUnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> {
    constructor(
        creator: (createData: CreateData, entryName: string) => api.IUnsafeValue<StoredData, CustomErrorType>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super({}, creator, opener, copier, deleter)
    }
}
