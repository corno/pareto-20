/* eslint
    "@typescript-eslint/no-empty-interface": off
*/
import * as api from "pareto-api"
import { ISafePromise, DataOrPromise } from "../promises/ISafePromise"

/**
 * a resource that can throw errors on opening but not on closing
 */
export interface IInUnsafeOnOpenResource<ResourceType, OpenError> extends api.IUnsafeOpenableResource<api.ISafeOpenedResource<ResourceType>, OpenError> { }

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => DataOrPromise<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => DataOrPromise<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
    with<ResultType>(
        onOpenError: (error: OpenError) => DataOrPromise<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => DataOrPromise<ResultType>
    ): ISafePromise<ResultType>
}
