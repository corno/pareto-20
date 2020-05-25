import { ISafePromise, SafeCallerFunction, DataOrPromise } from "../promises/ISafePromise"
import { SafePromise, handleDataOrPromise } from "../promises/SafePromise"
import { IUnsafeOnOpenResource } from "./IUnsafeOnOpenResource"
import { SafeOpenedResource } from "./SafeOpenedResource"

export class UnsafeOnOpenResource<ResourceType, OpenError> implements IUnsafeOnOpenResource<ResourceType, OpenError> {
    private readonly openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
    constructor(openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>) {
        this.openFunction = openFunction
    }
    public openUnsafeOpenableResource(
        onError: (openError: OpenError) => void,
        onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void
    ): void {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }

    public with<ResultType>(
        onOpenError: (error: OpenError) => DataOrPromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => DataOrPromise<ResultType>
    ): ISafePromise<ResultType> {
        const newFunc: SafeCallerFunction<ResultType> = onResult => {
            this.openUnsafeOpenableResource(
                err => {
                    handleDataOrPromise(onOpenError(err), onResult)
                },
                res => {
                    handleDataOrPromise(onOpenSuccess(res.resource), onResult)
                    res.closeSafeOpenedResource()
                }
            )
        }
        return new SafePromise<ResultType>(newFunc)
    }
    public mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => DataOrPromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType> {
        return new UnsafeOnOpenResource<ResourceType, NewErrorType>((onOpenError, onSuccess) => {
            this.openFunction(
                error => handleDataOrPromise( errorConverter(error), res => onOpenError(res)),
                (resource, closer) => onSuccess(resource, closer)
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => DataOrPromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError> {
        return new UnsafeOnOpenResource<NewType, OpenError>((onOpenError, onSuccess) => {
            this.openFunction(
                error => onOpenError(error),
                (resource, closer) => handleDataOrPromise(resourceConverter(resource), res => onSuccess(res, closer))
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

export function wrapUnsafeOnOpenResource<ResourceType, OpenError>(
    openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
): UnsafeOnOpenResource<ResourceType, OpenError> {
    return new UnsafeOnOpenResource(openFunction)
}
