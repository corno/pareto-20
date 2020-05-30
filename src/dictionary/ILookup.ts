import * as api from "pareto-api"

export interface ILookup<Type> extends api.ISafeLookup<Type> {
    getEntry(entryName: string): api.IUnsafeValue<Type, null>
}
