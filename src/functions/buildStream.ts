import { BuildableStream } from "../classes/builders/BuildableStream"
import { IStream } from "../interfaces/IStream"
import { IStreamBuilder } from "../interfaces/IStreamBuilder"

export function buildStream<DataType>(buildCallback: (builder: IStreamBuilder<DataType>) => void): IStream<DataType> {
    const builder = new BuildableStream<DataType>()
    buildCallback(builder)
    return builder
}
