import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

export class EmptyStream<DataType> extends Stream<DataType> {
    constructor() {
        super(streamifyArray([]))
    }
}
