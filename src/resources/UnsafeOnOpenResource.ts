import { IInSafePromise } from "pareto-api"
import { ISafePromise, SafeCallerFunction } from "../promises/ISafePromise"
import { SafePromise } from "../promises/SafePromise"
import { IUnsafeOnOpenResource } from "./IUnsafeOnOpenResource"
import { SafeOpenedResource } from "./SafeOpenedResource"

export class UnsafeOnOpenResource<ResourceType, OpenError> implements IUnsafeOnOpenResource<ResourceType, OpenError> {
    private readonly openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
    constructor(openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>) {
        this.openFunction = openFunction
    }
    public openUnsafeOpenableResource(onError: (openError: OpenError) => void, onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void) {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }

    public with<ResultType>(
        onOpenError: (error: OpenError) => IInSafePromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => IInSafePromise<ResultType>
    ): ISafePromise<ResultType> {
        const newFunc: SafeCallerFunction<ResultType> = onResult => {
            this.openUnsafeOpenableResource(
                err => {
                    onOpenError(err).handleSafePromise(onResult)
                },
                res => {
                    onOpenSuccess(res.resource).handleSafePromise(onResult)
                    res.closeSafeOpenedResource()
                }
            )
        }
        return new SafePromise<ResultType>(newFunc)
    }
    public mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => IInSafePromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType> {
        return new UnsafeOnOpenResource<ResourceType, NewErrorType>((onOpenError, onSuccess) => {
            this.openFunction(
                error => errorConverter(error).handleSafePromise(res => onOpenError(res)),
                (resource, closer) => onSuccess(resource, closer)
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError> {
        return new UnsafeOnOpenResource<NewType, OpenError>((onOpenError, onSuccess) => {
            this.openFunction(
                error => onOpenError(error),
                (resource, closer) => resourceConverter(resource).handleSafePromise(res => onSuccess(res, closer))
            )
        })
    }
}

export type UnsafeOnOpenFunction<ResultType, OpenError> = (
    onOpenError: (error: OpenError) => void,
    onSuccessfullyOpened: (
        resource: ResultType,
        close: () => void
    ) => void
) => void

export function wrapUnsafeOnOpenResource<ResourceType, OpenError>(openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>) {
    return new UnsafeOnOpenResource<ResourceType, OpenError>(openFunction)
}
