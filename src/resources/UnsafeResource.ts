import { IUnsafeResource } from "./IUnsafeResource"
import { UnsafeOpenedResource } from "./UnsafeOpenedResource"

export class UnsafeResource<ResourceType, OpenError, CloseError> implements IUnsafeResource<ResourceType, OpenError, CloseError> {
    private readonly openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>
    constructor(openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>) {
        this.openFunction = openFunction
    }
    public open(onError: (openError: OpenError) => void, onOpened: (openedResource: UnsafeOpenedResource<ResourceType, CloseError>) => void) {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: (onCloseError: (closeError: CloseError) => void) => void) => {
                onOpened(new UnsafeOpenedResource<ResourceType, CloseError>(resource, closer))
            }
        )
    }
}

export type UnsafeFunction<ResultType, OpenError, CloseError> = (
    onOpenError: (error: OpenError) => void,
    onSuccessfullyOpened: (
        resource: ResultType,
        close: (onCloseError: (closeError: CloseError) => void) => void
    ) => void
) => void

export function wrapUnsafeResource<ResourceType, OpenError, CloseError>(openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>) {
    return new UnsafeResource<ResourceType, OpenError, CloseError>(openFunction)
}
