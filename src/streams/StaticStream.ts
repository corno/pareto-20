import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

export class StaticStream<DataType> extends Stream<DataType, null> {
    constructor(array: DataType[]) {
        super((
            limiter,
            onData,
            onEnd,
        ) => {
            return streamifyArray(array).handle(
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
