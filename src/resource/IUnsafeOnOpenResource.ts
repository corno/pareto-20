/* eslint
    "@typescript-eslint/no-empty-interface": off
*/
import * as api from "pareto-api"
import { IValue } from "../value/ISafeValue"

/**
 * a resource that can throw errors on opening but not on closing
 */
export interface IInUnsafeOnOpenResource<ResourceType, OpenError> extends api.IUnsafeOpenableResource<api.ISafeOpenedResource<ResourceType>, OpenError> { }

export interface IUnsafeOnOpenResource<ResourceType, OpenError> extends IInUnsafeOnOpenResource<ResourceType, OpenError> {
    mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => api.IValue<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType>
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.IValue<NewType>): IUnsafeOnOpenResource<NewType, OpenError>
    with<ResultType>(
        onOpenError: (error: OpenError) => api.IValue<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => api.IValue<ResultType>
    ): IValue<ResultType>
}
