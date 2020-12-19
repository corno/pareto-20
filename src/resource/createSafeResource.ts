import * as api from "pareto-api"
import { ISafeResource } from "./ISafeResource"
import { SafeFunction, createSafeOpenedResource } from "./createSafeOpenedResource"
import { ISafeOpenedResource } from "./ISafeOpenedResource"

class SafeResource<ResourceType> implements ISafeResource<ResourceType> {
    private readonly openFunction: SafeFunction<ResourceType>
    constructor(openFunction: SafeFunction<ResourceType>) {
        this.openFunction = openFunction
    }
    public open(onOpened: (openedResource: ISafeOpenedResource<ResourceType>) => void): void {
        this.openFunction(
            (resource: ResourceType, closer: () => void) => {
                onOpened(createSafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.IValue<NewType>): ISafeResource<NewType> {
        return new SafeResource<NewType>(onSuccess => {
            this.openFunction(
                (resource, closer) => resourceConverter(resource).handle(res => onSuccess(res, closer))
            )
        })
    }
}

export function createSafeResource<ResourceType>(openFunction: SafeFunction<ResourceType>): ISafeResource<ResourceType> {
    return new SafeResource<ResourceType>(openFunction)
}
