import { IInSafePromise, IInUnsafePromise } from "pareto-api"
import { ISafePromise} from "./ISafePromise"

export interface IUnsafePromise<ResultType, ErrorType> extends IInUnsafePromise<ResultType, ErrorType> {
    mapResult<NewResultType>(onSuccess: (result: ResultType) => IInSafePromise<NewResultType>): IUnsafePromise<NewResultType, ErrorType>
    mapResultRaw<NewResultType>(onSuccess: (result: ResultType) => NewResultType): IUnsafePromise<NewResultType, ErrorType>
    mapError<NewErrorType>(onError: (error: ErrorType) => IInSafePromise<NewErrorType>): IUnsafePromise<ResultType, NewErrorType>
    mapErrorRaw<NewErrorType>(onError: (error: ErrorType) => NewErrorType, ): IUnsafePromise<ResultType, NewErrorType>
    try<NewResultType>(onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, ErrorType>): IUnsafePromise<NewResultType, ErrorType>
    tryToCatch<NewErrorType>(onError: (error: ErrorType) => IInUnsafePromise<ResultType, NewErrorType>): IUnsafePromise<ResultType, NewErrorType>
    invert(): IUnsafePromise<ErrorType, ResultType>
    rework<NewResultType, NewErrorType>(
        onError: (error: ErrorType) => IInUnsafePromise<NewResultType, NewErrorType>,
        onSuccess: (result: ResultType) => IInUnsafePromise<NewResultType, NewErrorType>
    ): IUnsafePromise<NewResultType, NewErrorType>
    catch(onError: (error: ErrorType) => ResultType, ): ISafePromise<ResultType>
    reworkAndCatch <NewResultType>(
        onError: (error: ErrorType) => IInSafePromise<NewResultType>,
        onSuccess: (result: ResultType) => IInSafePromise<NewResultType>
    ): ISafePromise<NewResultType>
}
