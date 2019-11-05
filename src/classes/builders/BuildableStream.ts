import { streamifyArray } from "../../functions/streamifyArray"
import { IStreamBuilder } from "../../interfaces/IStreamBuilder"
import { Stream } from "../volatile/Stream"

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
