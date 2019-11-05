import { IInSafeResource } from "pareto-api"

export interface ISafeResource<ResourceType> extends IInSafeResource<ResourceType> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType): ISafeResource<NewType>
}
