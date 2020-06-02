import { createStream } from "./createStream"
import { createArray } from "../array/createArray"
import { IStream } from "./IStream"

/**
 * can be used to avoid having to initialize a stream with an empty array: []
 */
export function createEmptyStream<DataType>(): IStream<DataType, null> {
    return createStream((
        limiter,
        consumer,
    ) => {
        return createArray([]).streamify().handle(
            limiter,
            {
                onData: data => {
                    return consumer.onData(data)
                },
                onEnd: (aborted, endData) => {
                    return consumer.onEnd(aborted, endData)
                },
            }
        )
    })
}

