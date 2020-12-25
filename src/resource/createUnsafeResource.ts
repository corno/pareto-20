import { IUnsafeResource } from "./IUnsafeResource"
import { createUnsafeOnOpenResource } from "./createUnsafeOnOpenResource"
import { createUnsafeOpenedResource } from "./createUnsafeOpenedResource"
import { IUnsafeOnOpenResource } from "./IUnsafeOnOpenResource"
import { IUnsafeOpenedResource } from "./IUnsafeOpenedResource"

class UnsafeResource<ResourceType, OpenError, CloseError> implements IUnsafeResource<ResourceType, OpenError, CloseError> {
    private readonly openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>
    constructor(openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>) {
        this.openFunction = openFunction
    }
    public open(
        onError: (openError: OpenError) => void,
        onOpened: (openedResource: IUnsafeOpenedResource<ResourceType, CloseError>) => void
    ): void {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: (onCloseError: (closeError: CloseError) => void) => void) => {
                onOpened(createUnsafeOpenedResource<ResourceType, CloseError>(resource, closer))
            }
        )
    }

    public suppressCloseError(closeErrorHandler: (error: CloseError) => void): IUnsafeOnOpenResource<ResourceType, OpenError> {
        return createUnsafeOnOpenResource((onOpenError, onSuccess) => {
            this.open(
                onOpenError,
                success => onSuccess(
                    success.content,
                    () => {
                        success.close(closeErrorHandler)
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
): IUnsafeResource<ResourceType, OpenError, CloseError> {
    return new UnsafeResource(openFunction)
}

export function createUnsafeResource<ResourceType, OpenError, CloseError>(
    openFunction: UnsafeFunction<ResourceType, OpenError, CloseError>
): IUnsafeResource<ResourceType, OpenError, CloseError> {
    return new UnsafeResource(openFunction)
}