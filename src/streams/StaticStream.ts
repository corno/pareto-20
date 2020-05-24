import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

export class StaticStream<DataType, EndDataType> extends Stream<DataType, EndDataType> {
    constructor(array: DataType[], endData: EndDataType) {
        super(streamifyArray(array, endData))
    }
}
