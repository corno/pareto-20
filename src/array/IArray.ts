import { IStream } from "../stream/IStream";

export interface IArray<ElementType> {

    streamify(
    ): IStream<ElementType, null>
}