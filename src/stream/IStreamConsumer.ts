import { IValue } from "../value/ISafeValue";
import { IUnsafeValue } from "../value/IUnsafeValue";

export interface IStreamConsumer<DataType, EndDataType, ReturnType, ErrorType> {
    onData(data: DataType): IValue<boolean>
    onEnd(aborted: boolean, data: EndDataType): IUnsafeValue<ReturnType, ErrorType>
}