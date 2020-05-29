import { BuildableStream } from "./BuildableStream"
import { IStream } from "./IStream"
import { IStreamBuilder } from "./IStreamBuilder"
import { result } from "../values/SafeValue"

/**
 * callback wrapper for the IStreamBuilder.
 * @param buildCallback allows the caller to push to the stream. When the callback returns, the stream will be ended.
 */
export function buildStream<DataType, EndDataType>(
    buildCallback: (builder: IStreamBuilder<DataType>) => void,
    endData: EndDataType
): IStream<DataType, EndDataType> {
    const builder = new BuildableStream<DataType>()
    buildCallback(builder)
    return builder.mapEndData(() => result(endData))
}
