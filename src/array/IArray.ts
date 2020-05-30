import { IStream } from "../stream/IStream"
import { IValue } from "../value/ISafeValue"
import { IUnsafeValue } from "../value/IUnsafeValue"

export interface IArray<ElementType> {

    streamify(): IStream<ElementType, null>
    mergeSafeValues<ResultType>(
        callback: (element: ElementType) => IValue<ResultType>
    ): IValue<ResultType[]>
    mergeUnsafeValues<ResultType, ErrorType>(
        callback: (element: ElementType) => IUnsafeValue<ResultType, ErrorType>
    ): IUnsafeValue<ResultType[], ErrorType[]>

}