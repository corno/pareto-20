import { ISafeResource } from "../../interfaces/ISafeResource"
import { SafeFunction, SafeOpenedResource } from "./SafeOpenedResource"

export class SafeResource<ResourceType> implements ISafeResource<ResourceType> {
    private readonly openFunction: SafeFunction<ResourceType>
    constructor(openFunction: SafeFunction<ResourceType>) {
        this.openFunction = openFunction
    }
    public open(onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void) {
        this.openFunction(
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType) {
        return new SafeResource<NewType>(onSuccess => {
            this.openFunction(
                (resource, closer) => onSuccess(resourceConverter(resource), closer)
            )
        })
    }
}

export function wrapSafeResource<ResourceType>(openFunction: SafeFunction<ResourceType>) {
    return new SafeResource<ResourceType>(openFunction)
}
