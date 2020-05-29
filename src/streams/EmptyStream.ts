import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

/**
 * can be used to avoid having to initialize a stream with an empty array: []
 */
export class EmptyStream<DataType> extends Stream<DataType, null> {
    constructor() {
        super((
            limiter,
            onData,
            onEnd,
        ) => {
            return streamifyArray([]).handle(
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
}
