import { Stream } from "./Stream"
import { createArray } from "../array/Array"

export class StaticStream<DataType> extends Stream<DataType, null> {
    constructor(array: DataType[]) {
        super((
            limiter,
            onData,
            onEnd,
        ) => {
            return createArray(array).streamify().handle(
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
