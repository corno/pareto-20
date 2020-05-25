import * as api from "pareto-api"
import { ISafeResource } from "./ISafeResource"
import { SafeFunction, SafeOpenedResource } from "./SafeOpenedResource"
import { handleDataOrPromise } from "../promises/SafePromise"

export class SafeResource<ResourceType> implements ISafeResource<ResourceType> {
    private readonly openFunction: SafeFunction<ResourceType>
    constructor(openFunction: SafeFunction<ResourceType>) {
        this.openFunction = openFunction
    }
    public openSafeOpenableResource(onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void): void {
        this.openFunction(
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.DataOrPromise<NewType>): ISafeResource<NewType> {
        return new SafeResource<NewType>(onSuccess => {
            this.openFunction(
                (resource, closer) => handleDataOrPromise(resourceConverter(resource), res => onSuccess(res, closer))
            )
        })
    }
}

export function wrapSafeResource<ResourceType>(openFunction: SafeFunction<ResourceType>): ISafeResource<ResourceType> {
    return new SafeResource<ResourceType>(openFunction)
}
