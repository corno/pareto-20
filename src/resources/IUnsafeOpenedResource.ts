/* eslint
    "@typescript-eslint/no-empty-interface": off
*/
import { IInUnsafeOpenedResource } from "pareto-api"

export interface IUnsafeOpenedResource<ResourceType, CloseError> extends IInUnsafeOpenedResource<ResourceType, CloseError> {
}
