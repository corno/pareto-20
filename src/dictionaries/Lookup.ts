import { UnsafePromise } from "../promises/UnsafePromise"
import { ILookup } from "./ILookup"

/**
 * @deprecated
 */
export class Lookup<Type> implements ILookup<Type> {
    private readonly dict: { [key: string]: Type }
    constructor(dict: { [key: string]: Type }) {
        this.dict = dict
    }
    public getEntry(entryName: string) {
        return new UnsafePromise<Type, null>((onError, onSuccess) => {
            const entry = this.dict[entryName]
            if (entry === undefined) {
                onError(null)
            } else {
                onSuccess(entry)
            }
        })
    }
}