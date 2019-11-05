import { IUnsafeOnCloseResource } from "./IUnsafeOnCloseResource"
import { UnsafeOnCloseFunction, UnsafeOpenedResource } from "./UnsafeOpenedResource"

export class UnsafeOnCloseResource<ResourceType, CloseError> implements IUnsafeOnCloseResource<ResourceType, CloseError> {
    private readonly openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>
    constructor(openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>) {
        this.openFunction = openFunction
    }
    public open(onOpened: (openedResource: UnsafeOpenedResource<ResourceType, CloseError>) => void) {
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
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType) {
        return new UnsafeOnCloseResource<NewType, CloseError>(onOpened => {
            this.openFunction(
                (resource, closer) => onOpened(resourceConverter(resource), closer)
            )
        })
    }
}

export function wrapUnsafeOnCloseResource<ResourceType, CloseError>(openFunction: UnsafeOnCloseFunction<ResourceType, CloseError>) {
    return new UnsafeOnCloseResource<ResourceType, CloseError>(openFunction)
}
