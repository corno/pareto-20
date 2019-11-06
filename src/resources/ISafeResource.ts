import { IInSafeOpenedResource, IInSafePromise } from "pareto-api"
import { ISafeOpenableResource} from "./ISafeOpenableResource"

/**
 * a resource that that does not throw errors either on opening or closing
 */
export interface ISafeResource<ResourceType> extends ISafeOpenableResource<IInSafeOpenedResource<ResourceType>> {
    mapResource<NewType>(resourceConverter: (resource: ResourceType) => IInSafePromise<NewType>): ISafeResource<NewType>
}
