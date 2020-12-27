import { IValue } from "../value/ISafeValue";
import { IUnsafeValue } from "../value/IUnsafeValue";

/**
 * an implementation of this interface is needed to consume an interface.
 * The difference between 'consuming' a stream with an IStreamConsumer and
 * 'handling' a stream with an IStreamHandler is the return type of the onEnd method.
 * For an IStreamHandler this is 'void', for an IStreamConsumer this is an IUnsafeValue
 */
export interface IStreamConsumer<DataType, EndDataType, ReturnType, ErrorType> {
    onData(data: DataType): IValue<boolean>
    onEnd(aborted: boolean, data: EndDataType): IUnsafeValue<ReturnType, ErrorType>
}