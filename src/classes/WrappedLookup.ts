import { IInSafeLookup} from "pareto-api"
import { UnsafePromise} from "./volatile/UnsafePromise"

export class WrappedLookup<NewDataType, OldDataType> implements IInSafeLookup<NewDataType> {
    private readonly lookup: IInSafeLookup<OldDataType>
    private readonly converter: (data: OldDataType) => NewDataType
    constructor(lookup: IInSafeLookup<OldDataType>, converter: (data: OldDataType) => NewDataType) {
        this.lookup = lookup
        this.converter = converter
    }
    public getEntry(entryName: string) {
        return new UnsafePromise<NewDataType, null>((onError, onSuccess) => {
            this.lookup.getEntry(entryName).handle(
                () => onError(null),
                data => onSuccess(this.converter(data))
            )
        })
    }
}
