import { IStreamConsumer } from "../stream/IStreamConsumer"
import { StreamLimiter, IUnsafeValue } from "pareto-api"
import { createArray } from "./createArray"

export function streamifyArrayToConsumer<DataType, EndDataType, ReturnType, ErrorType>(
    array: DataType[],
    endData: EndDataType,
    limiter: StreamLimiter,
    streamConsumer: IStreamConsumer<DataType, EndDataType, ReturnType, ErrorType>,
): IUnsafeValue<ReturnType, ErrorType> {
    return createArray(array).streamify().toUnsafeValue(
        limiter,
        data => {
            return streamConsumer.onData(data)
        },
        aborted => {
            return streamConsumer.onEnd(aborted, endData)
        }
    )
}