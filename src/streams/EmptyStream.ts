import { Stream } from "./Stream"
import { streamifyArray } from "./streamifyArray"

/**
 * can be used to avoid having to initialize a stream with an empty array: []
 */
export class EmptyStream<DataType> extends Stream<DataType, null> {
    constructor() {
        super(streamifyArray([], null))
    }
}
