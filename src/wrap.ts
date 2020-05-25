import * as api from "pareto-api"

import { ISafePromise, DataOrPromise } from "./promises/ISafePromise"
import { IUnsafePromise } from "./promises/IUnsafePromise"
import { SafePromise, handleDataOrPromise } from "./promises/SafePromise"
import { UnsafePromise } from "./promises/UnsafePromise"

import { IKeyValueStream } from "./streams/IKeyValueStream"
import { IStream } from "./streams/IStream"
import { KeyValueStream } from "./streams/KeyValueStream"
import { Stream } from "./streams/Stream"

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
                    stream.processStream(
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
                    stream.processStream(limiter, onData, onEnd)
                })
            }
            default:
                assertUnreachable(onKeyConflict[0])
                throw new Error("UNREACHABLE")
        }
    },
    DataOrPromise: <SourceResultType>(dataOrPromise: DataOrPromise<SourceResultType>): ISafePromise<SourceResultType> => {
        return new SafePromise<SourceResultType>(onResult => {
            handleDataOrPromise(dataOrPromise, onResult)
        })
    },
    SafePromise: <SourceResultType>(promise: api.ISafePromise<SourceResultType>): ISafePromise<SourceResultType> => {
        return new SafePromise<SourceResultType>(onResult => {
            promise.handleSafePromise(onResult)
        })
    },
    UnsafePromise: <SourceResultType, SourceErrorType>(promise: api.IUnsafePromise<SourceResultType, SourceErrorType>): IUnsafePromise<SourceResultType, SourceErrorType> => {
        return new UnsafePromise<SourceResultType, SourceErrorType>((onError, onSucces) => {
            promise.handleUnsafePromise(onError, onSucces)
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
            stream.processStream(limiter, onData, onEnd)
        })
    },
}
