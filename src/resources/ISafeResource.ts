import * as api from "pareto-api"
import { ISafeOpenableResource} from "./ISafeOpenableResource"
import { DataOrPromise } from "../promises/ISafePromise"

/**
 * a resource that that does not throw errors either on opening or closing
 */
export interface ISafeResource<ResourceType> extends ISafeOpenableResource<api.ISafeOpenedResource<ResourceType>> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => DataOrPromise<NewType>): ISafeResource<NewType>
}
