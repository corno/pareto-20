import { IInSafePromise, IInUnsafePromise } from "pareto-api"

export interface IUnsafePromise<ResultType, ErrorType> extends IInUnsafePromise<ResultType, ErrorType> {
    mapResultRaw<NewResultType>(onSuccess: (result: ResultType) => NewResultType): IUnsafePromise<NewResultType, ErrorType>
    mapResult<NewResultType>(onSuccess: (result: ResultType) => IInSafePromise<NewResultType>): IUnsafePromise<NewResultType, ErrorType>
    mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType, ): IUnsafePromise<ResultType, NewErrorType>
    try<NewResultType>(onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>): IUnsafePromise<NewResultType, ErrorType>
    tryToCatch<NewErrorType>(onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>): IUnsafePromise<ResultType, NewErrorType>
    invert(): IUnsafePromise<ErrorType, ResultType>
    rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, NewErrorType>
    ): IUnsafePromise<NewResultType, NewErrorType>
}
