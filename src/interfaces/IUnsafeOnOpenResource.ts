import { IInUnsafeOnOpenResource } from "pareto-api"

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => NewErrorType): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => NewType): IUnsafeOnOpenResource<NewType, OpenError>
}
