import { IInSafeLookup} from "pareto-api"
import { IUnsafePromise} from "../promises/IUnsafePromise"

export interface ILookup<Type> extends IInSafeLookup<Type> {
    getEntry(entryName: string): IUnsafePromise<Type, null>
}
