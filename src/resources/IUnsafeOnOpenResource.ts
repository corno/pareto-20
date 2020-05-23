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
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => api.ISafePromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.ISafePromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
    with<ResultType>(
        onOpenError: (error: OpenError) => api.ISafePromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => api.ISafePromise<ResultType>
    ): ISafePromise<ResultType>
}
