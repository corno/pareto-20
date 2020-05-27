import { IStreamConsumer } from "./IStreamConsumer"
import { StreamLimiter } from "pareto-api"
import { streamifyArray } from "./streamifyArray"

export function streamifyArrayToConsumer<DataType, EndDataType>(
    array: DataType[],
    endData: EndDataType,
    limiter: StreamLimiter,
    streamConsumer: IStreamConsumer<DataType, EndDataType>,
): void {
    const streamFunction = streamifyArray(
        array,
    )
    streamFunction(
        limiter,
        data => {
            return streamConsumer.onData(data)
        },
        aborted => {
            return streamConsumer.onEnd(aborted, endData)
        }
    )
}