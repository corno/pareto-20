import { IStreamConsumer } from "../stream/IStreamConsumer"
import { StreamLimiter } from "pareto-api"
import { createArray } from "./createArray"

export function streamifyArrayToConsumer<DataType, EndDataType>(
    array: DataType[],
    endData: EndDataType,
    limiter: StreamLimiter,
    streamConsumer: IStreamConsumer<DataType, EndDataType>,
): void {
    const stream = createArray(
        array,
    ).streamify()
    return stream.handle(
        limiter,
        data => {
            return streamConsumer.onData(data)
        },
        aborted => {
            return streamConsumer.onEnd(aborted, endData)
        }
    )
}