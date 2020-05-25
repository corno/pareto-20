import { ISafeResource } from "./ISafeResource"
import { IUnsafeOnCloseResource } from "./IUnsafeOnCloseResource"
import { SafeResource } from "./SafeResource"
import { UnsafeOnCloseFunction, UnsafeOpenedResource } from "./UnsafeOpenedResource"
import { DataOrPromise } from "../promises/ISafePromise"
import { handleDataOrPromise } from "../promises/SafePromise"

export class UnsafeOnCloseResource<ResourceType, CloseError> implements IUnsafeOnCloseResource<ResourceType, CloseError> {
    private readonly openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>
    constructor(openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>) {
        this.openFunction = openFunction
    }
    public openSafeOpenableResource(
        onOpened: (openedResource: UnsafeOpenedResource<ResourceType, CloseError>) => void
    ): void {
        this.openFunction(
            (resource: ResourceType, closer: (onError: (error: CloseError) => void) => void) => {
                onOpened(new UnsafeOpenedResource<ResourceType, CloseError>(resource, closer))
            }
        )
    }
    public mapCloseError<NewErrorType>(
        errorConverter: (closeError: CloseError) => NewErrorType
    ): UnsafeOnCloseResource<ResourceType, NewErrorType> {
        return new UnsafeOnCloseResource(onOpened => {
            this.openFunction(
                (resource, closer) => onOpened(resource, errorCallback => closer(oldCloseError => errorCallback(errorConverter(oldCloseError))))
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => DataOrPromise<NewType>): IUnsafeOnCloseResource<NewType, CloseError> {
        return new UnsafeOnCloseResource<NewType, CloseError>(onOpened => {
            this.openFunction(
                (resource, closer) => handleDataOrPromise(resourceConverter(resource), res => onOpened(res, closer))
            )
        })
    }
    public suppressCloseError(closeErrorHandler: (error: CloseError) => void): ISafeResource<ResourceType> {
        return new SafeResource<ResourceType>(onOpened => {
            this.openSafeOpenableResource(
                success => onOpened(
                    success.resource,
                    () => {
                        success.closeUnsafeOpenedResource(closeErrorHandler)
                    }
                )
            )
        })
    }
}

export function wrapUnsafeOnCloseResource<ResourceType, CloseError>(
    openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>
): UnsafeOnCloseResource<ResourceType, CloseError> {
    return new UnsafeOnCloseResource(openFunction)
}
