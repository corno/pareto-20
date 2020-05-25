
import { error, success } from "../promises/UnsafePromise"
import { ILookup } from "./ILookup"
import * as api from "pareto-api"


export class StaticLookup<DataType> implements ILookup<DataType> {
    private readonly dictionary: { [key: string]: DataType }
    constructor(dictionary: { [key: string]: DataType }) {
        this.dictionary = dictionary
    }
    public getEntry(key: string): api.UnsafeDataOrPromise<DataType, null> {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return error(null)
        }
        return success(entry)
    }
}

