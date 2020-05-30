import { IStreamConsumer } from "../stream/IStreamConsumer"
import { StreamLimiter, IUnsafeValue } from "pareto-api"
import { createArray } from "./createArray"

export function streamifyArrayToConsumer<DataType, EndDataType, ReturnType>(
    array: DataType[],
    endData: EndDataType,
    limiter: StreamLimiter,
    streamConsumer: IStreamConsumer<DataType, EndDataType, ReturnType>,
): IUnsafeValue<ReturnType, null> {
    const stream = createArray(
        array,
    ).streamify()
    return stream.processStreamToUnsafeValue(
        limiter,
        data => {
            return streamConsumer.onData(data)
        },
        aborted => {
            return streamConsumer.onEnd(aborted, endData)
        }
    )
}