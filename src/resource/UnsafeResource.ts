import { IUnsafeResource } from "./IUnsafeResource"
import { UnsafeOnOpenResource } from "./UnsafeOnOpenResource"
import { UnsafeOpenedResource } from "./UnsafeOpenedResource"

export class UnsafeResource<ResourceType, OpenError, CloseError> implements IUnsafeResource<ResourceType, OpenError, CloseError> {
    private readonly openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>
    constructor(openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>) {
        this.openFunction = openFunction
    }
    public openUnsafeOpenableResource(
        onError: (openError: OpenError) => void,
        onOpened: (openedResource: UnsafeOpenedResource<ResourceType, CloseError>) => void
    ): void {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: (onCloseError: (closeError: CloseError) => void) => void) => {
                onOpened(new UnsafeOpenedResource<ResourceType, CloseError>(resource, closer))
            }
        )
    }

    public suppressCloseError(closeErrorHandler: (error: CloseError) => void): UnsafeOnOpenResource<ResourceType, OpenError> {
        return new UnsafeOnOpenResource((onOpenError, onSuccess) => {
            this.openUnsafeOpenableResource(
                onOpenError,
                success => onSuccess(
                    success.resource,
                    () => {
                        success.closeUnsafeOpenedResource(closeErrorHandler)
                    }
                )
            )
        })
    }
}

export type UnsafeFunction<ResultType, OpenError, CloseError> = (
    onOpenError: (error: OpenError) => void,
    onSuccessfullyOpened: (
        resource: ResultType,
        close: (onCloseError: (closeError: CloseError) => void) => void
    ) => void
) => void

export function wrapUnsafeResource<ResourceType, OpenError, CloseError>(
    openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>
): UnsafeResource<ResourceType, OpenError, CloseError> {
    return new UnsafeResource(openFunction)
}
