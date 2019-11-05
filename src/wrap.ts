import { IInKeyValueStream, IInSafePromise, IInSafeResource, IInStream, IInUnsafeOnCloseResource, IInUnsafeOnOpenResource, IInUnsafePromise, IInUnsafeResource } from "pareto-api"

import { SafeResource } from "./classes/resources/SafeResource"
import { UnsafeOnCloseResource } from "./classes/resources/UnsafeOnCloseResource"
import { UnsafeOnOpenResource } from "./classes/resources/UnsafeOnOpenResource"
import { UnsafeResource } from "./classes/resources/UnsafeResource"

import { KeyValueStream } from "./classes/volatile/KeyValueStream"
import { Stream } from "./classes/volatile/Stream"

import { SafePromise } from "./classes/volatile/SafePromise"
import { UnsafePromise } from "./classes/volatile/UnsafePromise"

import { ISafePromise } from "./interfaces/ISafePromise"
import { IUnsafePromise } from "./interfaces/IUnsafePromise"

import { IKeyValueStream } from "./interfaces/IKeyValueStream"
import { IStream } from "./interfaces/IStream"

import { ISafeResource } from "./interfaces/ISafeResource"
import { IUnsafeOnCloseResource } from "./interfaces/IUnsafeOnCloseResource"
import { IUnsafeOnOpenResource } from "./interfaces/IUnsafeOnOpenResource"
import { IUnsafeResource } from "./interfaces/IUnsafeResource"

export const wrap = {
    KeyValueStream: <DataType>(stream: IInKeyValueStream<DataType>): IKeyValueStream<DataType> => {
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
