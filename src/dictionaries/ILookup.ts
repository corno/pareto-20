import * as api from "pareto-api"
import { IUnsafePromise} from "../promises/IUnsafePromise"

export interface ILookup<Type> extends api.ISafeLookup<Type> {
    getEntry(entryName: string): IUnsafePromise<Type, null>
}
