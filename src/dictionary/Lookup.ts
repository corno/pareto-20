import { createUnsafeValue } from "../value/createUnsafeValue"
import { ILookup } from "./ILookup"
import { IUnsafeValue } from "../value/IUnsafeValue"

/**
 * @deprecated
 */
export class Lookup<Type> implements ILookup<Type> {
    private readonly dict: { [key: string]: Type }
    constructor(dict: { [key: string]: Type }) {
        this.dict = dict
    }
    public getEntry(entryName: string): IUnsafeValue<Type, null>{
        return createUnsafeValue((onError, onSuccess) => {
            const entry = this.dict[entryName]
            if (entry === undefined) {
                onError(null)
            } else {
                onSuccess(entry)
            }
        })
    }
}
