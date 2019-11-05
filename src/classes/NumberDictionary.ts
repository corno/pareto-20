import { streamifyArray } from "../functions/streamifyArray"
import { Stream } from "./volatile/Stream"

export class NumberDictionary<DataType> extends Stream<DataType> {
    private readonly array: DataType[]
    constructor() {
        const array: DataType[] = []

        super(streamifyArray(array))
        this.array = array
    }
    public push(element: DataType) {
        this.array.push(element)
    }
    public getEntry(element: DataType) {
        this.array.push(element)
    }
}
