import { streamifyDictionary } from "../../functions/streamifyDictionary"
import { KeyValueStream } from "../volatile/KeyValueStream"

export class BuildableKeyValueStream<DataType> extends KeyValueStream<DataType> {
    private readonly dictionary: { [key: string]: DataType }
    constructor() {
        const dictionary: { [key: string]: DataType } = {}

        super(streamifyDictionary(dictionary))
        this.dictionary = dictionary
    }
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
}
