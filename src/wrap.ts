import * as api from "pareto-api"

import { IValue } from "./value/ISafeValue"
import { IUnsafeValue } from "./value/IUnsafeValue"
import { Value } from "./value/SafeValue"
import { UnsafeValue } from "./value/UnsafeValue"

import { IKeyValueStream } from "./stream/IKeyValueStream"
import { IStream } from "./stream/IStream"
import { KeyValueStream } from "./stream/KeyValueStream"
import { Stream } from "./stream/Stream"

function assertUnreachable<RT>(_x: never): RT {
    throw new Error("unreachable")
}

// import { ISafeResource } from "./resources/ISafeResource"
// import { IUnsafeOnCloseResource } from "./resources/IUnsafeOnCloseResource"
// import { IUnsafeOnOpenResource } from "./resources/IUnsafeOnOpenResource"
// import { IUnsafeResource } from "./resources/IUnsafeResource"
// import { SafeResource } from "./resources/SafeResource"
// import { UnsafeOnCloseResource } from "./resources/UnsafeOnCloseResource"
// import { UnsafeOnOpenResource } from "./resources/UnsafeOnOpenResource"
// import { UnsafeResource } from "./resources/UnsafeResource"

export type OnKeyConflict =
    ["ignore"]
    |
    ["abort"]

export const wrap = {
    KeyValueStream: <DataType, EndDataType>(
        stream: api.IKeyValueStream<DataType, EndDataType>,
        onKeyConflict: OnKeyConflict
    ): IKeyValueStream<DataType, EndDataType> => {
        switch (onKeyConflict[0]) {
            case "abort": {
                const keys: { [key: string]: null } = {}
                return new KeyValueStream<DataType, EndDataType>((limiter, onData, onEnd) => {
                    return stream.handle(
                        limiter,
                        data => {
                            if (keys[data.key] !== undefined) {
                                throw new Error(`keyconflict: ${data.key}`)
                            }
                            return onData(data)
                        },
                        onEnd
                    )
                })
            }
            case "ignore": {
                return new KeyValueStream<DataType, EndDataType>((limiter, onData, onEnd) => {
                    return stream.handle(limiter, onData, onEnd)
                })
            }
            default:
                assertUnreachable(onKeyConflict[0])
                throw new Error("UNREACHABLE")
        }
    },
    Value: <SourceResultType>(promise: api.IValue<SourceResultType>): IValue<SourceResultType> => {
        return new Value<SourceResultType>(onResult => {
            promise.handle(onResult)
        })
    },
    UnsafeValue: <SourceResultType, SourceErrorType>(value: api.IUnsafeValue<SourceResultType, SourceErrorType>): IUnsafeValue<SourceResultType, SourceErrorType> => {
        return new UnsafeValue<SourceResultType, SourceErrorType>((onError, onSucces) => {
            value.handle(onError, onSucces)
        })
    },
    // SafeResource: <T>(safeResource: ISafeResource<T>): ISafeResource<T> => {
    //     return new SafeResource<T>(onOpened => {
    //         safeResource.openSafeOpenableResource(openedResource => {
    //             onOpened(openedResource.resource, () => {
    //                 openedResource.closeSafeOpenedResource()
    //             })
    //         })
    //     })
    // },
    // UnsafeResource: <T, OpenError, CloseError>(unsafeResource: IUnsafeResource<T, OpenError, CloseError>): IUnsafeResource<T, OpenError, CloseError> => {
    //     return new UnsafeResource<T, OpenError, CloseError>((onError, onOpened) => {
    //         unsafeResource.openUnsafeOpenableResource(onError, openedResource => {
    //             onOpened(openedResource.resource, onError2 => {
    //                 openedResource.closeUnsafeOpenedResource(onError2)
    //             })
    //         })
    //     })
    // },
    // UnsafeOnOpenResource: <T, OpenError>(unsafeOnOpenResource: IUnsafeOnOpenResource<T, OpenError>): IUnsafeOnOpenResource<T, OpenError> => {
    //     return new UnsafeOnOpenResource<T, OpenError>((onError, onOpened) => {
    //         unsafeOnOpenResource.openUnsafeOpenableResource(onError, openedResource => {
    //             onOpened(openedResource.resource, () => {
    //                 openedResource.closeSafeOpenedResource()
    //             })
    //         })
    //     })
    // },
    // UnsafeOnCloseResource: <T, CloseError>(unsafeOnCloseResource: IUnsafeOnCloseResource<T, CloseError>): IUnsafeOnCloseResource<T, CloseError> => {
    //     return new UnsafeOnCloseResource<T, CloseError>(onOpened => {
    //         unsafeOnCloseResource.openSafeOpenableResource(openedResource => {
    //             onOpened(openedResource.resource, onError => {
    //                 openedResource.closeUnsafeOpenedResource(onError)
    //             })
    //         })
    //     })
    // },
    Stream: <DataType, EndDataType>(stream: api.IStream<DataType, EndDataType>): IStream<DataType, EndDataType> => {
        return new Stream<DataType, EndDataType>((limiter, onData, onEnd) => {
            return stream.handle(limiter, onData, onEnd)
        })
    },
}
