
import * as api from "pareto-api"
import { error, success } from "../value/UnsafeValue"
import { ILookup } from "./ILookup"


export class BuildableLookup<DataType> implements ILookup<DataType> {
    private readonly dictionary: { [key: string]: DataType } = {}
    public set(key: string, element: DataType): void {
        this.dictionary[key] = element
    }
    public get(key: string, initializer: () => DataType): DataType {
        let entry = this.dictionary[key]
        if (entry === undefined) {
            entry = initializer()
            this.dictionary[key] = entry
        }
        return entry
    }
    public getEntry(key: string): api.IUnsafeValue<DataType, null> {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return error(null)
        }
        return success(entry)
    }
}

