import * as api from "pareto-api"
import { ISafeResource } from "./ISafeResource"

/**
 * a resource that can throw errors on closing but not on opening. This case is quite exceptional but added for completeness
 */
export interface IUnsafeOnCloseResource<ResourceType, CloseError> extends api.ISafeOpenableResource<api.IUnsafeOpenedResource<ResourceType, CloseError>> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.IValue<NewType>): IUnsafeOnCloseResource<NewType, CloseError>

    suppressCloseError(closeErrorHandler: (error: CloseError) => void): ISafeResource<ResourceType>
}
