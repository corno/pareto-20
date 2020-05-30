import { IValue } from "../value/ISafeValue";

export type OnDataReturnValue = IValue<boolean>

export interface IStreamConsumer<DataType, EndDataType> {
    onData(data: DataType): OnDataReturnValue
    onEnd(aborted: boolean, data: EndDataType): void
}