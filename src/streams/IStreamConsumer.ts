import { DataOrPromise } from "pareto-api";

export type OnDataReturnValue = DataOrPromise<boolean>

export interface IStreamConsumer<DataType, EndDataType> {
    onData(data: DataType): OnDataReturnValue
    onEnd(aborted: boolean, data: EndDataType): void
}