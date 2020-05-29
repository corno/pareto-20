import * as api from "pareto-api";

export type OnDataReturnValue = api.IValue<boolean>

export interface IStreamConsumer<DataType, EndDataType> {
    onData(data: DataType): OnDataReturnValue
    onEnd(aborted: boolean, data: EndDataType): void
}