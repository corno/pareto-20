import { BuildableStream } from "./BuildableStream"
import { IStream } from "./IStream"
import { IStreamBuilder } from "./IStreamBuilder"

/**
 * callback wrapper for the IStreamBuilder.
 * @param buildCallback allows the caller to push to the stream. When the callback returns, the stream will be ended.
 */
export function buildStream<DataType>(buildCallback: (builder: IStreamBuilder<DataType>) => void): IStream<DataType> {
    const builder = new BuildableStream<DataType>()
    buildCallback(builder)
    return builder
}
