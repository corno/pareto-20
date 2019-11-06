import { ISafeOpenedResource } from "./ISafeOpenedResource"

export class SafeOpenedResource<ResourceType> implements ISafeOpenedResource<ResourceType> {
    public readonly resource: ResourceType
    private readonly closer: () => void
    constructor(resource: ResourceType, closer: () => void) {
        this.resource = resource
        this.closer = closer
    }
    public closeSafeOpenedResource() {
        this.closer()
    }
}

export type SafeFunction<ResultType> = (
    onSuccessfullyOpened: (
        resource: ResultType,
        close: () => void
    ) => void
) => void
