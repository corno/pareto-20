/* eslint
    "max-classes-per-file": off
*/
import {
    IInUnsafeLooseDictionary,
    IInUnsafePromise,
    IInUnsafeStrictDictionary,
    UnsafeEntryAlreadyExistsError,
    UnsafeEntryDoesNotExistError,
    UnsafeTwoWayError,
} from "pareto-api"
import { IUnsafePromise } from "../promises/IUnsafePromise"
import { error, success, wrap } from "../promises/UnsafePromise"
import { Stream } from "../streams/Stream"
import { streamifyArray } from "../streams/streamifyArray"
import { BaseDictionary } from "./BaseDictionary"

export class IntUnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> extends BaseDictionary<StoredData> implements
    IInUnsafeLooseDictionary<CreateData, OpenData, CustomErrorType>,
    IInUnsafeStrictDictionary<CreateData, OpenData, CustomErrorType> {
    private readonly creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, CustomErrorType>
    private readonly opener: (storedData: StoredData, entryName: string) => OpenData
    private readonly copier: (storedData: StoredData) => StoredData
    private readonly deleter: (storedData: StoredData) => void
    constructor(
        dictionary: { [key: string]: StoredData },
        creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, CustomErrorType>,
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
    ) {
        return new IntUnsafeMutableDictionary<StoredData, CreateData, NewOpenData, CustomErrorType>(
            this.implementation,
            this.creator,
            opener,
            this.copier,
            this.deleter
        )
    }
    public getEntry(entryName: string): IUnsafePromise<OpenData, UnsafeEntryDoesNotExistError<CustomErrorType>> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(["entry does not exist"])
        }
        return success(this.opener(entry, entryName))
    }
    public copyEntry(sourceName: string, targetName: string): IUnsafePromise<null, UnsafeTwoWayError<CustomErrorType>> {
        const source = this.implementation[sourceName]
        const doesNotExist = source === undefined
        const alreadyExists = this.implementation[targetName] !== undefined
        if (doesNotExist || alreadyExists) {
            return error(["twoway", { entryDoesNotExist: doesNotExist, entryAlreadyExists: alreadyExists }])
        }
        this.implementation[targetName] = this.copier(source)
        return success(null)
    }
    public deleteEntry(entryName: string): IUnsafePromise<null, UnsafeEntryDoesNotExistError<CustomErrorType>> {
        const entry = this.implementation[entryName]
        if (entry === undefined) {
            return error(["entry does not exist"])
        }
        delete this.implementation[entryName]
        this.deleter(entry)
        return success(null)
    }
    public getKeys(): IUnsafePromise<Stream<string>, CustomErrorType> {
        return success(
            new Stream<string>(streamifyArray(Object.keys(this.implementation)))
        )
    }
    public createEntry(entryName: string, createData: CreateData): IUnsafePromise<null, UnsafeEntryAlreadyExistsError<CustomErrorType>> {
        if (this.implementation[entryName] !== undefined) {
            return error(["entry already exists"])
        }
        return wrap(this.creator(createData, entryName)
        ).mapErrorRaw<UnsafeEntryAlreadyExistsError<CustomErrorType>>(customError =>
            ["custom", customError]
        ).mapResultRaw(data => {
            this.implementation[entryName] = data
            return null
        })
    }
    public renameEntry(oldName: string, newName: string): IUnsafePromise<null, UnsafeTwoWayError<CustomErrorType>> {
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

// tslint:disable-next-line: max-classes-per-file
export class UnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> extends IntUnsafeMutableDictionary<StoredData, CreateData, OpenData, CustomErrorType> {
    constructor(
        creator: (createData: CreateData, entryName: string) => IInUnsafePromise<StoredData, CustomErrorType>,
        opener: (storedData: StoredData, entryName: string) => OpenData,
        copier: (storedData: StoredData) => StoredData,
        deleter: (storedData: StoredData) => void
    ) {
        super({}, creator, opener, copier, deleter)
    }
}
