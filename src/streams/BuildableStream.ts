import { IStreamBuilder } from "./IStreamBuilder"
import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

/**
 * Allows for the creation of a stream that can be incrementally built with the push function.
 */
export class BuildableStream<DataType, EndDataType> extends Stream<DataType, EndDataType> implements IStreamBuilder<DataType> {
    private readonly array: DataType[]
    constructor(
        endData: EndDataType
    ) {
        const array: DataType[] = []

        super(streamifyArray(array, endData))
        this.array = array
    }
    public push(element: DataType): void {
        this.array.push(element)
    }
}
