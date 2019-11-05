import { IUnsafeOpenedResource } from "../../interfaces/IUnsafeOpenedResource"

export class UnsafeOpenedResource<ResourceType, CloseError> implements IUnsafeOpenedResource<ResourceType, CloseError> {
    public readonly resource: ResourceType
    private readonly closer: (onCloseError: (error: CloseError) => void) => void
    constructor(resource: ResourceType, closer: (onCloseError: (error: CloseError) => void) => void) {
        this.resource = resource
        this.closer = closer
    }
    public close(onCloseError: (error: CloseError) => void) {
        this.closer(onCloseError)
    }
}

export type UnsafeOnCloseFunction<ResultType, CloseError> = (
    onSuccessfullyOpened: (
        resource: ResultType,
        close: (onError: (error: CloseError) => void) => void
    ) => void
) => void
