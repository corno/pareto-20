import { ISafeOpenedResource, IUnsafeOnOpenResource } from "pareto"

export class SafeOpenedResource<ResourceType> implements ISafeOpenedResource<ResourceType> {
    public readonly resource: ResourceType
    private readonly closer: () => void
    constructor(resource: ResourceType, closer: () => void) {
        this.resource = resource
        this.closer = closer
    }
    public close() {
        this.closer()
    }
}

// tslint:disable-next-line: max-classes-per-file
export class UnsafeOnOpenResource<ResourceType, OpenError> implements IUnsafeOnOpenResource<ResourceType, OpenError> {
    private readonly openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
    constructor(openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>) {
        this.openFunction = openFunction
    }
    public open(onError: (openError: OpenError) => void, onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void) {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }
    public mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => NewErrorType) {
        return new UnsafeOnOpenResource<ResourceType, NewErrorType>((onOpenError, onSuccess) => {
            this.openFunction(
                error => onOpenError(errorConverter(error)),
                (resource, closer) => onSuccess(resource, closer)
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType) {
        return new UnsafeOnOpenResource<NewType, OpenError>((onOpenError, onSuccess) => {
            this.openFunction(
                error => onOpenError(error),
                (resource, closer) => onSuccess(resourceConverter(resource), closer)
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
