import { BaseDictionary} from "./BaseDictionary"

// tslint:disable-next-line: max-classes-per-file
export class ReadOnlyDictionary<DataType> extends BaseDictionary<DataType> {
    constructor(dictionary: { [key: string]: DataType }) {
        super(dictionary)
    }
}
