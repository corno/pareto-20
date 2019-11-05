
import { error, success } from "../../index"
import { ILookup } from "../../interfaces/ILookup"
import { IUnsafePromise} from "../../interfaces/IUnsafePromise"


// tslint:disable-next-line: max-classes-per-file
export class BuildableLookup<DataType> implements ILookup<DataType> {
    private readonly dictionary: { [key: string]: DataType } = {}
    public set(key: string, element: DataType) {
        this.dictionary[key] = element
    }
    public get(key: string, initializer: () => DataType) {
        let entry = this.dictionary[key]
        if (entry === undefined) {
            entry = initializer()
            this.dictionary[key] = entry
        }
        return entry
    }
    public getEntry(key: string): IUnsafePromise<DataType, null> {
        const entry = this.dictionary[key]
        if (entry === undefined) {
            return error(null)
        }
        return success(entry)
    }
}

