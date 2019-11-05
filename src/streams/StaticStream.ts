import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

export class StaticStream<DataType> extends Stream<DataType> {
    constructor(array: DataType[]) {
        super(streamifyArray(array))
    }
}
