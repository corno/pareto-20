import { streamifyArray } from "../../functions/streamifyArray"
import { Stream } from "../volatile/Stream"

export class EmptyStream<DataType> extends Stream<DataType> {
    constructor() {
        super(streamifyArray([]))
    }
}
