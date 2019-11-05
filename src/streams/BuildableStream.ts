import { IStreamBuilder } from "./IStreamBuilder"
import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

export class BuildableStream<DataType> extends Stream<DataType> implements IStreamBuilder<DataType> {
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
