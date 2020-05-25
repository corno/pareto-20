import * as api from "pareto-api"
import { ISafeOpenableResource} from "./ISafeOpenableResource"

/**
 * a resource that that does not throw errors either on opening or closing
 */
export interface ISafeResource<ResourceType> extends ISafeOpenableResource<api.ISafeOpenedResource<ResourceType>> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.DataOrPromise<NewType>): ISafeResource<NewType>
}
