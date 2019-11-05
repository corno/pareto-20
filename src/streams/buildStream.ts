import { BuildableStream } from "./BuildableStream"
import { IStream } from "./IStream"
import { IStreamBuilder } from "./IStreamBuilder"

export function buildStream<DataType>(buildCallback: (builder: IStreamBuilder<DataType>) => void): IStream<DataType> {
    const builder = new BuildableStream<DataType>()
    buildCallback(builder)
    return builder
}
