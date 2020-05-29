import { IStreamConsumer } from "./IStreamConsumer"
import { StreamLimiter } from "pareto-api"
// import { streamifyArray } from "./streamifyArray"

export function streamifyArrayToConsumer<DataType, EndDataType>(
    _array: DataType[],
    _endData: EndDataType,
    _limiter: StreamLimiter,
    _streamConsumer: IStreamConsumer<DataType, EndDataType>,
): void {
    throw new Error("IMPLEMENT ME")
    // const streamFunction = streamifyArray(
    //     array,
    // )
    // return streamFunction(
    //     limiter,
    //     data => {
    //         return streamConsumer.onData(data)
    //     },
    //     aborted => {
    //         return streamConsumer.onEnd(aborted, endData)
    //     }
    // )
}