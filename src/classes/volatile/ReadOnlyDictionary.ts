import { InMemoryReadOnlyDictionary} from "./InMemoryReadOnlyDictionary"

// tslint:disable-next-line: max-classes-per-file
export class ReadOnlyDictionary<DataType> extends InMemoryReadOnlyDictionary<DataType, DataType> {
    constructor(dictionary: { [key: string]: DataType }) {
        super(dictionary, x => x)
    }
}
