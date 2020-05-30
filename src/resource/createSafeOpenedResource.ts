import { ISafeOpenedResource } from "./ISafeOpenedResource"

class SafeOpenedResource<ResourceType> implements ISafeOpenedResource<ResourceType> {
    public readonly resource: ResourceType
    private readonly closer: () => void
    constructor(resource: ResourceType, closer: () => void) {
        this.resource = resource
        this.closer = closer
    }
    public closeSafeOpenedResource(): void {
        this.closer()
    }
}

export type SafeFunction<ResultType> = (
    onSuccessfullyOpened: (
        resource: ResultType,
        close: () => void
    ) => void
) => void

export function createSafeOpenedResource<ResourceType>(
    resource: ResourceType,
    closer: () => void
): ISafeOpenedResource<ResourceType> {
    return new SafeOpenedResource(
        resource,
        closer,
    )
}