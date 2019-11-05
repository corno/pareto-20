import { IInUnsafeResource } from "pareto-api"

export interface IUnsafeResource<ResourceType, OpenError, CloseError> extends IInUnsafeResource<ResourceType, OpenError, CloseError> {
}
