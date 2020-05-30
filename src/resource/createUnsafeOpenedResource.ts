import { IUnsafeOpenedResource } from "./IUnsafeOpenedResource"

class UnsafeOpenedResource<ResourceType, CloseError> implements IUnsafeOpenedResource<ResourceType, CloseError> {
    public readonly resource: ResourceType
    private readonly closer: (onCloseError: (error: CloseError) => void) => void
    constructor(resource: ResourceType, closer: (onCloseError: (error: CloseError) => void) => void) {
        this.resource = resource
        this.closer = closer
    }
    public closeUnsafeOpenedResource(onCloseError: (error: CloseError) => void): void {
        this.closer(onCloseError)
    }
}

export type UnsafeOnCloseFunction<ResultType, CloseError> = (
    onSuccessfullyOpened: (
        resource: ResultType,
        close: (onError: (error: CloseError) => void) => void
    ) => void
) => void

export function createUnsafeOpenedResource<ResourceType, CloseError>(
    resource: ResourceType,
    closer: (onCloseError: (error: CloseError) => void) => void
): IUnsafeOpenedResource<ResourceType, CloseError> {
    return new UnsafeOpenedResource(resource, closer)
}