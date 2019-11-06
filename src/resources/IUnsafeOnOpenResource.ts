import { IInSafePromise, IInUnsafeOnOpenResource } from "pareto-api"

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => IInSafePromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
}
