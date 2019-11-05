import { streamifyArray } from "../../functions/streamifyArray"
import { Stream } from "../volatile/Stream"

export class StaticStream<DataType> extends Stream<DataType> {
    constructor(array: DataType[]) {
        super(streamifyArray(array))
    }
}
