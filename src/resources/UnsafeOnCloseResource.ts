import { IUnsafeOnCloseResource } from "./IUnsafeOnCloseResource"
import { UnsafeOnCloseFunction, UnsafeOpenedResource } from "./UnsafeOpenedResource"
import { IInSafePromise } from "pareto-api"
import { SafeResource } from "./SafeResource"
import { ISafeResource } from "./ISafeResource"

export class UnsafeOnCloseResource<ResourceType, CloseError> implements IUnsafeOnCloseResource<ResourceType, CloseError> {
    private readonly openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>
    constructor(openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>) {
        this.openFunction = openFunction
    }
    public openSafeOpenableResource(onOpened: (openedResource: UnsafeOpenedResource<ResourceType, CloseError>) => void) {
        this.openFunction(
            (resource: ResourceType, closer: (onError: (error: CloseError) => void) => void) => {
                onOpened(new UnsafeOpenedResource<ResourceType, CloseError>(resource, closer))
            }
        )
    }
    public mapCloseError<NewErrorType>(errorConverter: (closeError: CloseError) => NewErrorType) {
        return new UnsafeOnCloseResource<ResourceType, NewErrorType>(onOpened => {
            this.openFunction(
                (resource, closer) => onOpened(resource, errorCallback => closer(oldCloseError => errorCallback(errorConverter(oldCloseError))))
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): IUnsafeOnCloseResource<NewType, CloseError> {
        return new UnsafeOnCloseResource<NewType, CloseError>(onOpened => {
            this.openFunction(
                (resource, closer) => resourceConverter(resource).handleSafePromise(res => onOpened(res, closer))
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

export function wrapUnsafeOnCloseResource<ResourceType, CloseError>(openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>) {
    return new UnsafeOnCloseResource<ResourceType, CloseError>(openFunction)
}
