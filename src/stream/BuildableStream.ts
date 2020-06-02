import { IStreamBuilder } from "./IStreamBuilder"
import { createStream } from "./createStream"
import { createArray } from "../array/createArray"
import { IStream } from "./IStream"

/**
 * Allows for the creation of a stream that can be incrementally built with the push function.
 */
export class BuildableStream<DataType> implements IStreamBuilder<DataType> {
    private readonly array: DataType[]
    public stream: IStream<DataType, null>
    constructor(
    ) {
        const array: DataType[] = []

        this.stream = createStream((limiter, consumer) => {
            return createArray(array).streamify().handle(
                limiter,
                {
                    onData: data => {
                        return consumer.onData(data)
                    },
                    onEnd: (aborted, data) => {
                        return consumer.onEnd(aborted, data)
                    },
                }
            )
        })
        this.array = array
    }
    public push(element: DataType): void {
        this.array.push(element)
    }
}
