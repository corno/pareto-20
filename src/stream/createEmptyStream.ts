import { createStream } from "./createStream"
import { createArray } from "../array/createArray"
import { IStream } from "./IStream"

/**
 * can be used to avoid having to initialize a stream with an empty array: []
 */
export function createEmptyStream<DataType>(): IStream<DataType, null> {
    return createStream((
        limiter,
        onData,
        onEnd,
    ) => {
        return createArray([]).streamify().handle(
            limiter,
            data => {
                return onData(data)
            },
            (aborted, endData) => {
                return onEnd(aborted, endData)
            }
        )
    })
}

