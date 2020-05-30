import { Stream } from "./Stream"
import { createArray } from "../array/Array"

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
}
