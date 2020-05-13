/* eslint
    "@typescript-eslint/no-empty-interface": off
*/

import { IInUnsafeOpenableResource, IInUnsafeOpenedResource } from "pareto-api"


/**
 * a resource that can throw errors on both opening and closing
 * This is a tricky resource because closing errors will occur after the resource has been used and therefor normally will not influence the execution path
 * The question is often: what should be done with the closing error
 */
export interface IInUnsafeResource<ResourceType, OpenError, CloseError> extends IInUnsafeOpenableResource<IInUnsafeOpenedResource<ResourceType, CloseError>, OpenError> {}


export interface IUnsafeResource<ResourceType, OpenError, CloseError> extends IInUnsafeResource<ResourceType, OpenError, CloseError> {
}
