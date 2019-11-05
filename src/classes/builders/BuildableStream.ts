import { streamifyArray } from "../../functions/streamifyArray"
import { Stream } from "../volatile/Stream"

export class BuildableStream<DataType> extends Stream<DataType> {
    private readonly array: DataType[]
    constructor() {
        const array: DataType[] = []

        super(streamifyArray(array))
        this.array = array
    }
    public push(element: DataType) {
        this.array.push(element)
    }
}
