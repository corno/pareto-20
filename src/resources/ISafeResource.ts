import { IInSafeResource, IInSafePromise } from "pareto-api"

export interface ISafeResource<ResourceType> extends IInSafeResource<ResourceType> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): ISafeResource<NewType>
}
