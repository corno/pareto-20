import { IInSafePromise, IInUnsafeOnCloseResource } from "pareto-api"

export interface IUnsafeOnCloseResource<ResourceType, CloseError> extends IInUnsafeOnCloseResource<ResourceType, CloseError> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): IUnsafeOnCloseResource<NewType, CloseError>
}
