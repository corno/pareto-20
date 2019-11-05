import { IInKeyValueStream, IInSafePromise, IInSafeResource, IInStream, IInUnsafeOnCloseResource, IInUnsafeOnOpenResource, IInUnsafePromise, IInUnsafeResource } from "pareto-api"

import { assertUnreachable } from "./genericFunctions"

import { ISafePromise } from "./promises/ISafePromise"
import { IUnsafePromise } from "./promises/IUnsafePromise"
import { SafePromise } from "./promises/SafePromise"
import { UnsafePromise } from "./promises/UnsafePromise"

import { IKeyValueStream } from "./streams/IKeyValueStream"
import { IStream } from "./streams/IStream"
import { KeyValueStream } from "./streams/KeyValueStream"
import { Stream } from "./streams/Stream"


import { ISafeResource } from "./resources/ISafeResource"
import { IUnsafeOnCloseResource } from "./resources/IUnsafeOnCloseResource"
import { IUnsafeOnOpenResource } from "./resources/IUnsafeOnOpenResource"
import { IUnsafeResource } from "./resources/IUnsafeResource"
import { SafeResource } from "./resources/SafeResource"
import { UnsafeOnCloseResource } from "./resources/UnsafeOnCloseResource"
import { UnsafeOnOpenResource } from "./resources/UnsafeOnOpenResource"
import { UnsafeResource } from "./resources/UnsafeResource"

export type OnKeyConflict =
    ["ignore"]
    |
    ["abort"]

export const wrap = {
    KeyValueStream: <DataType>(stream: IInKeyValueStream<DataType>, onKeyConflict: OnKeyConflict): IKeyValueStream<DataType> => {
        switch (onKeyConflict[0]) {
            case "abort": {
                const keys: { [key: string]: null } = {}
                return new KeyValueStream<DataType>((limiter, onData, onEnd) => {
                    stream.process(
                        limiter,
                        (data, abort) => {
                            if (keys[data.key] !== undefined) {
                                throw new Error("keyconflict: " + data.key)
                            }
                            onData(data, abort)
                        },
                        onEnd
                    )
                })
            }
            case "ignore": {
                return new KeyValueStream<DataType>((limiter, onData, onEnd) => {
                    stream.process(limiter, onData, onEnd)
                })
            }
            default:
                assertUnreachable(onKeyConflict[0])
                throw new Error("UNREACHABLE")
        }
        return new KeyValueStream<DataType>((limiter, onData, onEnd) => {
            stream.process(limiter, onData, onEnd)
        })
    },
    SafePromise: <SourceResultType>(promise: IInSafePromise<SourceResultType>): ISafePromise<SourceResultType> => {
        return new SafePromise<SourceResultType>(onResult => {
            promise.handle(onResult)
        })
    },
    UnsafePromise: <SourceResultType, SourceErrorType>(promise: IInUnsafePromise<SourceResultType, SourceErrorType>): IUnsafePromise<SourceResultType, SourceErrorType> => {
        return new UnsafePromise<SourceResultType, SourceErrorType>((onError, onSucces) => {
            promise.handle(onError, onSucces)
        })
    },
    SafeResource: <T>(safeResource: IInSafeResource<T>): ISafeResource<T> => {
        return new SafeResource<T>(onOpened => {
            safeResource.open(openedResource => {
                onOpened(openedResource.resource, openedResource.close)
            })
        })
    },
    UnsafeResource: <T, OpenError, CloseError>(unsafeResource: IInUnsafeResource<T, OpenError, CloseError>): IUnsafeResource<T, OpenError, CloseError> => {
        return new UnsafeResource<T, OpenError, CloseError>((onError, onOpened) => {
            unsafeResource.open(onError, openedResource => {
                onOpened(openedResource.resource, openedResource.close)
            })
        })
    },
    UnsafeOnOpenResource: <T, OpenError>(unsafeOnOpenResource: IInUnsafeOnOpenResource<T, OpenError>): IUnsafeOnOpenResource<T, OpenError> => {
        return new UnsafeOnOpenResource<T, OpenError>((onError, onOpened) => {
            unsafeOnOpenResource.open(onError, openedResource => {
                onOpened(openedResource.resource, openedResource.close)
            })
        })
    },
    UnsafeOnCloseResource: <T, CloseError>(unsafeOnCloseResource: IInUnsafeOnCloseResource<T, CloseError>): IUnsafeOnCloseResource<T, CloseError> => {
        return new UnsafeOnCloseResource<T, CloseError>(onOpened => {
            unsafeOnCloseResource.open(openedResource => {
                onOpened(openedResource.resource, openedResource.close)
            })
        })
    },
    Stream: <DataType>(stream: IInStream<DataType>): IStream<DataType> => {
        return new Stream<DataType>((limiter, onData, onEnd) => {
            stream.process(limiter, onData, onEnd)
        })
    },
}
