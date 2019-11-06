import { IInSafeOpenedResource, IInSafePromise, IInUnsafeOpenableResource } from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"


/**
 * a resource that can throw errors on opening but not on closing
 */
export interface IInUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOpenableResource<IInSafeOpenedResource<ResourceType>, OpenError> { }

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => IInSafePromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
    with<ResultType>(
        onOpenError: (error: OpenError) => IInSafePromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => IInSafePromise<ResultType>
    ): ISafePromise<ResultType>
}
