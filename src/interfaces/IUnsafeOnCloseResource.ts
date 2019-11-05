import { IInUnsafeOnCloseResource } from "pareto-api"

export interface IUnsafeOnCloseResource<ResourceType, CloseError> extends IInUnsafeOnCloseResource<ResourceType, CloseError> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType): IUnsafeOnCloseResource<NewType, CloseError>
}
