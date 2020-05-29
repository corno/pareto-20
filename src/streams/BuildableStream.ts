import { IStreamBuilder } from "./IStreamBuilder"
import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

/**
 * Allows for the creation of a stream that can be incrementally built with the push function.
 */
export class BuildableStream<DataType> extends Stream<DataType, null> implements IStreamBuilder<DataType> {
    private readonly array: DataType[]
    constructor(
    ) {
        const array: DataType[] = []

        super((limiter, onData, onEnd) => {
            return streamifyArray(array).handle(
                limiter,
                data => {
                    return onData(data)
                },
                (aborted, data) => {
                    return onEnd(aborted, data)
                }
            )
        })
        this.array = array
    }
    public push(element: DataType): void {
        this.array.push(element)
    }
}
