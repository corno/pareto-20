/* eslint
    "@typescript-eslint/no-empty-interface": off
*/
import * as api from "pareto-api"
import { ISafePromise } from "../promises/ISafePromise"

/**
 * a resource that can throw errors on opening but not on closing
 */
export interface IInUnsafeOnOpenResource<ResourceType, OpenError> extends api.IUnsafeOpenableResource<api.ISafeOpenedResource<ResourceType>, OpenError> { }

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => api.DataOrPromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.DataOrPromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
    with<ResultType>(
        onOpenError: (error: OpenError) => api.DataOrPromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => api.DataOrPromise<ResultType>
    ): ISafePromise<ResultType>
}
