import { IValue } from "../value/ISafeValue";

export interface IStreamConsumer<DataType, EndDataType, ReturnType> {
    onData(data: DataType): IValue<boolean>
    onEnd(aborted: boolean, data: EndDataType): IValue<ReturnType>
}