/* eslint
    "@typescript-eslint/no-empty-interface": off
*/
import { IInSafeOpenableResource } from "pareto-api"

export interface ISafeOpenableResource<OpenedResource> extends IInSafeOpenableResource<OpenedResource> {
}
