import { BaseDictionary} from "./BaseDictionary"

export class ReadOnlyDictionary<DataType> extends BaseDictionary<DataType> {
    constructor(dictionary: { [key: string]: DataType }) {
        super(dictionary)
    }
}
