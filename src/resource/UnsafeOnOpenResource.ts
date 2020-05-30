import * as api from "pareto-api"
import { IValue, SafeCallerFunction } from "../value/ISafeValue"
import { Value } from "../value/SafeValue"
import { IUnsafeOnOpenResource } from "./IUnsafeOnOpenResource"
import { SafeOpenedResource } from "./SafeOpenedResource"

export class UnsafeOnOpenResource<ResourceType, OpenError> implements IUnsafeOnOpenResource<ResourceType, OpenError> {
    private readonly openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
    constructor(openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>) {
        this.openFunction = openFunction
    }
    public openUnsafeOpenableResource(
        onError: (openError: OpenError) => void,
        onOpened: (openedResource: SafeOpenedResource<ResourceType>) => void
    ): void {
        this.openFunction(
            onError,
            (resource: ResourceType, closer: () => void) => {
                onOpened(new SafeOpenedResource<ResourceType>(resource, closer))
            }
        )
    }

    public with<ResultType>(
        onOpenError: (error: OpenError) => api.IValue<ResultType>,
        onOpenSuccess: (openReource: ResourceType) => api.IValue<ResultType>
    ): IValue<ResultType> {
        const newFunc: SafeCallerFunction<ResultType> = onResult => {
            this.openUnsafeOpenableResource(
                err => {
                    onOpenError(err).handle(onResult)
                },
                res => {
                    onOpenSuccess(res.resource).handle(onResult)
                    res.closeSafeOpenedResource()
                }
            )
        }
        return new Value<ResultType>(newFunc)
    }
    public mapOpenError<NewErrorType>(errorConverter: (openError: OpenError) => api.IValue<NewErrorType>): IUnsafeOnOpenResource<ResourceType, NewErrorType> {
        return new UnsafeOnOpenResource<ResourceType, NewErrorType>((onOpenError, onSuccess) => {
            this.openFunction(
                error => errorConverter(error).handle(res => onOpenError(res)),
                (resource, closer) => onSuccess(resource, closer)
            )
        })
    }
    public mapResource<NewType>(resourceConverter: (resource: ResourceType) => api.IValue<NewType>): IUnsafeOnOpenResource<NewType, OpenError> {
        return new UnsafeOnOpenResource<NewType, OpenError>((onOpenError, onSuccess) => {
            this.openFunction(
                error => onOpenError(error),
                (resource, closer) => resourceConverter(resource).handle(res => onSuccess(res, closer))
            )
        })
    }
}

export type UnsafeOnOpenFunction<ResultType, OpenError> = (
    onOpenError: (error: OpenError) => void,
    onSuccessfullyOpened: (
        resource: ResultType,
        close: () => void
    ) => void
) => void

export function wrapUnsafeOnOpenResource<ResourceType, OpenError>(
    openFunction: UnsafeOnOpenFunction<ResourceType, OpenError>
): UnsafeOnOpenResource<ResourceType, OpenError> {
    return new UnsafeOnOpenResource(openFunction)
}
